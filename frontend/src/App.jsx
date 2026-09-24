import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AlertToast from './components/AlertToast.jsx';
import SkinsList from './pages/SkinsList.jsx';
import SkinDetail from './pages/SkinDetail.jsx';
import Login from './pages/Login.jsx';
import Alerts from './pages/Alerts.jsx';
import About from './pages/About.jsx';
import { useAuth } from './AuthContext.jsx';
import { api } from './api.js';

export default function App() {
  const { isLoggedIn } = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!isLoggedIn) return;

    api
      .getAlerts()
      .then((alerts) => {
        const unseen = alerts.filter((a) => a.triggered_unseen);
        if (unseen.length === 0) return;

        setNotifications(unseen);
        Promise.all(unseen.map((a) => api.updateAlert(a.id, { triggered_unseen: false }))).catch(() => {});
      })
      .catch(() => {});
  }, [isLoggedIn]);

  const handleDismiss = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="min-h-screen bg-base flex flex-col">
      <Navbar />
      <AlertToast notifications={notifications} onDismiss={handleDismiss} />
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-10">
        <Routes>
          <Route path="/" element={<SkinsList />} />
          <Route path="/skins/:id" element={<SkinDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/about" element={<About />} />
          <Route
            path="/alerts"
            element={
              <ProtectedRoute>
                <Alerts />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
