import { useNavigate, useParams } from "react-router-dom"

function AttendanceSidebar({ students=[] }) {
  const navigate = useNavigate()
  const { classId } = useParams()

  return (
    <aside className="attendance-sidebar">
      <h3>Live Attendance</h3>

      <div className="attendance-list">
        {students.map(student => (
          <div
            key={student.id}
            className="attendance-row clickable"
            onClick={() =>
              navigate(`/class/${classId}/live/attendance`)
            }
          >
            <div className="student-info">
              <span className="avatar-sm">
                {student.name?.charAt(0) || "S"}
              </span>
              <span>{student.name}</span>
            </div>

            <div className="status">
              <span
                className={`dot ${
                  student.isOnline ? "online" : "offline"
                }`}
              />
              <span className="status-text">
                {student.isOnline ? "Online" : "Offline"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}

export default AttendanceSidebar
