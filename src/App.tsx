import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Navbar } from './components/Navbar';
import Home from './pages/Home';
import ActivityDetail from './pages/ActivityDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import OrgDashboard from './pages/org/OrgDashboard';
import OrgActivities from './pages/org/OrgActivities';
import OrgRegistrations from './pages/org/OrgRegistrations';
import OrgCheckIn from './pages/org/OrgCheckIn';
import OrgSummary from './pages/org/OrgSummary';
import { useAuthStore } from './store/useAuthStore';

function AppContent() {
  const location = useLocation();
  const { fetchCurrentUser, token } = useAuthStore();

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    }
  }, [token, fetchCurrentUser]);

  const isOrgPage = location.pathname.startsWith('/org/');
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className="min-h-screen bg-gray-50">
      {!isOrgPage && !isAuthPage && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/activity/:id" element={<ActivityDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />

        <Route path="/org/dashboard" element={<OrgDashboard />} />
        <Route path="/org/activities" element={<OrgActivities />} />
        <Route path="/org/registrations" element={<OrgRegistrations />} />
        <Route path="/org/activity/:id/registrations" element={<OrgRegistrations />} />
        <Route path="/org/checkin" element={<OrgCheckIn />} />
        <Route path="/org/activity/:id/checkin" element={<OrgCheckIn />} />
        <Route path="/org/summary" element={<OrgSummary />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
