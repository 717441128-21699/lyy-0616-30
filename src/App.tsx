import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Navbar } from './components/Navbar';
import Home from './pages/Home';
import ActivityDetail from './pages/ActivityDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import OrgDashboard from './pages/org/OrgDashboard';
import OrgActivities from './pages/org/OrgActivities';
import OrgRegistrations from './pages/org/OrgRegistrations';
import OrgCheckIn from './pages/org/OrgCheckIn';
import OrgSummary from './pages/org/OrgSummary';
import OrgStats from './pages/org/OrgStats';
import OrgActivityStatsDetail from './pages/org/OrgActivityStatsDetail';
import OrgActivityReview from './pages/org/OrgActivityReview';
import OrgNotifications from './pages/org/OrgNotifications';
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
        <Route path="/notifications" element={<Notifications />} />

        <Route path="/org/dashboard" element={<OrgDashboard />} />
        <Route path="/org/activities" element={<OrgActivities />} />
        <Route path="/org/registrations" element={<OrgRegistrations />} />
        <Route path="/org/activity/:id/registrations" element={<OrgRegistrations />} />
        <Route path="/org/checkin" element={<OrgCheckIn />} />
        <Route path="/org/activity/:id/checkin" element={<OrgCheckIn />} />
        <Route path="/org/summary" element={<OrgSummary />} />
        <Route path="/org/stats" element={<OrgStats />} />
        <Route path="/org/activity/:id/stats" element={<OrgActivityStatsDetail />} />
        <Route path="/org/activity/:id/review" element={<OrgActivityReview />} />
        <Route path="/org/notifications" element={<OrgNotifications />} />
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
