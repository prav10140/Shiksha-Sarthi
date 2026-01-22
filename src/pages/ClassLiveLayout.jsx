import { NavLink, Outlet, useParams, useNavigate } from "react-router-dom"
import "./ClassLiveLayout.css"

function ClassLiveLayout() {
  const { classId } = useParams()
  const navigate = useNavigate()

  return (
    <div className="live-layout">

      {/* LEFT SIDEBAR */}
      <aside className="live-sidebar">
        <div className="sidebar-top">
          <h3>Live Class</h3>

          <NavLink
            to={`/class/${classId}/live/session`}
            className="sidebar-link"
          >
            Online Session
          </NavLink>

          <NavLink
            to={`/class/${classId}/live/attendance`}
            className="sidebar-link"
          >
            Attendance
          </NavLink>
        </div>

        {/* BOTTOM LEAVE BUTTON */}
        <div className="sidebar-bottom">
          <button
            className="leave-btn"
            onClick={() => navigate("/dashboard")}
          >
            Leave
          </button>
        </div>
      </aside>

      {/* RIGHT CONTENT */}
      <main className="live-content">
        <Outlet />
      </main>

    </div>
  )
}

export default ClassLiveLayout
