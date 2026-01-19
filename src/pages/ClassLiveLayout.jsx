import { NavLink, Outlet, useParams } from "react-router-dom"
import "./ClassLiveLayout.css"

function ClassLiveLayout() {
  const { classId } = useParams()

  return (
    <div className="live-layout">

      {/* LEFT SIDEBAR */}
      <aside className="live-sidebar">
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
      </aside>

      {/* RIGHT CONTENT */}
      <main className="live-content">
        <Outlet />
      </main>

    </div>
  )
}

export default ClassLiveLayout
