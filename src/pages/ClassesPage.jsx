"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "../firebase"
import { useAuth } from "../contexts/AuthContext"
import { 
  LayoutGrid, Calendar, LayoutList, Plus, X, 
  Copy, LogOut, Search, Clock, MoreVertical,
  BookOpen, Users, ArrowRight
} from "lucide-react" 
import "./ClassesPage.css" 

function ClassesPage() {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()
  
  const [allClasses, setAllClasses] = useState([])
  const [filteredClasses, setFilteredClasses] = useState([])
  const [filter, setFilter] = useState("all") // 'all', 'upcoming', 'completed'
  const [search, setSearch] = useState("")
  
  const [activeModal, setActiveModal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({ batch: "", subject: "", startTime: "", endTime: "", agenda: "" })
  const [saving, setSaving] = useState(false)

  // --- 1. FETCH & PROCESS DATA ---
  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, "classes"), where("teacherId", "==", currentUser.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const d = doc.data();
        // Calculate Status
        const now = new Date();
        const [h, m] = (d.startTime || "00:00").split(':');
        const classDate = new Date(); // Assuming classes are daily/today for MVP
        classDate.setHours(h, m, 0);
        
        let status = "upcoming";
        if (now > classDate && now < new Date(classDate.getTime() + 60*60*1000)) status = "live";
        if (now > new Date(classDate.getTime() + 60*60*1000)) status = "completed";

        return { id: doc.id, ...d, computedStatus: status };
      });
      
      // Sort by time
      data.sort((a, b) => a.startTime.localeCompare(b.startTime));
      setAllClasses(data);
      setFilteredClasses(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // --- 2. SEARCH & FILTER LOGIC ---
  useEffect(() => {
    let result = allClasses;

    // Filter by Status Tab
    if (filter !== 'all') {
      result = result.filter(c => c.computedStatus === filter);
    }

    // Filter by Search Text
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(c => 
        c.batch.toLowerCase().includes(lower) || 
        c.subject.toLowerCase().includes(lower)
      );
    }

    setFilteredClasses(result);
  }, [filter, search, allClasses]);


  // --- 3. SAVE CLASS ---
  const handleSaveClass = async () => {
      if (!formData.batch || !formData.subject || !formData.startTime) return alert("Please fill required fields");
      setSaving(true);
      try {
        await addDoc(collection(db, "classes"), {
          teacherId: currentUser.uid,
          batch: formData.batch,
          subject: formData.subject,
          startTime: formData.startTime,
          endTime: formData.endTime || "N/A",
          agenda: formData.agenda,
          students: [],
          createdAt: serverTimestamp()
        });
        setFormData({ batch: "", subject: "", startTime: "", endTime: "", agenda: "" });
        setActiveModal(null);
      } catch (e) { console.error(e) } finally { setSaving(false) }
  }

  const copyCode = (e, text) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    alert("Class Code Copied!");
  }

  return (
    <div className="dashboard-layout">
      
      {/* --- CREATE MODAL --- */}
      {activeModal === 'create' && (
        <div className="modal-backdrop">
          <div className="modal-panel">
            <div className="modal-head">
              <div>
                <h2>Create New Class</h2>
                <p>Set up a new session for your students.</p>
              </div>
              <button className="close-icon" onClick={() => setActiveModal(null)}><X size={24}/></button>
            </div>
            
            <div className="modal-body">
               <div className="input-group">
                 <label>Batch Name</label>
                 <input autoFocus placeholder="e.g. Class 10 - Section B" value={formData.batch} onChange={e => setFormData({...formData, batch: e.target.value})} />
               </div>
               
               <div className="input-group">
                 <label>Subject</label>
                 <input placeholder="e.g. Physics - Thermodynamics" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} />
               </div>

               <div className="input-row">
                 <div className="input-group">
                   <label>Start Time</label>
                   <input type="time" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
                 </div>
                 <div className="input-group">
                   <label>End Time</label>
                   <input type="time" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} />
                 </div>
               </div>

               <div className="input-group">
                 <label>Agenda (Optional)</label>
                 <textarea rows="3" placeholder="What topics will be covered?" value={formData.agenda} onChange={e => setFormData({...formData, agenda: e.target.value})} />
               </div>
            </div>

            <div className="modal-foot">
               <button className="btn-text" onClick={() => setActiveModal(null)}>Cancel</button>
               <button className="btn-solid" onClick={handleSaveClass} disabled={saving}>
                 {saving ? "Creating..." : "Create Class"}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SIDEBAR --- */}
      <aside className="sidebar-glass">
        <div className="brand">
           <div className="logo-sq">S</div>
           <span className="logo-txt">Shiksha</span>
        </div>
        
        <nav className="nav-list">
          <Link to="/dashboard" className="nav-item"><LayoutGrid size={20}/> <span>Dashboard</span></Link>
          <Link to="/classes" className="nav-item active"><LayoutList size={20}/> <span>My Classes</span></Link>
          <div className="spacer"></div>
          <button onClick={logout} className="nav-item danger"><LogOut size={20}/> <span>Sign Out</span></button>
        </nav>

        <div className="user-mini-profile">
           <div className="avatar">{currentUser?.email?.charAt(0).toUpperCase()}</div>
           <div className="u-info">
              <span className="name">Teacher</span>
              <span className="email">{currentUser?.email?.split('@')[0]}</span>
           </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="content-area">
        
        {/* HEADER */}
        <header className="content-header">
           <div className="header-left">
              <h1>Classroom Management</h1>
              <p>Organize, schedule, and track your active sessions.</p>
           </div>
           <button className="btn-primary-glow" onClick={() => setActiveModal('create')}>
              <Plus size={20}/> Create New Class
           </button>
        </header>

        {/* CONTROLS */}
        <div className="controls-bar">
           <div className="tabs">
              <button className={`tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All Classes</button>
              <button className={`tab ${filter === 'live' ? 'active' : ''}`} onClick={() => setFilter('live')}>Live Now</button>
              <button className={`tab ${filter === 'upcoming' ? 'active' : ''}`} onClick={() => setFilter('upcoming')}>Upcoming</button>
           </div>
           
           <div className="search-box">
              <Search size={18} />
              <input placeholder="Search batch or subject..." value={search} onChange={e => setSearch(e.target.value)} />
           </div>
        </div>

        {/* GRID OF CLASSES */}
        <div className="class-grid">
           {loading ? <div className="loader">Loading your schedule...</div> : 
            filteredClasses.length === 0 ? (
              <div className="empty-placeholder">
                 <div className="empty-icon"><Calendar size={40}/></div>
                 <h3>No classes found</h3>
                 <p>Try changing your filters or create a new batch.</p>
              </div>
            ) : (
              filteredClasses.map(cls => (
                 <div key={cls.id} className="class-card-modern" onClick={() => navigate(`/class/${cls.id}/live`)}>
                    <div className="card-top">
                       <div className="card-badges">
                          {cls.computedStatus === 'live' && <span className="badge-live"><span className="dot"></span> LIVE</span>}
                          {cls.computedStatus === 'upcoming' && <span className="badge-upcoming">UPCOMING</span>}
                          {cls.computedStatus === 'completed' && <span className="badge-done">DONE</span>}
                       </div>
                       <button className="icon-btn" onClick={(e) => copyCode(e, cls.id)}><Copy size={16}/></button>
                    </div>

                    <div className="card-main">
                       <h3>{cls.batch}</h3>
                       <div className="subject-row"><BookOpen size={14}/> {cls.subject}</div>
                    </div>

                    <div className="card-details">
                       <div className="detail-item">
                          <Clock size={14}/>
                          <span>{cls.startTime} - {cls.endTime}</span>
                       </div>
                       <div className="detail-item">
                          <Users size={14}/>
                          <span>0 Students</span>
                       </div>
                    </div>

                    <div className="card-footer">
                       <span className="code-text">Code: {cls.id}</span>
                       <div className="arrow-circle"><ArrowRight size={16}/></div>
                    </div>
                 </div>
              ))
            )}
        </div>
      </main>
    </div>
  )
}

export default ClassesPage