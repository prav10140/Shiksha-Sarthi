import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage' 
import TeacherDashboard from "./pages/TeacherDashboard"
import ClassesPage from "./pages/ClassesPage" 
import ClassSession from "./pages/components/ClassSession" 
import Schedule from "./pages/Schedule"
import StudentDashboard from "./pages/StudentDashboard"
import AITutorPage from "./pages/AITutorPage" // <--- FIXED: Added Missing Import
import { useAuth } from "./contexts/AuthContext"
import "./App.css"

import ClassLiveLayout from "./pages/ClassLiveLayout"
import AttendancePage from "./pages/components/AttendanceSidebar"

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthPage />} />
        
        {/* TEACHER ROUTES */}
        <Route path="/dashboard" element={<ProtectedRoute role="teacher"><TeacherDashboard /></ProtectedRoute>} />
        <Route path="/classes" element={<ProtectedRoute role="teacher"><ClassesPage /></ProtectedRoute>} />
        {/* <Route path="/class/:classId" element={<ProtectedRoute role="teacher"><ClassSession /></ProtectedRoute>} /> */}


        <Route
          path="/class/:classId/live"
          element={
            <ProtectedRoute>
              <ClassLiveLayout />
            </ProtectedRoute>
          }
        >
          {/* DEFAULT → ONLINE SESSION */}
          <Route index element={<ClassSession />} />

          {/* ONLINE SESSION */}
          <Route path="session" element={<ClassSession />} />

          {/* ATTENDANCE */}
          <Route path="attendance" element={<AttendancePage />} />
        </Route>

        <Route path="/schedule" element={<ProtectedRoute role="teacher"><Schedule /></ProtectedRoute>} />
        
        {/* STUDENT ROUTES */}
        <Route path="/student" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
        
        {/* AI VOICE TUTOR (Protected) */}
        <Route path="/voice-tutor" element={<ProtectedRoute><AITutorPage /></ProtectedRoute>} />
      </Routes>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { currentUser } = useAuth()
  if (!currentUser) return <Navigate to="/login" replace />
  return children
}

export default App