import React from "react"
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore"
import { db } from "../../firebase"
import { useAuth } from "../../contexts/AuthContext"
import "./StudentAttendanceButton.css"

// 📐 Distance calculation (Haversine)
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000
  const toRad = (v) => (v * Math.PI) / 180

  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

const StudentAttendanceButton = ({ classId }) => {
  const { currentUser } = useAuth()

  const markAttendance = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported")
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const sessionRef = doc(db, "attendanceSessions", classId)
          const sessionSnap = await getDoc(sessionRef)

          if (!sessionSnap.exists()) {
            return alert("Attendance not started ❌")
          }

          const session = sessionSnap.data()

          if (!session.active) {
            return alert("Attendance closed")
          }

          const distance = getDistance(
            position.coords.latitude,
            position.coords.longitude,
            session.teacherLat,
            session.teacherLng
          )

          if (distance > session.radius) {
            return alert("You are outside the classroom ❌")
          }

          await updateDoc(sessionRef, {
            presentStudents: arrayUnion(currentUser.uid)
          })

          alert("Attendance marked ✅")
        } catch (error) {
          console.error(error)
          alert("Failed to mark attendance")
        }
      },
      () => alert("Please allow location access")
    )
  }

  return (
    <button className="my-attendance-btn" onClick={markAttendance}>
      My Attendance
    </button>
  )
}

export default StudentAttendanceButton
