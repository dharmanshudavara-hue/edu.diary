import { useState, useEffect } from 'react';

export default function IntroAnimation({ onComplete }) {
    const [phase, setPhase] = useState('active'); // 'active' | 'exiting' | 'done'

    useEffect(() => {
        // Start exit animation
        const exitTimer = setTimeout(() => setPhase('exiting'), 3200);
        // Fully remove from DOM
        const doneTimer = setTimeout(() => {
            setPhase('done');
            onComplete?.();
        }, 4000);
        return () => {
            clearTimeout(exitTimer);
            clearTimeout(doneTimer);
        };
    }, [onComplete]);

    if (phase === 'done') return null;

    return (
        <>
            <style>{introStyles}</style>
            <div className={`intro-overlay ${phase === 'exiting' ? 'intro-exit' : ''}`}>
                {/* Dotted grid background (matches site) */}
                <div className="intro-grid-bg" />

                {/* Decorative blobs */}
                <div className="intro-blob intro-blob-1" />
                <div className="intro-blob intro-blob-2" />
                <div className="intro-blob intro-blob-3" />
                <div className="intro-blob intro-blob-4" />

                {/* Floating doodle elements */}
                <div className="intro-doodle intro-doodle-circle" />
                <div className="intro-doodle intro-doodle-square" />
                <div className="intro-doodle intro-doodle-triangle">△</div>

                {/* Bouncing star */}
                <div className="intro-star">★</div>
                <div className="intro-star intro-star-2">✦</div>

                {/* Pencil SVG sketch */}
                <svg className="intro-pencil-svg" viewBox="0 0 120 80" fill="none">
                    <path d="M15 65 Q40 20 90 35" stroke="#2d2d2d" strokeWidth="2.5" strokeDasharray="5 4" fill="none" className="intro-pencil-path" />
                    <path d="M80 29 L93 37 L82 45" stroke="#2d2d2d" strokeWidth="2.5" fill="none" strokeLinecap="round" className="intro-pencil-path" />
                </svg>

                {/* Small notebook lines deco */}
                <div className="intro-lines">
                    <div className="intro-line" />
                    <div className="intro-line" />
                    <div className="intro-line" />
                    <div className="intro-line" />
                </div>

                {/* Main content */}
                <div className="intro-content">
                    {/* Tape decoration */}
                    <div className="intro-tape" />

                    {/* Title with letter-by-letter reveal */}
                    <div className="intro-title-wrapper">
                        <div className="intro-title">
                            {'edu.Diary'.split('').map((char, i) => (
                                <span
                                    key={i}
                                    className="intro-letter"
                                    style={{ animationDelay: `${0.8 + i * 0.09}s` }}
                                >
                                    {char}
                                </span>
                            ))}
                            <span
                                className="intro-letter intro-pencil-emoji"
                                style={{ animationDelay: `${0.8 + 9 * 0.09}s` }}
                            >
                                {' ✏️'}
                            </span>
                        </div>

                        {/* Hand-drawn underline */}
                        <svg className="intro-underline-svg" viewBox="0 0 260 20" preserveAspectRatio="none">
                            <path
                                d="M5 12 Q30 4 65 14 Q100 22 135 10 Q170 2 200 13 Q230 20 255 8"
                                stroke="#ff4d4d"
                                strokeWidth="4"
                                fill="none"
                                strokeLinecap="round"
                                className="intro-underline-path"
                            />
                        </svg>
                    </div>

                    {/* Subtitle */}
                    <div className="intro-subtitle">track your university life</div>

                    {/* Post-it note */}
                    <div className="intro-postit">welcome! 📓</div>

                    {/* Loading dots */}
                    <div className="intro-dots">
                        <span className="intro-dot" style={{ animationDelay: '2.6s' }} />
                        <span className="intro-dot" style={{ animationDelay: '2.75s' }} />
                        <span className="intro-dot" style={{ animationDelay: '2.9s' }} />
                    </div>
                </div>

                {/* Tack decoration */}
                <div className="intro-tack" />
            </div>
        </>
    );
}

const introStyles = `
/* ═══════════════════════════════════════════
   INTRO ANIMATION — matches hand-drawn theme
   ═══════════════════════════════════════════ */

.intro-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: var(--bg, #fdfbf7);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    animation: intro-bgFadeIn 0.6s ease-out;
}

.intro-overlay.intro-exit {
    animation: intro-exitAnim 0.8s ease-in forwards;
}

/* Background grid */
.intro-grid-bg {
    position: absolute;
    inset: 0;
    background-image: radial-gradient(var(--muted, #e5e0d8) 1px, transparent 1px);
    background-size: 24px 24px;
    opacity: 0;
    animation: intro-gridReveal 1s ease-out 0.1s forwards;
}

/* ── Blobs ── */
.intro-blob {
    position: absolute;
    border: 2.5px dashed var(--muted, #e5e0d8);
    pointer-events: none;
    opacity: 0;
    animation: intro-blobIn 0.6s ease-out forwards;
}
.intro-blob-1 {
    width: 200px; height: 200px;
    border-radius: 62% 38% 70% 30% / 44% 58% 42% 56%;
    top: -50px; left: -50px;
    animation-delay: 0.3s;
}
.intro-blob-2 {
    width: 160px; height: 160px;
    border-radius: 38% 62% 30% 70% / 58% 44% 56% 42%;
    bottom: -40px; right: -40px;
    animation-delay: 0.5s;
}
.intro-blob-3 {
    width: 90px; height: 90px;
    border-radius: 50%;
    border-color: var(--accent, #ff4d4d);
    border-width: 3px;
    top: 15%; right: 12%;
    animation-delay: 0.7s;
}
.intro-blob-4 {
    width: 60px; height: 60px;
    border-radius: 30% 60% 40% 70% / 65% 35% 55% 45%;
    bottom: 18%; left: 8%;
    animation-delay: 0.9s;
}

/* ── Doodle elements ── */
.intro-doodle {
    position: absolute;
    pointer-events: none;
    opacity: 0;
}
.intro-doodle-circle {
    width: 40px; height: 40px;
    border: 2.5px dashed var(--accent, #ff4d4d);
    border-radius: 50%;
    top: 22%; left: 15%;
    animation: intro-doodleSpin 0.5s ease-out 2s forwards, intro-slowSpin 8s linear 2.5s infinite;
}
.intro-doodle-square {
    width: 30px; height: 30px;
    border: 2.5px dashed var(--blue, #2d5da1);
    border-radius: 4px;
    bottom: 25%; right: 15%;
    transform: rotate(15deg);
    animation: intro-doodleSpin 0.5s ease-out 2.15s forwards;
}
.intro-doodle-triangle {
    font-family: var(--font-heading, 'Kalam', cursive);
    font-size: 28px;
    color: var(--blue, #2d5da1);
    top: 30%; right: 20%;
    animation: intro-doodleSpin 0.5s ease-out 2.3s forwards;
}

/* ── Stars ── */
.intro-star {
    position: absolute;
    font-family: var(--font-heading, 'Kalam', cursive);
    font-size: 32px;
    color: var(--accent, #ff4d4d);
    bottom: 15%; left: 18%;
    opacity: 0;
    animation: intro-starPop 0.5s ease-out 2.1s forwards;
    user-select: none;
}
.intro-star-2 {
    font-size: 22px;
    color: var(--blue, #2d5da1);
    bottom: auto;
    left: auto;
    top: 18%; right: 25%;
    animation-delay: 2.35s;
}

/* ── Pencil SVG ── */
.intro-pencil-svg {
    position: absolute;
    width: 100px;
    top: 12%; left: 6%;
    opacity: 0;
    animation: intro-fadeUp 0.6s ease-out 0.4s forwards;
}
.intro-pencil-path {
    stroke-dashoffset: 100;
    animation: intro-drawPath 1.2s ease-out 0.5s forwards;
}

/* ── Notebook lines deco ── */
.intro-lines {
    position: absolute;
    bottom: 12%;
    right: 8%;
    display: flex;
    flex-direction: column;
    gap: 8px;
    opacity: 0;
    animation: intro-fadeUp 0.5s ease-out 2.4s forwards;
}
.intro-line {
    width: 60px;
    height: 2px;
    background: var(--muted, #e5e0d8);
    border-radius: 1px;
}
.intro-line:nth-child(2) { width: 45px; }
.intro-line:nth-child(3) { width: 52px; }
.intro-line:nth-child(4) { width: 30px; }

/* ═══ Main content ═══ */
.intro-content {
    position: relative;
    text-align: center;
    z-index: 2;
}

/* Tape */
.intro-tape {
    position: absolute;
    top: -40px;
    left: 50%;
    transform: translateX(-50%) rotate(-3deg);
    width: 90px;
    height: 30px;
    background: rgba(200, 190, 180, 0.5);
    border-radius: 3px;
    border: 1px solid rgba(150, 140, 130, 0.35);
    opacity: 0;
    animation: intro-tapeIn 0.4s ease-out 2s forwards;
}

/* ── Title ── */
.intro-title-wrapper {
    margin-bottom: 16px;
    position: relative;
    display: inline-block;
}

.intro-title {
    font-family: var(--font-heading, 'Kalam', cursive);
    font-weight: 700;
    font-size: clamp(40px, 8vw, 64px);
    color: var(--fg, #2d2d2d);
    line-height: 1.1;
    letter-spacing: -1px;
}

.intro-letter {
    display: inline-block;
    opacity: 0;
    transform: translateY(20px) rotate(-5deg);
    animation: intro-letterIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.intro-pencil-emoji {
    transform: translateY(20px) rotate(10deg) !important;
}

/* Hand-drawn underline */
.intro-underline-svg {
    display: block;
    width: 85%;
    height: 18px;
    margin: 4px auto 0;
    overflow: visible;
}
.intro-underline-path {
    stroke-dasharray: 400;
    stroke-dashoffset: 400;
    animation: intro-drawUnderline 0.8s ease-out 1.8s forwards;
}

/* ── Subtitle ── */
.intro-subtitle {
    font-family: var(--font-body, 'Patrick Hand', cursive);
    font-size: clamp(16px, 3vw, 22px);
    color: var(--fg, #2d2d2d);
    opacity: 0;
    animation: intro-fadeUp 0.6s ease-out 2.4s forwards;
}

/* ── Post-it note ── */
.intro-postit {
    position: absolute;
    top: -60px;
    right: -80px;
    background: var(--postit, #fff9c4);
    border: 2px solid var(--border, #2d2d2d);
    border-radius: 4px 255px 4px 4px / 4px 4px 4px 225px;
    padding: 6px 14px;
    font-family: var(--font-heading, 'Kalam', cursive);
    font-size: 13px;
    color: var(--fg, #2d2d2d);
    transform: rotate(5deg);
    box-shadow: 3px 3px 0 var(--border, #2d2d2d);
    white-space: nowrap;
    opacity: 0;
    animation: intro-postitPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 2.2s forwards;
}

/* ── Loading dots ── */
.intro-dots {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-top: 28px;
}
.intro-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--accent, #ff4d4d);
    border: 2px solid var(--border, #2d2d2d);
    opacity: 0;
    animation: intro-dotBounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

/* Tack */
.intro-tack {
    position: absolute;
    width: 18px; height: 18px;
    border-radius: 50%;
    background: var(--accent, #ff4d4d);
    border: 2px solid var(--border, #2d2d2d);
    top: 30px; right: 60px;
    box-shadow: 1px 1px 0px var(--border, #2d2d2d);
    opacity: 0;
    animation: intro-doodleSpin 0.4s ease-out 2.5s forwards;
    z-index: 3;
}

/* ═══════════════════════
   KEYFRAME ANIMATIONS
   ═══════════════════════ */

@keyframes intro-bgFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes intro-gridReveal {
    from { opacity: 0; transform: scale(1.1); }
    to { opacity: 1; transform: scale(1); }
}

@keyframes intro-exitAnim {
    0% { opacity: 1; transform: scale(1); }
    100% { opacity: 0; transform: scale(1.06); pointer-events: none; }
}

@keyframes intro-blobIn {
    from { opacity: 0; transform: scale(0.5); }
    to { opacity: 1; transform: scale(1); }
}

@keyframes intro-letterIn {
    0% { opacity: 0; transform: translateY(20px) rotate(-5deg); }
    100% { opacity: 1; transform: translateY(0) rotate(0deg); }
}

@keyframes intro-fadeUp {
    from { opacity: 0; transform: translateY(15px); }
    to { opacity: 1; transform: translateY(0); }
}

@keyframes intro-drawUnderline {
    to { stroke-dashoffset: 0; }
}

@keyframes intro-drawPath {
    to { stroke-dashoffset: 0; }
}

@keyframes intro-tapeIn {
    from { opacity: 0; transform: translateX(-50%) rotate(-3deg) scaleX(0); }
    to { opacity: 1; transform: translateX(-50%) rotate(-3deg) scaleX(1); }
}

@keyframes intro-postitPop {
    0% { opacity: 0; transform: rotate(5deg) scale(0.3); }
    100% { opacity: 1; transform: rotate(5deg) scale(1); }
}

@keyframes intro-doodleSpin {
    0% { opacity: 0; transform: scale(0) rotate(0deg); }
    100% { opacity: 1; transform: scale(1) rotate(0deg); }
}

@keyframes intro-slowSpin {
    from { transform: rotate(0deg); opacity: 1; }
    to { transform: rotate(360deg); opacity: 1; }
}

@keyframes intro-starPop {
    0% { opacity: 0; transform: scale(0) rotate(-30deg); }
    60% { transform: scale(1.3) rotate(5deg); }
    100% { opacity: 1; transform: scale(1) rotate(-15deg); }
}

@keyframes intro-dotBounce {
    0% { opacity: 0; transform: scale(0); }
    60% { transform: scale(1.3); }
    100% { opacity: 1; transform: scale(1); }
}

/* ── Responsive ── */
@media (max-width: 600px) {
    .intro-postit {
        top: -50px;
        right: -30px;
        font-size: 11px;
        padding: 4px 10px;
    }
    .intro-blob-1 { width: 120px; height: 120px; }
    .intro-blob-2 { width: 100px; height: 100px; }
    .intro-blob-3 { width: 60px; height: 60px; }
    .intro-pencil-svg { width: 70px; }
    .intro-tape { width: 60px; height: 22px; top: -30px; }
    .intro-star { font-size: 24px; }
    .intro-star-2 { font-size: 16px; }
    .intro-doodle-circle { width: 28px; height: 28px; }
    .intro-doodle-square { width: 22px; height: 22px; }
    .intro-doodle-triangle { font-size: 20px; }
    .intro-tack { width: 14px; height: 14px; top: 20px; right: 30px; }
}
`;
