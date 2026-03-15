import { useState, useRef, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { getUser, clearData } from '../utils/storage';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const user = getUser();
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  function logout() {
    clearData();
    navigate('/login');
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="nav-brand" onClick={() => navigate('/dashboard')}>
          edu<span className="nav-brand-dot">.</span>Diary <span style={{ fontSize: 18 }}>📓</span>
        </div>

        <ul className="nav-links">
          <li><NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-link nav-link--active' : 'nav-link'}>Dashboard</NavLink></li>
          <li><NavLink to="/attendance" className={({ isActive }) => isActive ? 'nav-link nav-link--active' : 'nav-link'}>Attendance</NavLink></li>
          <li><NavLink to="/schedule" className={({ isActive }) => isActive ? 'nav-link nav-link--active' : 'nav-link'}>Schedule</NavLink></li>
        </ul>

        <div className="nav-user-wrap" ref={ref}>
          <button className="nav-user-btn" onClick={() => setOpen(v => !v)} id="user-avatar-btn">
            {initial}
            <div className="nav-online-dot" />
          </button>

          {open && (
            <div className="nav-dropdown" style={{ animation: 'hd-slideDown 0.2s ease-out' }}>
              <div className="hd-tape" />
              <div className="nav-dd-tack" />

              <div className="nav-dd-header">
                <div className="nav-avatar-lg">{initial}</div>
                <div>
                  <div className="nav-dd-name">{user?.name || 'Student'}</div>
                  <div className="nav-dd-id">{user?.username || ''}</div>
                  <div className="hd-badge" style={{ marginTop: 4 }}>✏️ Student</div>
                </div>
              </div>

              <ul className="nav-dd-menu">
                <li><button className="nav-dd-item" onClick={() => { setOpen(false); navigate('/dashboard'); }}>
                  <span className="nav-dd-icon">📊</span> Dashboard
                </button></li>
                <li><button className="nav-dd-item" onClick={() => { setOpen(false); navigate('/attendance'); }}>
                  <span className="nav-dd-icon">📋</span> Attendance
                </button></li>
                <li><button className="nav-dd-item" onClick={() => { setOpen(false); navigate('/schedule'); }}>
                  <span className="nav-dd-icon">📅</span> Schedule
                </button></li>
              </ul>

              <hr className="nav-dd-divider" />

              <button className="nav-dd-logout" onClick={logout}>
                <span className="nav-dd-icon nav-dd-icon--danger">🚪</span> Log out
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{navStyles}</style>
    </nav>
  );
}

const navStyles = `
.navbar {
  background: var(--white);
  border-bottom: 3px solid var(--border);
  box-shadow: 0 4px 0px 0px var(--border);
  position: sticky;
  top: 0;
  z-index: 100;
}
.navbar-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 12px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.nav-brand {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 22px;
  color: var(--fg);
  cursor: pointer;
  letter-spacing: -0.5px;
  user-select: none;
}
.nav-brand-dot { color: var(--accent); }

.nav-links {
  display: flex;
  gap: 24px;
  list-style: none;
}
.nav-link {
  font-family: var(--font-body);
  font-size: 16px;
  color: var(--fg);
  text-decoration: none;
  opacity: 0.6;
  transition: opacity 0.15s;
  position: relative;
}
.nav-link:hover { opacity: 1; }
.nav-link--active {
  opacity: 1;
  font-weight: 700;
}
.nav-link--active::after {
  content: '';
  display: block;
  height: 3px;
  background: var(--accent);
  border-radius: 2px;
  position: absolute;
  bottom: -4px;
  left: 0;
  right: 0;
}

.nav-user-wrap { position: relative; }
.nav-user-btn {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-wobbly);
  border: 3px solid var(--border);
  background: var(--postit);
  box-shadow: 3px 3px 0px 0px var(--border);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 16px;
  color: var(--fg);
  transition: all 0.1s;
  position: relative;
}
.nav-user-btn:hover {
  background: var(--accent);
  color: var(--white);
  box-shadow: 2px 2px 0px 0px var(--border);
  transform: translate(1px, 1px);
}
.nav-online-dot {
  position: absolute;
  bottom: -3px;
  right: -3px;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: #22c55e;
  border: 2px solid var(--white);
}

.nav-dropdown {
  position: absolute;
  top: calc(100% + 14px);
  right: 0;
  width: 270px;
  background: var(--white);
  border: 3px solid var(--border);
  border-radius: var(--radius-wobbly-md);
  box-shadow: 6px 6px 0px 0px var(--border);
  z-index: 200;
  transform: rotate(0.5deg);
  overflow: visible;
}
.nav-dd-tack {
  position: absolute;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: var(--blue);
  border: 2px solid var(--border);
  top: -7px;
  left: 20px;
  box-shadow: 1px 1px 0px var(--border);
}
.nav-dd-header {
  padding: 20px 18px 14px;
  border-bottom: 2px dashed var(--muted);
  display: flex;
  align-items: center;
  gap: 12px;
}
.nav-avatar-lg {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-wobbly);
  border: 3px solid var(--border);
  background: var(--postit);
  box-shadow: 3px 3px 0px 0px var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 20px;
  color: var(--fg);
  flex-shrink: 0;
}
.nav-dd-name {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 17px;
  color: var(--fg);
  line-height: 1.2;
}
.nav-dd-id {
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--fg);
  opacity: 0.5;
  margin-top: 2px;
}
.nav-dd-menu {
  padding: 8px 0;
  list-style: none;
}
.nav-dd-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 18px;
  font-family: var(--font-body);
  font-size: 15px;
  color: var(--fg);
  cursor: pointer;
  transition: all 0.1s;
  background: none;
  border: none;
  text-align: left;
}
.nav-dd-item:hover {
  background: var(--bg);
  padding-left: 22px;
}
.nav-dd-icon {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-wobbly-alt);
  border: 2px solid var(--border);
  background: var(--muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  flex-shrink: 0;
  box-shadow: 2px 2px 0 var(--border);
}
.nav-dd-item:hover .nav-dd-icon { background: var(--blue); }
.nav-dd-divider {
  border: none;
  border-top: 2px dashed var(--muted);
  margin: 4px 18px;
}
.nav-dd-logout {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 18px 16px;
  font-family: var(--font-body);
  font-size: 15px;
  color: var(--accent);
  cursor: pointer;
  transition: all 0.1s;
  background: none;
  border: none;
}
.nav-dd-logout:hover { padding-left: 22px; }
.nav-dd-icon--danger {
  background: #fff0f0;
  border-color: var(--accent);
  box-shadow: 2px 2px 0 var(--accent);
}
.nav-dd-logout:hover .nav-dd-icon--danger { background: var(--accent); }

@media (max-width: 640px) {
  .nav-links { display: none; }
  .navbar-inner { padding: 12px 16px; }
}
`;
