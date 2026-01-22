"use client"

import React, { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { 
  doc, 
  setDoc, 
  serverTimestamp, 
  onSnapshot, 
  getDoc 
} from "firebase/firestore"
import { db } from "../../firebase"
import "./AttendanceSidebar.css"

const AttendanceSidebar = () => {
  const { classId } = useParams()

  const [presentStudents, setPresentStudents] = useState([])

  // 📍 START ATTENDANCE
  const startAttendance = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported")
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await setDoc(doc(db, "attendanceSessions", classId), {
            teacherLat: position.coords.latitude,
            teacherLng: position.coords.longitude,
            radius: 100,
            active: true,
            presentStudents: [],
            startedAt: serverTimestamp()
          })

          alert("Attendance started 📍")
        } catch (err) {
          console.error(err)
          alert("Failed to start attendance")
        }
      },
      () => alert("Please allow location access")
    )
  }

  // 🔴 LIVE LISTENER FOR PRESENT STUDENTS
  useEffect(() => {
    if (!classId) return

    const sessionRef = doc(db, "attendanceSessions", classId)

    const unsubscribe = onSnapshot(sessionRef, async (snap) => {
      if (!snap.exists()) {
        setPresentStudents([])
        return
      }

      const data = snap.data()
      const studentIds = data.presentStudents || []

      // Fetch student details
      const students = await Promise.all(
        studentIds.map(async (uid) => {
          const userSnap = await getDoc(doc(db, "users", uid))
          return userSnap.exists()
            ? { id: uid, ...userSnap.data() }
            : null
        })
      )

      setPresentStudents(students.filter(Boolean))
    })

    return () => unsubscribe()
  }, [classId])

  return (
    <div className="attendance-page">
      {/* HEADER */}
      <header className="attendance-header">
        <h2>📍 Live Attendance</h2>
        <button className="start-attendance-btn" onClick={startAttendance}>
          Start Attendance
        </button>
      </header>

      {/* CONTENT */}
      <div className="attendance-content">
        {/* PRESENT STUDENTS */}
        <section className="present-section">
          <h3>✅ Present</h3>

         {presentStudents.length === 0 ? (
            <p className="empty-text">No attendance marked yet</p>
          ) : (
            presentStudents.map(student => (
              <div key={student.id} className="present-row">
                <span className="avatar-sm success">
                  {(student.name || student.fullName || student.displayName || "S").charAt(0)}
                </span>
                <span>
                  {student.name || student.fullName || student.displayName || "Unknown"}
                </span>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  )
}

export default AttendanceSidebar
