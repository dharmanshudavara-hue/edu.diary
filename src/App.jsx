import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isLoggedIn, isOnboarded, clearData } from './utils/storage';
import LoginPage from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import AttendancePage from './pages/AttendancePage';
import SchedulePage from './pages/SchedulePage';
import TasksPage from './pages/TasksPage';

function ProtectedRoute({ children }) {
    if (!isLoggedIn()) return <Navigate to="/login" replace />;
    if (!isOnboarded()) return <Navigate to="/onboarding" replace />;
    return children;
}

function AuthRoute({ children }) {
    // Only redirect if user is FULLY set up (logged in AND onboarded)
    if (isLoggedIn() && isOnboarded()) return <Navigate to="/dashboard" replace />;
    return children;
}

function OnboardingRoute() {
    if (!isLoggedIn()) return <Navigate to="/login" replace />;
    if (isOnboarded()) return <Navigate to="/dashboard" replace />;
    return <OnboardingPage />;
}

import { useState } from 'react';
import IntroAnimation from './components/IntroAnimation';

export default function App() {
    const [showIntro, setShowIntro] = useState(!sessionStorage.getItem('introPlayed'));

    return (
        <>
            {showIntro && <IntroAnimation onComplete={() => {
                sessionStorage.setItem('introPlayed', 'true');
                setShowIntro(false);
            }} />}
            {!showIntro && (
                <BrowserRouter>
                    <Routes>
                        <Route path="/login" element={
                            <AuthRoute><LoginPage /></AuthRoute>
                        } />
                        <Route path="/onboarding" element={<OnboardingRoute />} />
                        <Route path="/dashboard" element={
                            <ProtectedRoute><DashboardPage /></ProtectedRoute>
                        } />
                        <Route path="/attendance" element={
                            <ProtectedRoute><AttendancePage /></ProtectedRoute>
                        } />
                        <Route path="/schedule" element={
                            <ProtectedRoute><SchedulePage /></ProtectedRoute>
                        } />
                        <Route path="/tasks" element={
                            <ProtectedRoute><TasksPage /></ProtectedRoute>
                        } />
                        <Route path="*" element={<Navigate to="/login" replace />} />
                    </Routes>
                </BrowserRouter>
            )}
        </>
    );
}
