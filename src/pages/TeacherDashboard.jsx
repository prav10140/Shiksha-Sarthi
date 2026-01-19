"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "../firebase"
import { useAuth } from "../contexts/AuthContext"
import { generateQuickAssist } from "../utils/groq" 
import { 
  BookOpen, Users, Calendar, Sparkles, LayoutGrid, 
  Plus, X, Clock, Copy, LogOut, LayoutList, Loader2
} from "lucide-react" 
import "./TeacherDashboard.css"

function TeacherDashboard() {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()
  
  const [stats, setStats] = useState({ students: 0, classes: 0, hours: 0 })
  const [upcomingClasses, setUpcomingClasses] = useState([]) 
  const [activeModal, setActiveModal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({ batch: "", subject: "", startTime: "", endTime: "", agenda: "" })
  const [saving, setSaving] = useState(false)
  const [aiResponse, setAiResponse] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)

  // --- 1. FETCH DATA ---
  useEffect(() => {
    if (!currentUser) return;
    const classesRef = collection(db, "classes");
    const q = query(classesRef, where("teacherId", "==", currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const classesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      classesData.sort((a, b) => {
        const timeA = a.startTime || a.time || "00:00"; 
        const timeB = b.startTime || b.time || "00:00";
        return timeA.localeCompare(timeB);
      });
      setUpcomingClasses(classesData.slice(0, 3));
      setStats({
        students: classesData.reduce((acc, curr) => acc + (curr.students?.length || 0), 0),
        classes: classesData.length,
        hours: classesData.length * 1.5 
      });
      setLoading(false);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // --- 2. ACTIONS ---
  const handleSaveClass = async () => {
     if (!formData.batch || !formData.subject || !formData.startTime || !formData.endTime) {
        return alert("Please fill in Batch, Subject, and Time Range.");
     }
     setSaving(true);
     try {
       await addDoc(collection(db, "classes"), {
         teacherId: currentUser.uid,
         batch: formData.batch,
         subject: formData.subject,
         startTime: formData.startTime,
         endTime: formData.endTime,
         agenda: formData.agenda,
         students: [], 
         status: "Scheduled",
         createdAt: serverTimestamp()
       });
       setFormData({ batch: "", subject: "", startTime: "", endTime: "", agenda: "" });
       setActiveModal(null);
     } catch (error) { console.error(error); } 
     finally { setSaving(false); }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Batch Code copied: " + text);
  }

  // --- 3. AI ACTION ---
  const handleAiQuickAction = async (actionType) => {
    setIsGenerating(true); 
    setAiResponse(null);
    try {
      let prompt = actionType === "Quiz" 
        ? "Generate 3 quick quiz questions for a general computer science class." 
        : "Create a 45-minute lesson plan template for a coding class.";
      const text = await generateQuickAssist(prompt);
      setAiResponse(text);
    } catch(err) {
      console.error(err);
      setAiResponse("Failed to generate.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="teacher-dashboard">
      
      {/* --- CLICKABLE AI VOICE LINK (ORB) --- */}
      <Link to="/voice-tutor" className="floating-orb" title="Open 3D Voice Assistant">
         <div className="orb-core"></div>
         <div className="orb-ring"></div>
      </Link>

      {/* ADD BATCH MODAL */}
      {activeModal === 'class' && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
                <h3>Create New Batch Session</h3>
                <button onClick={() => setActiveModal(null)}><X size={20}/></button>
            </div>
            <div className="modal-form">
              <div className="form-section">
                <label>Batch Details</label>
                <input placeholder="Enter Batch Name" value={formData.batch} onChange={e => setFormData({...formData, batch: e.target.value})} />
              </div>
              <div className="form-section">
                <label>Session Details</label>
                <input placeholder="Subject" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} />
                <div className="row">
                    <div className="col"><label>Start</label><input type="time" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} /></div>
                    <div className="col"><label>End</label><input type="time" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} /></div>
                </div>
                <textarea placeholder="Agenda..." rows="3" value={formData.agenda} onChange={e => setFormData({...formData, agenda: e.target.value})}></textarea>
              </div>
              <button className="btn-primary" onClick={handleSaveClass} disabled={saving}>{saving ? "Creating..." : "Create Batch"}</button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="logo-area"><div className="logo-icon">ST</div><span className="logo-text">ShikshaSaarthi</span></div>
        <nav className="nav-menu">
          <Link to="/dashboard" className="nav-item active"><LayoutGrid size={20}/> <span>Dashboard</span></Link>
          <Link to="/classes" className="nav-item"><LayoutList size={20}/> <span>Classes</span></Link>
          <Link to="/schedule" className="nav-item"><Calendar size={20}/> <span>Schedule</span></Link>
          <div className="nav-spacer"></div>
          <button onClick={logout} className="nav-item logout"><LogOut size={20}/> <span>Logout</span></button>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        <header className="top-bar">
            <div className="welcome-text">
                <h1>Dashboard</h1>
                <p>Welcome, {currentUser?.displayName}. You have {upcomingClasses.length} sessions upcoming.</p>
            </div>
            <div className="top-actions">
                <button className="btn-primary" onClick={() => setActiveModal('class')}><Plus size={18} /> New Batch</button>
            </div>
        </header>

        <div className="dashboard-grid">
            <div className="stat-card"><div className="icon-box orange"><Users size={24}/></div><div><h3>{stats.students}</h3><p>Students</p></div></div>
            <div className="stat-card"><div className="icon-box blue"><BookOpen size={24}/></div><div><h3>{stats.classes}</h3><p>Batches</p></div></div>
            <div className="stat-card"><div className="icon-box green"><Clock size={24}/></div><div><h3>{stats.hours}h</h3><p>Hours</p></div></div>
            <div className="stat-card ai-trigger"><div className="icon-box purple"><Sparkles size={24}/></div><div><h3>AI Helper</h3><p>Online</p></div></div>

            <div className="card large-card schedule-card">
                <div className="card-header"><h3>Upcoming Sessions</h3></div>
                <div className="class-list">
                    {loading ? <p className="p-4">Loading...</p> : upcomingClasses.length === 0 ? <p className="p-4">No batches created.</p> : (
                       upcomingClasses.map((cls, index) => (
                          <div key={cls.id} className={`class-item ${index === 0 ? 'active' : ''}`}>
                              <div className="time-col">
                                  <span>{cls.startTime || cls.time || "N/A"}</span>
                                  {cls.endTime && <span className="tiny-gray">to {cls.endTime}</span>}
                              </div>
                              <div className="info-col">
                                  <h4>{cls.batch}</h4>
                                  <p className="subject-line">{cls.subject}</p>
                                  <div className="code-box" onClick={() => copyToClipboard(cls.id)}><span>Code: <strong>{cls.id}</strong></span><Copy size={14}/></div>
                              </div>
                              <button className="btn-outline" onClick={() => navigate(`/class/${cls.id}/live`)}>Start</button>
                          </div>
                       ))
                    )}
                </div>
            </div>
            
            <div className="card medium-card ai-widget">
                <div className="card-header"><h3><Sparkles size={18}/> AI Co-Pilot</h3></div>
                <div className="ai-content">
                    {!aiResponse ? (
                        <div className="quick-actions">
                            <button onClick={() => handleAiQuickAction("Quiz")}>📝 Quiz Gen</button>
                            <button onClick={() => handleAiQuickAction("Plan")}>📅 Plan Gen</button>
                        </div>
                    ) : (
                        <div className="ai-result">
                           <div style={{maxHeight:'150px', overflowY:'auto', fontSize:'0.85rem', marginBottom:'10px'}}>{aiResponse}</div>
                           <button className="btn-text" onClick={() => setAiResponse(null)}>Reset</button>
                        </div>
                    )}
                    {isGenerating && <div className="ai-loading"><Loader2 size={16} className="spin"/> Generating...</div>}
                </div>
            </div>
        </div>
      </main>
    </div>
  )
}

export default TeacherDashboard