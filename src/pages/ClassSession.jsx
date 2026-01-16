"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, Link } from "react-router-dom"
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "../firebase"
import { generateQuickAssist, generateClassSummary, generateQuiz } from "../utils/groq" 
import ReactMarkdown from 'react-markdown' 
import { 
  ChevronLeft, Users, Mic, Square, Download, 
  Zap, Play, Activity, Clock, Pause, Send, FileQuestion, CheckCircle
} from "lucide-react" 
import "./ClassSession.css"

function ClassSession() {
  const { classId } = useParams()
  const [classData, setClassData] = useState(null)
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)

  // -- VOICE & AI STATE --
  const [isRecording, setIsRecording] = useState(false)
  const [activeTool, setActiveTool] = useState(null) // 'quick' | 'full'
  
  // State for display
  const [quickTranscript, setQuickTranscript] = useState("") 
  const [fullTranscript, setFullTranscript] = useState("") 
  
  // REFS FOR INSTANT ACCESS
  const transcriptBuffer = useRef("") 
  const recognitionRef = useRef(null)

  const [quickResult, setQuickResult] = useState(null)
  const [fullResult, setFullResult] = useState(null)
  const [quizResult, setQuizResult] = useState(null) 
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [sendingStatus, setSendingStatus] = useState(null) 

  // --- INITIALIZE SPEECH ---
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true; 
      recognitionRef.current.interimResults = true; 

      recognitionRef.current.onresult = (event) => {
        let finalChunk = "";
        let interimChunk = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalChunk += event.results[i][0].transcript + " ";
          } else {
            interimChunk += event.results[i][0].transcript;
          }
        }

        if (finalChunk) transcriptBuffer.current += finalChunk;

        if (activeTool === 'full') {
             setFullTranscript(transcriptBuffer.current + interimChunk);
        } else {
             setQuickTranscript(transcriptBuffer.current + interimChunk);
        }
      };

      recognitionRef.current.onerror = (event) => {
          console.error("Speech Error:", event.error);
          if (event.error === 'not-allowed') {
              alert("Microphone access denied. Please allow permission.");
              setIsRecording(false);
          }
      };
    }
  }, [activeTool]);

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        const classSnap = await getDoc(doc(db, "classes", classId))
        if (classSnap.exists()) {
          setClassData(classSnap.data())
          const q = query(collection(db, "users"), where("enrolledClassId", "==", classId))
          const snap = await getDocs(q)
          setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        }
      } catch (err) { console.error(err) } 
      finally { setLoading(false) }
    }
    if(classId) fetchSessionData()
  }, [classId])

  // --- NEW: SAVE TO HISTORY (FIREBASE) ---
  const saveToHistory = async (type, input, output) => {
      try {
          // Saves to: classes/{classId}/history/{autoId}
          await addDoc(collection(db, "classes", classId, "history"), {
              type: type, // 'quick_assist', 'summary', or 'quiz'
              inputQuery: input || "No input",
              aiResponse: output,
              timestamp: serverTimestamp(),
              title: type === 'quick_assist' ? 'Quick Explainer' : (type === 'quiz' ? 'Class Quiz' : 'Session Summary')
          });
          console.log(`Saved ${type} to history.`);
      } catch (error) {
          console.error("Failed to save history:", error);
      }
  }

  // --- SPEECH HANDLERS ---
  const startTool = (toolName) => {
    setActiveTool(toolName);
    setIsRecording(true);
    
    if(toolName === 'quick') {
        setQuickTranscript("");
        setQuickResult(null);
    }
    
    transcriptBuffer.current = toolName === 'full' ? fullTranscript : ""; 
    
    try {
        recognitionRef.current.start();
    } catch(e) { console.warn("Mic already on", e); }
  }

  const stopTool = async () => {
    setIsRecording(false);
    if(recognitionRef.current) recognitionRef.current.stop();
    
    const textToCheck = transcriptBuffer.current;
    
    setTimeout(async () => {
        if(!textToCheck.trim()) {
            if ((activeTool === 'quick' && !quickTranscript) || (activeTool === 'full' && !fullTranscript)) {
                return alert("No speech detected. Try speaking closer to the mic.");
            }
        }

        setIsProcessing(true);

        try {
          let resultText = "";
          const finalText = textToCheck || (activeTool === 'full' ? fullTranscript : quickTranscript);

          if (activeTool === 'quick') {
             resultText = await generateQuickAssist(finalText);
             setQuickResult(resultText);
             // SAVE TO HISTORY
             await saveToHistory('quick_assist', finalText, resultText);
          } 
          else if (activeTool === 'full') {
             setFullTranscript(finalText); 
             resultText = await generateClassSummary(finalText);
             setFullResult(resultText);
             // SAVE TO HISTORY
             await saveToHistory('summary', finalText, resultText);
          }
        } catch (error) {
          console.error(error);
          alert("AI Error. Please check console.");
        } finally {
          setIsProcessing(false);
        }
    }, 1000);
  }

  // --- QUIZ GENERATOR ---
  const handleGenerateQuiz = async () => {
    if(!fullTranscript && !transcriptBuffer.current) return alert("Record a session first!");
    
    setIsProcessing(true);
    try {
        const sourceText = fullTranscript || transcriptBuffer.current;
        const quiz = await generateQuiz(sourceText);
        setQuizResult(quiz);
        // SAVE TO HISTORY
        await saveToHistory('quiz', sourceText, quiz);
    } catch(err) {
        console.error(err);
    } finally {
        setIsProcessing(false);
    }
  }

  // --- SEND TO STUDENTS ---
  const sendToStudents = async (type, content) => {
      if(!content) return;
      setSendingStatus('sending');
      
      try {
          const promises = students.map(student => {
              return addDoc(collection(db, "users", student.id, "classMaterials"), {
                  type: type, 
                  content: content,
                  classId: classId,
                  timestamp: serverTimestamp(),
                  read: false,
                  title: type === 'summary' ? `Summary: ${classData.batch}` : `Quiz: ${classData.batch}`
              })
          });

          await Promise.all(promises);
          setSendingStatus('sent');
          setTimeout(() => setSendingStatus(null), 3000); 
      } catch (err) {
          console.error("Error sending:", err);
          alert("Failed to send to students.");
          setSendingStatus(null);
      }
  }

  const downloadSummary = () => {
    if (!fullResult) return;
    const element = document.createElement("a");
    const file = new Blob([fullResult], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = "ClassSummary.md";
    document.body.appendChild(element);
    element.click();
  }

  if (loading) return <div className="session-loading">Loading Session Data...</div>

  return (
    <div className="class-session-container">
      
      {/* ANIMATED OVERLAY */}
      {isProcessing && (
        <div className="processing-overlay">
           <div className="loader-box">
              <div className="spinner"></div>
              <h3>AI at Work...</h3>
              <p>Analyzing & Saving to History.</p>
           </div>
        </div>
      )}

      {/* SUCCESS TOAST */}
      {sendingStatus === 'sent' && (
          <div className="toast-notification">
              <CheckCircle size={20} /> Sent to all {students.length} students!
          </div>
      )}

      <aside className="session-sidebar">
        <div className="sidebar-brand">
            <div className="brand-icon">S</div>
        </div>
        <nav className="sidebar-nav">
          <Link to="/classes" className="nav-link active"><Users size={20}/></Link>
          <div className="nav-divider"></div>
          <Link to="/dashboard" className="nav-link exit"><ChevronLeft size={20}/></Link>
        </nav>
      </aside>

      <main className="session-main">
        <header className="session-header">
           <div className="header-content">
              <div className="batch-badge">Live Class</div>
              <h1>{classData.batch}</h1>
              <p className="meta-info">{classData.subject} • {classData.startTime || "Started Just Now"}</p>
           </div>
           <div className="header-actions">
              <div className="pulse-indicator"><span className="pulse-dot"></span> On Air</div>
           </div>
        </header>

        <div className="session-grid">
           
           {/* === QUICK ASSIST === */}
           <div className="tool-card quick-assist">
              <div className="card-header">
                 <div className="icon-badge orange"><Zap size={20}/></div>
                 <div className="header-text"><h3>Quick Explainer</h3><p>Instant definitions.</p></div>
              </div>
              <div className="card-content">
                  <div className={`transcript-viewer ${activeTool === 'quick' && isRecording ? 'listening' : ''}`}>
                      {activeTool === 'quick' && isRecording ? (
                          <span className="live-text">{quickTranscript || "Listening..."}</span>
                      ) : (
                          <span className="placeholder-text">Tap mic to ask (e.g., "Explain Photosynthesis")</span>
                      )}
                  </div>
                  <button 
                    className={`control-btn ${isRecording && activeTool === 'quick' ? 'stop-btn' : 'start-btn'}`}
                    onClick={() => (isRecording && activeTool === 'quick') ? stopTool() : startTool('quick')}
                    disabled={isRecording && activeTool !== 'quick'}
                  >
                     {isRecording && activeTool === 'quick' ? <Square size={18}/> : <Mic size={18}/>}
                     {isRecording && activeTool === 'quick' ? "Stop & Generate" : "Ask AI"}
                  </button>
                  {quickResult && (
                      <div className="ai-result slide-up">
                          <div className="result-label">AI Response (Saved)</div>
                          <div className="markdown-body">
                             <ReactMarkdown>{quickResult}</ReactMarkdown>
                          </div>
                      </div>
                  )}
              </div>
           </div>

           {/* === SESSION SCRIBE & QUIZ === */}
           <div className="tool-card session-scribe">
              <div className="card-header">
                 <div className="icon-badge blue"><Activity size={20}/></div>
                 <div className="header-text"><h3>Session Scribe & Quiz</h3><p>Record, Summarize & Evaluate.</p></div>
              </div>

              <div className="card-content">
                  {/* RECORDER */}
                  {activeTool === 'full' && isRecording ? (
                      <div className="recording-visualizer">
                          <div className="sound-wave"><span></span><span></span><span></span><span></span><span></span></div>
                          <p>Recording... {fullTranscript.length > 50 ? fullTranscript.substring(fullTranscript.length - 50) + "..." : "Listening"}</p>
                      </div>
                  ) : (
                      <div className="idle-state"><Clock size={16}/> <span>Ready to capture session</span></div>
                  )}

                  <button 
                    className={`control-btn ${isRecording && activeTool === 'full' ? 'stop-btn' : 'start-btn-blue'}`}
                    onClick={() => (isRecording && activeTool === 'full') ? stopTool() : startTool('full')}
                    disabled={isRecording && activeTool !== 'full'}
                  >
                     {isRecording && activeTool === 'full' ? <Pause size={18}/> : <Play size={18}/>}
                     {isRecording && activeTool === 'full' ? "End & Generate Summary" : "Start Recording Class"}
                  </button>

                  {/* SUMMARY RESULT */}
                  {fullResult && (
                      <div className="ai-result slide-up">
                          <div className="result-actions">
                             <span className="result-label">Class Summary (Saved)</span>
                             <div className="action-row">
                                 <button onClick={downloadSummary} className="icon-btn" title="Download"><Download size={16}/></button>
                                 <button onClick={() => sendToStudents('summary', fullResult)} className="icon-btn highlight" title="Send to Students">
                                    <Send size={16}/> Send
                                 </button>
                             </div>
                          </div>
                          
                          {/* MARKDOWN RENDERER */}
                          <div className="result-text scrollable markdown-body">
                              <ReactMarkdown>{fullResult}</ReactMarkdown>
                          </div>

                          {/* QUIZ SECTION (Only appears after summary) */}
                          <div className="quiz-section">
                             <div className="quiz-header">
                                <span>Next Step:</span>
                             </div>
                             {!quizResult ? (
                                 <button className="secondary-btn" onClick={handleGenerateQuiz}>
                                     <FileQuestion size={16}/> Generate Quiz from Transcript
                                 </button>
                             ) : (
                                 <div className="quiz-preview">
                                     <div className="result-actions">
                                        <span className="result-label">Generated Quiz (Saved)</span>
                                        <button onClick={() => sendToStudents('quiz', quizResult)} className="icon-btn highlight">
                                            <Send size={16}/> Send Quiz
                                        </button>
                                     </div>
                                     <div className="markdown-body mini-scroll">
                                         <ReactMarkdown>{quizResult}</ReactMarkdown>
                                     </div>
                                 </div>
                             )}
                          </div>
                      </div>
                  )}
              </div>
           </div>

           {/* === STUDENTS === */}
           <div className="tool-card full-span student-section">
              <div className="card-header-simple">
                  <h3>Active Students</h3>
                  <span className="count-badge">{students.length}</span>
              </div>
              <div className="student-list">
                 {students.length === 0 ? <p className="empty-msg">Waiting for students to join...</p> : 
                    students.map(st => (
                       <div key={st.id} className="student-chip">
                          <div className="avatar">{st.name?.charAt(0) || "S"}</div>
                          <span className="name">{st.name}</span>
                          <div className="status-dot online"></div>
                       </div>
                    ))
                 }
              </div>
           </div>

        </div>
      </main>
    </div>
  )
}

export default ClassSession