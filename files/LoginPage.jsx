import { useState } from "react";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&family=Patrick+Hand&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .hd-page {
    min-height: 100vh;
    background-color: #fdfbf7;
    background-image: radial-gradient(#e5e0d8 1px, transparent 1px);
    background-size: 24px 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Patrick Hand', cursive;
    padding: 40px 20px;
    position: relative;
    overflow: hidden;
  }

  .hd-blob {
    position: absolute;
    border: 2px dashed #e5e0d8;
    pointer-events: none;
  }
  .hd-blob-1 {
    width: 180px; height: 180px;
    border-radius: 62% 38% 70% 30% / 44% 58% 42% 56%;
    top: -40px; left: -40px;
  }
  .hd-blob-2 {
    width: 140px; height: 140px;
    border-radius: 38% 62% 30% 70% / 58% 44% 56% 42%;
    bottom: -30px; right: -30px;
  }
  .hd-blob-3 {
    width: 80px; height: 80px;
    border-radius: 50%;
    border: 3px dashed #ff4d4d;
    top: 60px; right: 60px;
    animation: hd-bounce 3s ease-in-out infinite;
  }

  .hd-star {
    position: absolute;
    font-family: 'Kalam', cursive;
    font-size: 28px;
    color: #ff4d4d;
    transform: rotate(-15deg);
    bottom: 80px;
    left: 50px;
    animation: hd-wiggle 4s ease-in-out infinite;
    user-select: none;
  }

  @keyframes hd-bounce {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    50% { transform: translateY(-10px) rotate(5deg); }
  }
  @keyframes hd-wiggle {
    0%, 100% { transform: rotate(-15deg); }
    50% { transform: rotate(-5deg); }
  }

  .hd-card {
    background: #fff;
    border: 3px solid #2d2d2d;
    border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
    box-shadow: 8px 8px 0px 0px #2d2d2d;
    padding: 40px 36px 36px;
    width: 100%;
    max-width: 420px;
    position: relative;
    transform: rotate(-0.5deg);
  }

  .hd-tape {
    position: absolute;
    top: -14px;
    left: 50%;
    transform: translateX(-50%) rotate(-2deg);
    width: 80px; height: 28px;
    background: rgba(200,190,180,0.45);
    border-radius: 3px;
    border: 1px solid rgba(150,140,130,0.3);
  }

  .hd-tack {
    position: absolute;
    width: 16px; height: 16px;
    border-radius: 50%;
    background: #ff4d4d;
    border: 2px solid #2d2d2d;
    top: -8px; right: 40px;
    box-shadow: 1px 1px 0px #2d2d2d;
  }

  .hd-sticky {
    position: absolute;
    background: #fff9c4;
    border: 2px solid #2d2d2d;
    border-radius: 4px 255px 4px 4px / 4px 4px 4px 225px;
    padding: 4px 10px;
    font-family: 'Kalam', cursive;
    font-size: 12px;
    color: #2d2d2d;
    transform: rotate(4deg);
    top: 12px; right: -18px;
    box-shadow: 3px 3px 0 #2d2d2d;
    white-space: nowrap;
  }

  .hd-title {
    font-family: 'Kalam', cursive;
    font-weight: 700;
    font-size: 32px;
    color: #2d2d2d;
    text-align: center;
    margin-top: 12px;
    margin-bottom: 4px;
    line-height: 1.1;
  }

  .hd-subtitle {
    font-family: 'Patrick Hand', cursive;
    font-size: 15px;
    color: #2d2d2d;
    opacity: 0.55;
    text-align: center;
    margin-bottom: 28px;
  }

  .hd-underline {
    display: block;
    width: 80px; height: 6px;
    background: #ff4d4d;
    border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
    margin: 0 auto 24px;
  }

  .hd-label {
    font-family: 'Patrick Hand', cursive;
    font-size: 15px;
    color: #2d2d2d;
    margin-bottom: 6px;
    display: block;
  }

  .hd-input-wrap {
    position: relative;
    margin-bottom: 20px;
  }

  .hd-input {
    width: 100%;
    padding: 12px 16px;
    font-family: 'Patrick Hand', cursive;
    font-size: 16px;
    color: #2d2d2d;
    background: #fdfbf7;
    border: 2px solid #2d2d2d;
    border-radius: 225px 15px 255px 15px / 15px 255px 15px 225px;
    outline: none;
    transition: all 0.15s;
    box-shadow: 3px 3px 0px 0px rgba(45,45,45,0.12);
  }
  .hd-input::placeholder {
    color: rgba(45,45,45,0.35);
    font-family: 'Patrick Hand', cursive;
  }
  .hd-input:focus {
    border-color: #2d5da1;
    box-shadow: 3px 3px 0px 0px rgba(45,93,161,0.2);
  }
  .hd-input-pw {
    padding-right: 44px;
  }

  .hd-eye-btn {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    color: rgba(45,45,45,0.4);
    font-size: 18px;
    padding: 0;
    line-height: 1;
  }

  .hd-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    margin-top: -4px;
  }

  .hd-checkbox-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .hd-checkbox-row input[type="checkbox"] {
    width: 18px; height: 18px;
    accent-color: #ff4d4d;
    cursor: pointer;
  }
  .hd-checkbox-row label {
    font-family: 'Patrick Hand', cursive;
    font-size: 14px;
    color: rgba(45,45,45,0.7);
    cursor: pointer;
  }

  .hd-forgot {
    font-family: 'Patrick Hand', cursive;
    font-size: 13px;
    color: #2d5da1;
    text-decoration: none;
    position: relative;
    padding-bottom: 2px;
  }
  .hd-forgot::after {
    content: '';
    display: block;
    height: 2px;
    background: #2d5da1;
    border-radius: 2px;
    width: 0;
    transition: width 0.2s;
  }
  .hd-forgot:hover::after { width: 100%; }

  .hd-btn {
    width: 100%;
    padding: 14px 20px;
    font-family: 'Patrick Hand', cursive;
    font-size: 18px;
    color: #2d2d2d;
    background: #fff;
    border: 3px solid #2d2d2d;
    border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
    box-shadow: 4px 4px 0px 0px #2d2d2d;
    cursor: pointer;
    transition: all 0.1s;
  }
  .hd-btn:hover {
    background: #ff4d4d;
    color: #fff;
    box-shadow: 2px 2px 0px 0px #2d2d2d;
    transform: translate(2px, 2px);
  }
  .hd-btn:active {
    box-shadow: none;
    transform: translate(4px, 4px);
  }
`;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ username, password, remember });
  };

  return (
    <>
      <style>{styles}</style>

      <div className="hd-page">
        {/* Decorative blobs */}
        <div className="hd-blob hd-blob-1" />
        <div className="hd-blob hd-blob-2" />
        <div className="hd-blob hd-blob-3" />
        <div className="hd-star">★</div>

        {/* Scribble arrow */}
        <svg
          className="hd-scribble-arrow"
          style={{ position: "absolute", top: 100, left: 30, width: 80, opacity: 0.4 }}
          viewBox="0 0 80 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10 50 Q30 10 65 20"
            stroke="#2d2d2d"
            strokeWidth="2"
            strokeDasharray="4 3"
            fill="none"
          />
          <path
            d="M55 14 L68 22 L57 30"
            stroke="#2d2d2d"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        </svg>

        {/* Card */}
        <div className="hd-card">
          <div className="hd-tape" />
          <div className="hd-tack" />
          <div className="hd-sticky">welcome back!</div>

          <div className="hd-title">Sign in ✏️</div>
          <div className="hd-subtitle">grab your pencil, let's go</div>
          <span className="hd-underline" />

          <form onSubmit={handleSubmit}>
            {/* Username */}
            <div className="hd-input-wrap">
              <label className="hd-label" htmlFor="username">
                Username
              </label>
              <input
                className="hd-input"
                type="text"
                id="username"
                placeholder="e.g. U25EE102"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            {/* Password */}
            <div className="hd-input-wrap">
              <label className="hd-label" htmlFor="password">
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  className={`hd-input hd-input-pw`}
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="hd-eye-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  title="Toggle password visibility"
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {/* Remember me + Forgot password */}
            <div className="hd-row">
              <div className="hd-checkbox-row">
                <input
                  type="checkbox"
                  id="remember"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <label htmlFor="remember">Remember me</label>
              </div>
              <a href="#" className="hd-forgot">
                Forgot password?
              </a>
            </div>

            {/* Submit */}
            <button type="submit" className="hd-btn">
              Log in →
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
