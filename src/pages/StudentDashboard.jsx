"use client"

import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { db } from "../firebase"
import { 
  doc, collection, query, where, getDocs, orderBy, updateDoc, arrayUnion 
} from "firebase/firestore"
import { 
  LayoutGrid, FileText, LogOut, BookOpen, 
  CheckCircle, Shield, Mic, Clock, Upload, 
  FileQuestion, List, ChevronLeft, ArrowRight, XCircle
} from "lucide-react" 
import ReactMarkdown from 'react-markdown' 
import "./StudentDashboard.css"
import StudentAttendanceButton from "./components/StudentAttendanceButton"

function StudentDashboard() {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()
  
  // -- DASHBOARD STATE --
  const [viewState, setViewState] = useState("selection") 
  const [activeTab, setActiveTab] = useState("classroom")
  const [selectedClass, setSelectedClass] = useState(null)
  
  const [allClasses, setAllClasses] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Class Data
  const [assignments, setAssignments] = useState([])
  const [summaries, setSummaries] = useState([])
  const [quizzes, setQuizzes] = useState([])
  
  // -- QUIZ TAKING STATE --
  const [activeQuiz, setActiveQuiz] = useState(null)
  const [quizQuestions, setQuizQuestions] = useState([]) 
  const [userAnswers, setUserAnswers] = useState({}) 
  const [quizResult, setQuizResult] = useState(null)

  const [noiseLevel, setNoiseLevel] = useState("Low")

  // 1. FETCH ALL AVAILABLE CLASSES
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const q = query(collection(db, "classes"));
        const snap = await getDocs(q);
        setAllClasses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) { console.error(err); } 
      finally { setLoading(false); }
    };
    if (currentUser) fetchClasses();
  }, [currentUser]);

  // 2. ENTER CLASS & FETCH SHARED MATERIALS
  const handleEnterClass = async (classData) => {
    setLoading(true);
    setSelectedClass(classData);
    setViewState("active_class");
    setActiveTab("classroom");

    try {
        // A. Fetch Assignments (These are usually global/shared)
        const assignQ = query(collection(db, "assignments"), where("classId", "==", classData.id));
        const assignSnap = await getDocs(assignQ);
        setAssignments(assignSnap.docs.map(d => ({id: d.id, ...d.data()})));

        // B. Fetch Shared Class Materials (Summaries & Quizzes)
        // UPDATED PATH: classes/{classId}/classMaterials
        // This ensures every student in this class sees the same data.
        const materialsRef = collection(db, "classes", classData.id, "classMaterials");
        const matQ = query(materialsRef, orderBy("timestamp", "desc"));
        
        const matSnap = await getDocs(matQ);
        const materials = matSnap.docs.map(d => ({id: d.id, ...d.data()}));

        setSummaries(materials.filter(m => m.type === 'summary'));
        setQuizzes(materials.filter(m => m.type === 'quiz'));

    } catch (error) { 
        console.error("Error fetching class data:", error); 
    } finally { 
        setLoading(false); 
    }
  }

  // 3. EXIT CLASS
  const handleExitClass = () => {
      setSelectedClass(null);
      setViewState("selection");
      setActiveQuiz(null);
      setAssignments([]);
      setSummaries([]);
      setQuizzes([]);
  }

  // --- QUIZ LOGIC ---
  const parseQuizContent = (markdownText) => {
      if (!markdownText) return [];
      const lines = markdownText.split('\n');
      const questions = [];
      let currentQuestion = null;

      lines.forEach(line => {
          line = line.trim();
          if (line.startsWith('**') && line.endsWith('**')) {
              if (currentQuestion) questions.push(currentQuestion);
              currentQuestion = { 
                  text: line.replace(/\*\*/g, ''), 
                  options: [], 
                  correctIndex: -1 
              };
          } else if (line.startsWith('- [') && currentQuestion) {
              const isCorrect = line.includes('[x]') || line.includes('[X]');
              const optionText = line.substring(line.indexOf(']') + 1).trim();
              currentQuestion.options.push(optionText);
              if (isCorrect) currentQuestion.correctIndex = currentQuestion.options.length - 1;
          }
      });
      if (currentQuestion) questions.push(currentQuestion);
      return questions;
  }

  const handleStartQuiz = (quizItem) => {
      const parsedQuestions = parseQuizContent(quizItem.content);
      if (parsedQuestions.length === 0) return alert("Error: Quiz content is empty or invalid.");
      
      setQuizQuestions(parsedQuestions);
      setActiveQuiz(quizItem);
      setUserAnswers({});
      setQuizResult(null);
  }

  const handleAnswerSelect = (qIndex, oIndex) => {
      setUserAnswers(prev => ({...prev, [qIndex]: oIndex}));
  }

  const handleSubmitQuiz = () => {
      let score = 0;
      quizQuestions.forEach((q, idx) => {
          if (userAnswers[idx] === q.correctIndex) score++;
      });
      setQuizResult({ score, total: quizQuestions.length });
  }

  const handleCloseQuiz = () => {
      setActiveQuiz(null);
      setQuizQuestions([]);
      setQuizResult(null);
  }

  const handleLogout = async () => { await logout(); navigate('/'); }

  if (loading && !selectedClass && allClasses.length === 0) return <div className="loading-screen">Loading Portal...</div>

  return (
    <div className="student-dashboard">
      
      <aside className="sidebar">
        <div className="logo-area"><div className="logo-icon">ST</div><span className="logo-text">Shiksha Sarthi</span></div>
        <nav className="nav-menu">
          {viewState === 'active_class' ? (
             <>
                <button className="nav-item back-btn" onClick={handleExitClass}>
                    <ChevronLeft size={20}/> <span>Change Class</span>
                </button>
                <div className="nav-divider"></div>
                <button className={`nav-item ${activeTab === 'classroom' && !activeQuiz ? 'active' : ''}`} onClick={() => {setActiveTab('classroom'); setActiveQuiz(null);}}>
                    <LayoutGrid size={20}/> <span>Live Room</span>
                </button>
                <button className={`nav-item ${activeTab === 'assignments' ? 'active' : ''}`} onClick={() => setActiveTab('assignments')}>
                    <FileText size={20}/> <span>Assignments</span>
                </button>
                <button className={`nav-item ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>
                    <List size={20}/> <span>Summaries</span>
                </button>
                <button className={`nav-item ${activeTab === 'quiz' ? 'active' : ''}`} onClick={() => setActiveTab('quiz')}>
                    <FileQuestion size={20}/> <span>Quizzes</span>
                </button>
             </>
          ) : (
             <div className="nav-placeholder"><p>Select a class from the dashboard to view options.</p></div>
          )}
          <div className="nav-spacer"></div>
          <button onClick={handleLogout} className="nav-item logout"><LogOut size={20}/> <span>Logout</span></button>
        </nav>
      </aside>

      <main className="main-content">
        <header className="top-bar">
            <div className="welcome-text">
                {viewState === 'active_class' ? (
                   <><h1>{selectedClass.batch}</h1><p>{selectedClass.subject}</p></>
                ) : (
                   <><h1>Welcome, {currentUser?.displayName}</h1><p>Select a class to begin.</p></>
                )}
            </div>
            {viewState === 'active_class' && <div className="status-badge live"><span className="dot"></span> Connected</div>}
        </header>

        {/* 1. CLASS SELECTION */}
        {viewState === 'selection' && (
            <div className="class-selection-container">
                <h3>Available Classes</h3>
                <div className="class-grid">
                    {allClasses.map(cls => (
                        <div key={cls.id} className="class-select-card" onClick={() => handleEnterClass(cls)}>
                            <div className="card-top">
                                <div className="icon-bg"><BookOpen size={24}/></div>
                                <span className="time-tag">{cls.startTime || "N/A"}</span>
                            </div>
                            <div className="card-mid"><h3>{cls.batch}</h3><p>{cls.subject}</p></div>
                            <div className="card-bot"><span>Enter Classroom</span><ArrowRight size={16}/></div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* 2. ACTIVE CLASS VIEWS */}
        {viewState === 'active_class' && !activeQuiz && (
            <>
                {/* LIVE ROOM */}
                {activeTab === 'classroom' && (
                   <div className="dashboard-grid">
                       <StudentAttendanceButton classId={selectedClass.id} />
                       <div className="stat-card"><div className="icon-box green"><CheckCircle size={24}/></div><div><h3>On Time</h3><p>Status</p></div></div>
                       <div className="stat-card"><div className="icon-box orange"><Shield size={24}/></div><div><h3>Active</h3><p>Focus Mode</p></div></div>
                       <div className="stat-card"><div className="icon-box blue"><Mic size={24}/></div><div><h3>{noiseLevel}</h3><p>Noise Level</p></div></div>
                       <div className="card large-card status-overview-card">
                           <div className="card-header"><div><h3>Session Status</h3></div><div className="timer-badge"><Clock size={16}/> {selectedClass.startTime}</div></div>
                           <div className="status-body">
                              <div className="status-pulse-ring"><div className="status-icon"><CheckCircle size={40}/></div></div>
                              <h2>Connected to {selectedClass.batch}</h2>
                              <p>Session is live. Check Quizzes and Summaries tabs for new materials.</p>
                           </div>
                       </div>
                   </div>
                )}

                {/* ASSIGNMENTS */}
                {activeTab === 'assignments' && (
                   <div className="dashboard-grid single-col">
                      <div className="card full-card">
                         <div className="card-header"><h3>Assignments</h3></div>
                         <div className="assignment-list">
                            {assignments.length === 0 ? <p className="empty-msg">No assignments yet.</p> : assignments.map(a => (
                               <div key={a.id} className="assign-item">
                                  <div className="assign-icon"><FileText size={20}/></div>
                                  <div className="assign-info"><h4>{a.title}</h4></div>
                                  <button className="btn-small"><Upload size={14}/> Submit</button>
                               </div>
                            ))}
                         </div>
                      </div>
                   </div>
                )}

                {/* SUMMARIES */}
                {activeTab === 'summary' && (
                    <div className="dashboard-grid single-col">
                        <div className="card full-card">
                            <div className="card-header"><h3>Class Summaries</h3></div>
                            <div className="material-list">
                                {summaries.length === 0 ? <div className="empty-state">No summaries available.</div> : summaries.map(item => (
                                    <div key={item.id} className="material-item">
                                        <div className="material-header">
                                            <h4>{item.title || "Summary"}</h4>
                                            <span className="date-tag">Saved on {item.timestamp ? new Date(item.timestamp.seconds * 1000).toLocaleDateString() : 'N/A'}</span>
                                        </div>
                                        <div className="markdown-preview"><ReactMarkdown>{item.content}</ReactMarkdown></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* QUIZ LIST */}
                {activeTab === 'quiz' && (
                    <div className="dashboard-grid single-col">
                        <div className="card full-card">
                            <div className="card-header"><h3>Available Quizzes</h3></div>
                            <div className="material-list">
                                {quizzes.length === 0 ? <div className="empty-state">No quizzes available.</div> : quizzes.map(item => (
                                    <div key={item.id} className="material-item quiz-item">
                                        <div className="material-header">
                                            <h4>{item.title || "Pop Quiz"}</h4>
                                            <button className="btn-primary-small" onClick={() => handleStartQuiz(item)}>Take Quiz</button>
                                        </div>
                                        <p className="quiz-desc">Click start to attempt this quiz generated by your teacher.</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </>
        )}

        {/* 3. INTERACTIVE QUIZ MODE */}
        {activeQuiz && (
            <div className="quiz-mode-container">
                <div className="quiz-paper">
                    <div className="quiz-header-row">
                        <h2>{activeQuiz.title || "Class Quiz"}</h2>
                        <button className="close-quiz-btn" onClick={handleCloseQuiz}><XCircle size={24}/></button>
                    </div>
                    
                    {!quizResult ? (
                        <>
                            <div className="quiz-questions-list">
                                {quizQuestions.map((q, qIdx) => (
                                    <div key={qIdx} className="quiz-question-block">
                                        <p className="q-text">{qIdx + 1}. {q.text}</p>
                                        <div className="q-options">
                                            {q.options.map((opt, oIdx) => (
                                                <label key={oIdx} className={`option-label ${userAnswers[qIdx] === oIdx ? 'selected' : ''}`}>
                                                    <input 
                                                        type="radio" 
                                                        name={`question-${qIdx}`} 
                                                        checked={userAnswers[qIdx] === oIdx}
                                                        onChange={() => handleAnswerSelect(qIdx, oIdx)}
                                                    />
                                                    {opt}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="quiz-footer">
                                <button className="btn-submit-quiz" onClick={handleSubmitQuiz}>Submit Quiz</button>
                            </div>
                        </>
                    ) : (
                        <div className="quiz-result-view">
                            <div className="score-circle">
                                <span>{Math.round((quizResult.score / quizResult.total) * 100)}%</span>
                            </div>
                            <h3>You scored {quizResult.score} out of {quizResult.total}</h3>
                            <p>Great effort! Review the summaries to improve your score next time.</p>
                            <button className="btn-primary-small" onClick={handleCloseQuiz}>Return to Dashboard</button>
                        </div>
                    )}
                </div>
            </div>
        )}

      </main>
    </div>
  )
}

export default StudentDashboard