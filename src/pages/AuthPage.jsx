"use client"

import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { db } from "../firebase"
import { collection, getDocs, query, where } from "firebase/firestore" // Import Firestore tools
import { 
  ArrowRight, Mail, Lock, User, GraduationCap, 
  BookOpen, ChevronLeft, Layers
} from "lucide-react"
import "./AuthPage.css"

function AuthPage() {
  const navigate = useNavigate()
  const { signup, login } = useAuth()
  
  const [role, setRole] = useState(null)
  const [mode, setMode] = useState('signin') 
  
  // Added selectedBatch state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    selectedBatch: "",
  
    // TEACHER CONTEXT
    classLevel: "",
    subject: "",
    language: "",
    classType: ""
  })
  const [availableBatches, setAvailableBatches] = useState([]) // Store batches from DB
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  
  const [tilt, setTilt] = useState({ t: {x:0, y:0}, s: {x:0, y:0} })

  // --- FETCH BATCHES FOR STUDENT SIGNUP ---
  useEffect(() => {
    if (role === 'student' && mode === 'signup') {
      const fetchBatches = async () => {
        try {
          const q = query(collection(db, "classes")); // Get all classes
          const snap = await getDocs(q);
          const batches = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setAvailableBatches(batches);
        } catch (err) {
          console.error("Error fetching batches:", err);
        }
      }
      fetchBatches();
    }
  }, [role, mode]);

  const handleTilt = (e, type) => {
    const card = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - card.left - card.width/2) / 20
    const y = -(e.clientY - card.top - card.height/2) / 20
    setTilt(prev => ({ ...prev, [type]: {x, y} }))
  }
  const handleResetTilt = () => setTilt({ t: {x:0, y:0}, s: {x:0, y:0} })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (mode === 'signup') {
        await signup(
          formData.email, 
          formData.password, 
          formData.name, 
          role, 
          // Pass the selected batch ID if student
          role === 'student' ? formData.selectedBatch : null 
        )
      } else {
        await login(formData.email, formData.password)
      }

      if (role === 'teacher') navigate('/dashboard')
      else navigate('/student')

    } catch (err) {
      console.error(err)
      setError("Failed. " + err.message)
    }
    setLoading(false)
  }

  return (
    <div className="auth-container">
      <div className="auth-background-mesh"></div>
      <div className="auth-header"><div className="logo-3d">EA</div><h2>Shiksha Sarthi Portal</h2></div>

      {!role && (
        <div className="role-selection-stage">
          <h1 className="fade-in">Who are you?</h1>
          <div className="cards-row">
            <div 
              className="role-card teacher"
              onMouseMove={(e) => handleTilt(e, 't')} onMouseLeave={handleResetTilt} onClick={() => setRole('teacher')}
              style={{ transform: `perspective(1000px) rotateX(${tilt.t.y}deg) rotateY(${tilt.t.x}deg)` }}
            >
              <div className="card-face">
                <div className="icon-3d orange"><BookOpen size={40}/></div>
                <h3>Teacher</h3><p>Manage classes & students.</p><div className="btn-fake">Login</div>
              </div>
            </div>
            <div 
              className="role-card student"
              onMouseMove={(e) => handleTilt(e, 's')} onMouseLeave={handleResetTilt} onClick={() => setRole('student')}
              style={{ transform: `perspective(1000px) rotateX(${tilt.s.y}deg) rotateY(${tilt.s.x}deg)` }}
            >
              <div className="card-face">
                <div className="icon-3d blue"><GraduationCap size={40}/></div>
                <h3>Student</h3><p>Join your batch & learn.</p><div className="btn-fake blue">Login</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {role && (
        <div className="form-stage">
          <button className="btn-back" onClick={() => {setRole(null); setMode('signin'); setError("")}}>
            <ChevronLeft size={20}/> Back
          </button>

          <div className={`auth-form-card ${role}`}>
            <div className="form-visual">
               {role === 'teacher' ? <BookOpen size={60} /> : <GraduationCap size={60} />}
               <h3>{role === 'teacher' ? "Teacher's Lounge" : "Student Portal"}</h3>
            </div>

            <div className="form-content">
              <div className="mode-toggle">
                <button className={mode === 'signin' ? 'active' : ''} onClick={() => setMode('signin')}>Sign In</button>
                <button className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>Sign Up</button>
              </div>

              {error && <div className="error-msg" style={{color: 'red', marginBottom: '10px', fontSize:'0.9rem'}}>{error}</div>}

              <form onSubmit={handleSubmit}>
                {mode === 'signup' && (
                  <div className="input-3d-wrapper">
                    <User size={18} />
                    <input placeholder="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                  </div>
                )}

{role === 'teacher' && mode === 'signup' && (
  <>
    <div className="input-3d-wrapper">
      <Layers size={18} />
      <input
        placeholder="Class (e.g. Class 4)"
        value={formData.classLevel}
        onChange={e => setFormData({ ...formData, classLevel: e.target.value })}
        required
      />
    </div>

    <div className="input-3d-wrapper">
      <BookOpen size={18} />
      <input
        placeholder="Subject (Math, EVS, etc.)"
        value={formData.subject}
        onChange={e => setFormData({ ...formData, subject: e.target.value })}
        required
      />
    </div>

    <div className="input-3d-wrapper">
      <User size={18} />
      <input
        placeholder="Preferred Language"
        value={formData.language}
        onChange={e => setFormData({ ...formData, language: e.target.value })}
        required
      />
    </div>

    <div className="input-3d-wrapper">
      <Layers size={18} />
      <select
        value={formData.classType}
        onChange={e => setFormData({ ...formData, classType: e.target.value })}
        required
        style={{
          width: '100%',
          padding: '16px 16px 16px 45px',
          background: '#f8fafc',
          border: '2px solid transparent',
          borderRadius: '12px',
          fontSize: '1rem',
          outline: 'none',
          appearance: 'none',
          cursor: 'pointer'
        }}
      >
        <option value="">Class Type</option>
        <option value="Single Grade">Single Grade</option>
        <option value="Multi Grade">Multi Grade</option>
      </select>
    </div>
  </>
)}

                {/* --- BATCH SELECTION DROPDOWN (NEW) --- */}
                {role === 'student' && mode === 'signup' && (
                  <div className="input-3d-wrapper">
                    <Layers size={18} />
                    <select 
                      value={formData.selectedBatch}
                      onChange={e => setFormData({...formData, selectedBatch: e.target.value})}
                      required
                      style={{
                        width: '100%', padding: '16px 16px 16px 45px',
                        background: '#f8fafc', border: '2px solid transparent', borderRadius: '12px',
                        fontSize: '1rem', outline: 'none', appearance: 'none', cursor: 'pointer'
                      }}
                    >
                      <option value="">Select Your Batch</option>
                      {availableBatches.map(batch => (
                        <option key={batch.id} value={batch.id}>
                          {batch.batch} - {batch.subject}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="input-3d-wrapper">
                  <Mail size={18} />
                  <input type="email" placeholder="Email Address" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                </div>

                <div className="input-3d-wrapper">
                  <Lock size={18} />
                  <input type="password" placeholder="Password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
                </div>

                <button type="submit" className="btn-3d-submit" disabled={loading}>
                  {loading ? "Processing..." : (mode === 'signin' ? "Enter Portal" : "Create Account")}
                  <ArrowRight size={18}/>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AuthPage
