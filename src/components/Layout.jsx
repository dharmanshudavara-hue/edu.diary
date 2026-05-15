import Navbar from './Navbar';
import AttendancePopup from './AttendancePopup';
import ChatbotWidget from './ChatbotWidget';
import UndoSnackbar from './UndoSnackbar';
import PageTransition from './PageTransition';

export default function Layout({ children }) {
    return (
        <div className="hd-page">
            <a href="#main-content" className="skip-nav">Skip to content</a>
            <Navbar />
            <AttendancePopup />
            <main id="main-content" className="hd-container hd-section" style={{ position: 'relative', zIndex: 1 }} role="main">
                <PageTransition>
                    {children}
                </PageTransition>
            </main>
            <ChatbotWidget />
            <UndoSnackbar />
        </div>
    );
}
