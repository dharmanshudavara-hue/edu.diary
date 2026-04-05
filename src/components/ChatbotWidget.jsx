import { useState, useEffect, useRef } from 'react';
import { sendChatMessage } from '../utils/aiHandler';
import chatAvatar from '../assets/avatars/chat_avatar.jpeg';

export default function ChatbotWidget() {
    const [isOpen, setIsOpen] = useState(false);
    
    const [messages, setMessages] = useState([
        { role: 'model', parts: "Hi there! I'm Lumi, your personal study assistant. Ask me about your attendance, schedule, or let me remind you about upcoming tasks!" }
    ]);
    const [inputMsg, setInputMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!inputMsg.trim() || isLoading) return;

        const userText = inputMsg.trim();
        setInputMsg('');
        
        const newHistory = [...messages, { role: 'user', parts: userText }];
        setMessages(newHistory);
        setIsLoading(true);

        try {
            const responseText = await sendChatMessage(newHistory);
            setMessages(prev => [...prev, { role: 'model', parts: responseText }]);
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { role: 'model', parts: "Oops! Something went wrong retrieving the data." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <style>{styles}</style>
            
            {/* The Floating Button */}
            {!isOpen && (
                <button 
                    className="chatbot-fab hd-btn" 
                    onClick={() => setIsOpen(true)}
                    title="Chat with Lumi"
                >
                    <img src={chatAvatar} alt="Lumi" className="chatbot-avatar" />
                </button>
            )}

            {/* The Chat Window */}
            {isOpen && (
                <div className="chatbot-window hd-card hd-card--flat">
                    <div className="chatbot-header">
                        <div className="chatbot-header-left">
                            <img src={chatAvatar} alt="Lumi" className="chatbot-avatar-small" />
                            <h3 style={{ margin: 0 }}>Lumi</h3>
                        </div>
                        <button className="chatbot-close" onClick={() => setIsOpen(false)}>✖</button>
                    </div>

                    <div className="chatbot-messages">
                        {messages.map((m, i) => (
                            <div key={i} className={`chatbot-bubble-wrap ${m.role === 'user' ? 'user' : 'model'}`}>
                                <div className={`chatbot-bubble ${m.role === 'user' ? 'user' : 'model'}`}>
                                    {m.parts.split('\n').map((line, idx) => (
                                        <span key={idx}>
                                            {line}
                                            <br />
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="chatbot-bubble-wrap model">
                                <div className="chatbot-bubble model chatbot-typing">
                                    Lumi is writing...
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleSend} className="chatbot-input-area">
                        <input 
                            className="hd-input" 
                            placeholder="Ask me anything..." 
                            value={inputMsg}
                            style={{ padding: '8px 12px', fontSize: 14 }}
                            onChange={(e) => setInputMsg(e.target.value)}
                        />
                        <button type="submit" className="hd-btn" style={{ padding: '8px 12px' }} disabled={isLoading}>
                            ➤
                        </button>
                    </form>
                </div>
            )}
        </>
    );
}

const styles = `
.chatbot-fab {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 65px;
    height: 65px;
    border-radius: 50% !important;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    box-shadow: 4px 6px 0px rgba(0,0,0,0.8);
    z-index: 1000;
}
.chatbot-fab:hover {
    transform: translateY(-4px) rotate(5deg);
}
.chatbot-avatar {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.chatbot-window {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 350px;
    height: 480px;
    max-height: 80vh;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    padding: 0;
    overflow: hidden;
    background: var(--white);
    transform: rotate(-0.5deg);
    animation: hd-fadeIn 0.2s ease-out;
}

@media(max-width: 400px) {
    .chatbot-window {
        bottom: 0;
        right: 0;
        width: 100%;
        height: 100%;
        max-height: 100vh;
        border-radius: 0;
        transform: none;
    }
}

.chatbot-header {
    background: var(--postit);
    border-bottom: 3px solid var(--border);
    padding: 12px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.chatbot-header-left {
    display: flex;
    align-items: center;
    gap: 12px;
}

.chatbot-avatar-small {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid var(--border);
}

.chatbot-close {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    font-weight: bold;
    color: var(--fg);
}
.chatbot-close:hover {
    color: var(--accent);
}

.chatbot-messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    background: var(--bg);
}

.chatbot-bubble-wrap {
    display: flex;
    width: 100%;
}
.chatbot-bubble-wrap.user {
    justify-content: flex-end;
}
.chatbot-bubble-wrap.model {
    justify-content: flex-start;
}

.chatbot-bubble {
    max-width: 80%;
    padding: 10px 14px;
    font-size: 14px;
    line-height: 1.4;
    position: relative;
    word-break: break-word;
}

.chatbot-bubble.model {
    background: var(--white);
    border: 2px solid var(--border);
    border-radius: 12px 12px 12px 4px;
}

.chatbot-bubble.user {
    background: var(--blue);
    color: var(--white);
    border: 2px solid var(--border);
    border-radius: 12px 12px 4px 12px;
}

.chatbot-typing {
    opacity: 0.6;
    font-style: italic;
}

.chatbot-input-area {
    padding: 12px;
    border-top: 3px solid var(--border);
    background: var(--white);
    display: flex;
    gap: 8px;
}
`;
