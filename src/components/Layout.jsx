import Navbar from './Navbar';
import AttendancePopup from './AttendancePopup';
import ChatbotWidget from './ChatbotWidget';

export default function Layout({ children }) {
    return (
        <div className="hd-page">
            <Navbar />
            <AttendancePopup />
            <main className="hd-container hd-section" style={{ position: 'relative', zIndex: 1 }}>
                {children}
            </main>
            <ChatbotWidget />
        </div>
    );
}
