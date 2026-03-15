import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveUser, getData, clearData } from '../utils/storage';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Check if there's a previous user with incomplete setup
  const existing = getData();
  const hasStaleUser = existing?.user?.username && !existing?.onboarded;

  function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields ✏️');
      return;
    }

    // Check if returning user with completed setup
    if (existing?.user?.username && existing?.onboarded) {
      if (existing.user.username === username.trim() && existing.user.password === password) {
        navigate('/dashboard');
        return;
      } else if (existing.user.username === username.trim()) {
        setError('Wrong password! Try again 🤔');
        return;
      }
    }

    // New user or different username — clear old data and start fresh
    clearData();
    saveUser({ username: username.trim(), password, name: '', branch: '' });
    navigate('/onboarding');
  }

  function handleClearAndRestart() {
    clearData();
    setError('');
    setUsername('');
    setPassword('');
  }

  return (
    <>
      <style>{styles}</style>
      <div className="login-page">
        {/* Decorative blobs */}
        <div className="login-blob login-blob-1" />
        <div className="login-blob login-blob-2" />
        <div className="login-blob login-blob-3" />
        <div className="login-star">★</div>

        <svg style={{ position: 'absolute', top: 100, left: 30, width: 80, opacity: 0.4 }} viewBox="0 0 80 60" fill="none">
          <path d="M10 50 Q30 10 65 20" stroke="#2d2d2d" strokeWidth="2" strokeDasharray="4 3" fill="none" />
          <path d="M55 14 L68 22 L57 30" stroke="#2d2d2d" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>

        <div className="login-card">
          <div className="hd-tape" />
          <div className="hd-tack" />
          <div className="login-sticky">welcome! 📓</div>

          <div className="login-title">edu.Diary ✏️</div>
          <div className="login-subtitle">track your university life</div>
          <span className="hd-underline" style={{ marginBottom: 20 }} />

          {error && <div className="login-error">{error}</div>}

          {hasStaleUser && (
            <div className="login-stale-notice">
              <span>Previous session found for <strong>{existing.user.username}</strong></span>
              <button className="login-clear-btn" type="button" onClick={handleClearAndRestart}>
                Clear & start fresh
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="login-field">
              <label className="hd-label" htmlFor="login-user">Student ID / Username</label>
              <input
                className="hd-input"
                type="text"
                id="login-user"
                placeholder="e.g. U25EE102"
                autoComplete="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>

            <div className="login-field">
              <label className="hd-label" htmlFor="login-pw">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="hd-input"
                  style={{ paddingRight: 44 }}
                  type={showPw ? 'text' : 'password'}
                  id="login-pw"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="login-eye"
                  onClick={() => setShowPw(v => !v)}
                  title="Toggle password"
                >
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <div className="login-row">
              <label className="login-check-row">
                <input
                  type="checkbox"
                  className="hd-checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                />
                Remember me
              </label>
            </div>

            <button type="submit" className="hd-btn hd-btn--full" style={{ fontSize: 18, padding: '14px 20px' }}>
              Log in →
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

const styles = `
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  position: relative;
  overflow: hidden;
}
.login-blob {
  position: absolute;
  border: 2px dashed var(--muted);
  pointer-events: none;
}
.login-blob-1 {
  width: 180px; height: 180px;
  border-radius: 62% 38% 70% 30% / 44% 58% 42% 56%;
  top: -40px; left: -40px;
}
.login-blob-2 {
  width: 140px; height: 140px;
  border-radius: 38% 62% 30% 70% / 58% 44% 56% 42%;
  bottom: -30px; right: -30px;
}
.login-blob-3 {
  width: 80px; height: 80px;
  border-radius: 50%;
  border: 3px dashed var(--accent);
  top: 60px; right: 60px;
  animation: hd-bounce 3s ease-in-out infinite;
}
.login-star {
  position: absolute;
  font-family: var(--font-heading);
  font-size: 28px;
  color: var(--accent);
  transform: rotate(-15deg);
  bottom: 80px; left: 50px;
  animation: hd-wiggle 4s ease-in-out infinite;
  user-select: none;
}
.login-card {
  background: var(--white);
  border: 3px solid var(--border);
  border-radius: var(--radius-wobbly);
  box-shadow: var(--shadow-lg);
  padding: 40px 36px 36px;
  width: 100%;
  max-width: 420px;
  position: relative;
  transform: rotate(-0.5deg);
  animation: hd-fadeIn 0.4s ease-out;
}
.login-sticky {
  position: absolute;
  background: var(--postit);
  border: 2px solid var(--border);
  border-radius: 4px 255px 4px 4px / 4px 4px 4px 225px;
  padding: 4px 10px;
  font-family: var(--font-heading);
  font-size: 12px;
  color: var(--fg);
  transform: rotate(4deg);
  top: 12px; right: -18px;
  box-shadow: 3px 3px 0 var(--border);
  white-space: nowrap;
}
.login-title {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 32px;
  color: var(--fg);
  text-align: center;
  margin-top: 12px;
  margin-bottom: 4px;
  line-height: 1.1;
}
.login-subtitle {
  font-family: var(--font-body);
  font-size: 15px;
  color: var(--fg);
  opacity: 0.55;
  text-align: center;
  margin-bottom: 16px;
}
.login-field { margin-bottom: 20px; }
.login-eye {
  position: absolute;
  right: 12px; top: 50%;
  transform: translateY(-50%);
  background: none; border: none;
  cursor: pointer;
  font-size: 18px;
  color: rgba(45,45,45,0.4);
  padding: 0; line-height: 1;
}
.login-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  margin-top: -4px;
}
.login-check-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: rgba(45,45,45,0.7);
  cursor: pointer;
}
.login-error {
  background: #fff0f0;
  border: 2px solid var(--accent);
  border-radius: var(--radius-wobbly-alt);
  padding: 8px 14px;
  font-size: 14px;
  color: var(--accent);
  margin-bottom: 16px;
  text-align: center;
}
@media (max-width: 480px) {
  .login-card { padding: 32px 20px 28px; }
  .login-sticky { right: -6px; }
}
.login-stale-notice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  background: var(--postit);
  border: 2px dashed var(--border);
  border-radius: var(--radius-wobbly-alt);
  font-size: 13px;
  margin-bottom: 16px;
}
.login-clear-btn {
  background: none;
  border: none;
  color: var(--accent);
  font-family: var(--font-body);
  font-size: 13px;
  cursor: pointer;
  text-decoration: underline;
  white-space: nowrap;
}
.login-clear-btn:hover { opacity: 0.7; }

`;
