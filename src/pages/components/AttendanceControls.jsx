function AttendanceControls({ isActive, onStart, onEnd }) {
  return (
    <div className="attendance-controls">
      {!isActive ? (
        <button className="btn start" onClick={onStart}>
          ▶ Start Attendance
        </button>
      ) : (
        <button className="btn end" onClick={onEnd}>
          ⏹ End Attendance
        </button>
      )}
    </div>
  )
}

export default AttendanceControls
