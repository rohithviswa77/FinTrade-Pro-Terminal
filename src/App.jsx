import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Import Paths
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import Dashboard from './pages/Dashboard';
import TradeDetail from './pages/TradeDetail';
import Settings from './pages/Settings'; // Added Settings import

export default function App() {
  const { user, loading } = useAuth();

  // Show a clean loading spinner while checking auth status
  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
    </div>
  );

  return (
    <Router>
      <Routes>
        {/* Authentication Routes */}
        <Route 
          path="/login" 
          element={!user ? <LoginPage /> : <Navigate to="/" />} 
        />
        <Route 
          path="/signup" 
          element={!user ? <SignupPage /> : <Navigate to="/" />} 
        />
        <Route 
          path="/forgot-password" 
          element={<ForgotPasswordPage />} 
        />

        {/* Protected Dashboard */}
        <Route 
          path="/" 
          element={user ? <Dashboard /> : <Navigate to="/login" />} 
        />

        {/* Protected Detailed Trade Page */}
        <Route 
          path="/trade/:symbol" 
          element={user ? <TradeDetail /> : <Navigate to="/login" />} 
        />

        {/* Protected Settings Page */}
        {/* This route was missing, which prevented the Sidebar link from working */}
        <Route 
          path="/settings" 
          element={user ? <Settings /> : <Navigate to="/login" />} 
        />

        {/* Catch-all: Redirect any unknown URLs to the Dashboard/Login gate */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}