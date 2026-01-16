"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { 
  collection, query, where, onSnapshot, 
  addDoc, deleteDoc, doc, serverTimestamp 
} from "firebase/firestore"
import { db } from "../firebase"
import { useAuth } from "../contexts/AuthContext"
import { 
  Calendar as CalIcon, ChevronLeft, ChevronRight, 
  Plus, LayoutGrid, LogOut, Clock, Trash2, 
  BookOpen, BrainCircuit, X 
} from "lucide-react"
import "./Schedule.css"

function Schedule() {
  const { currentUser, logout } = useAuth()
  
  // -- State --
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState([])
  const [selectedDay, setSelectedDay] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [eventType, setEventType] = useState("Class") // "Class" or "Quiz"
  const [loading, setLoading] = useState(true)

  // -- Fetch Data from Firebase --
  useEffect(() => {
    if (!currentUser) return
    // We fetch ALL classes/quizzes for this teacher
    const q = query(collection(db, "classes"), where("teacherId", "==", currentUser.uid))
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setEvents(data)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [currentUser])

  // -- Calendar Logic --
  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const days = new Date(year, month + 1, 0).getDate()
    const firstDay = new Date(year, month, 1).getDay()
    return { days, firstDay }
  }

  const { days, firstDay } = getDaysInMonth(currentDate)
  
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }
  
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  // Filter events for a specific day
  const getEventsForDay = (day) => {
    return events.filter(e => {
      const eventDate = new Date(e.date) // Expecting 'YYYY-MM-DD' from input
      return (
        eventDate.getDate() === day &&
        eventDate.getMonth() === currentDate.getMonth() &&
        eventDate.getFullYear() === currentDate.getFullYear()
      )
    })
  }

  // -- Handlers --
  const handleAddEvent = async (e) => {
    e.preventDefault()
    const form = e.target
    const dateStr = form.date.value // YYYY-MM-DD

    try {
      await addDoc(collection(db, "classes"), {
        teacherId: currentUser.uid,
        title: form.title.value,
        type: eventType, // Class or Quiz
        date: dateStr,
        time: form.time.value,
        batch: form.batch.value,
        createdAt: serverTimestamp()
      })
      setShowModal(false)
      form.reset()
    } catch (err) { console.error(err) }
  }

  const handleDelete = async (id) => {
    if(window.confirm("Delete this event?")) {
      await deleteDoc(doc(db, "classes", id))
    }
  }

  return (
    <div className="schedule-container">
      
      {/* SIDEBAR */}
      <aside className="mini-sidebar">
        <div className="logo-icon">EA</div>
        <nav>
          <Link to="/dashboard" className="mini-nav-item"><LayoutGrid size={20}/></Link>
          <Link to="/schedule" className="mini-nav-item active"><CalIcon size={20}/></Link>
          <button onClick={logout} className="mini-nav-item logout"><LogOut size={20}/></button>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="schedule-main">
        
        {/* Header */}
        <header className="calendar-header">
          <div>
            <h1>Academic Calendar</h1>
            <p className="sub-text">Manage classes, quizzes, and deadlines.</p>
          </div>
          <div className="month-navigation">
            <button className="nav-btn" onClick={handlePrevMonth}><ChevronLeft/></button>
            <h2>{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
            <button className="nav-btn" onClick={handleNextMonth}><ChevronRight/></button>
          </div>
          <button className="btn-add-event" onClick={() => setShowModal(true)}>
            <Plus size={18}/> Schedule Event
          </button>
        </header>

        {/* CALENDAR GRID */}
        <div className="calendar-grid">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="grid-header">{d}</div>
          ))}
          
          {/* Empty slots for start of month */}
          {Array(firstDay).fill(null).map((_, i) => (
            <div key={`empty-${i}`} className="calendar-day empty"></div>
          ))}

          {/* Actual Days */}
          {Array(days).fill(null).map((_, i) => {
            const dayNum = i + 1
            const dayEvents = getEventsForDay(dayNum)
            const isToday = new Date().getDate() === dayNum && new Date().getMonth() === currentDate.getMonth()

            return (
              <div key={dayNum} className={`calendar-day ${isToday ? 'today' : ''}`} onClick={() => setSelectedDay(dayNum)}>
                <span className="day-number">{dayNum}</span>
                <div className="day-events">
                  {dayEvents.map(ev => (
                    <div key={ev.id} className={`event-pill ${ev.type.toLowerCase()}`}>
                      {ev.type === 'Quiz' ? <BrainCircuit size={10}/> : <BookOpen size={10}/>}
                      <span>{ev.time} - {ev.title}</span>
                      <button className="delete-x" onClick={(e) => {e.stopPropagation(); handleDelete(ev.id)}}>×</button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {/* MODAL FOR ADDING CLASS/QUIZ */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-effect">
            <div className="modal-top">
              <h3>Schedule New Event</h3>
              <button onClick={() => setShowModal(false)}><X size={20}/></button>
            </div>
            
            <form onSubmit={handleAddEvent}>
              <div className="type-toggle">
                <button type="button" className={eventType === 'Class' ? 'active' : ''} onClick={() => setEventType('Class')}>
                   <BookOpen size={16}/> Class
                </button>
                <button type="button" className={eventType === 'Quiz' ? 'active' : ''} onClick={() => setEventType('Quiz')}>
                   <BrainCircuit size={16}/> Quiz
                </button>
              </div>

              <label>Title / Subject</label>
              <input name="title" placeholder="e.g. React Hooks Quiz" required />

              <div className="row">
                <div>
                   <label>Date</label>
                   <input name="date" type="date" required />
                </div>
                <div>
                   <label>Time</label>
                   <input name="time" type="time" required />
                </div>
              </div>

              <label>Batch / Group</label>
              <input name="batch" placeholder="e.g. CS-A" required />

              <button type="submit" className={`btn-submit ${eventType.toLowerCase()}`}>
                Schedule {eventType}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default Schedule
