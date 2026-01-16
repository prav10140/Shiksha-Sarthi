"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, Link } from "react-router-dom"
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "../firebase"
import { generateQuickAssist, generateClassSummary, generateQuiz } from "../utils/groq" // Added generateQuiz
import ReactMarkdown from 'react-markdown' // Import the renderer
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
  
  const [quickTranscript, setQuickTranscript] = useState("") 
  const [fullTranscript, setFullTranscript] = useState("") 
  
  const [quickResult, setQuickResult] = useState(null)
  const [fullResult, setFullResult] = useState(null)
  const [quizResult, setQuizResult] = useState(null) // New State for Quiz
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [sendingStatus, setSendingStatus] = useState(null) // 'sending' | 'sent' | null

  const recognitionRef = useRef(null)

  // --- INITIALIZE SPEECH ---
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            const final = event.results[i][0].transcript + ' ';
            if (activeTool === 'full') setFullTranscript(prev => prev + final);
            else setQuickTranscript(final); 
          }
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

  // --- SPEECH HANDLERS ---
  const startTool = (toolName) => {
    setActiveTool(toolName);
    setIsRecording(true);
    if(toolName === 'quick') setQuickTranscript(""); 
    setQuickResult(null); 
    recognitionRef.current.start();
  }

  const stopTool = async () => {
    setIsRecording(false);
    recognitionRef.current.stop();
    
    const textToCheck = activeTool === 'full' ? fullTranscript : quickTranscript;
    if(!textToCheck.trim()) {
        alert("No speech detected.");
        return;
    }

    setIsProcessing(true);

    try {
      let resultText = "";
      if (activeTool === 'quick') {
         resultText = await generateQuickAssist(quickTranscript);
         setQuickResult(resultText);
      } 
      else if (activeTool === 'full') {
         resultText = await generateClassSummary(fullTranscript);
         setFullResult(resultText);
      }
    } catch (error) {
      console.error(error);
      alert("AI Error. Please check console.");
    } finally {
      setIsProcessing(false);
    }
  }

  // --- NEW: QUIZ GENERATOR ---
  const handleGenerateQuiz = async () => {
    if(!fullTranscript) return alert("Record a session first!");
    setIsProcessing(true);
    try {
        const quiz = await generateQuiz(fullTranscript);
        setQuizResult(quiz);
    } catch(err) {
        console.error(err);
    } finally {
        setIsProcessing(false);
    }
  }

  // --- NEW: SEND TO STUDENTS (Summary or Quiz) ---
  const sendToStudents = async (type, content) => {
      if(!content) return;
      setSendingStatus('sending');
      
      try {
          // Iterate through all students and add a notification/material document
          const promises = students.map(student => {
              return addDoc(collection(db, "users", student.id, "classMaterials"), {
                  type: type, // 'summary' or 'quiz'
                  content: content,
                  classId: classId,
                  timestamp: serverTimestamp(),
                  read: false,
                  title: type === 'summary' ? `Summary: ${classData.batch}` : `Quiz: ${classData.batch}`
              })
          });

          await Promise.all(promises);
          setSendingStatus('sent');
          setTimeout(() => setSendingStatus(null), 3000); // Reset after 3 seconds
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
              <p>Analyzing context & generating content.</p>
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
                          <div className="result-label">AI Response</div>
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
                             <span className="result-label">Class Summary</span>
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
                                        <span className="result-label">Generated Quiz</span>
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