import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/UI/Navbar';
import Home from './pages/Home';
import Report from './pages/Report';
import Rankings from './pages/Rankings';
import Politician from './pages/Politician';
import Admin from './pages/Admin';
import Login from './pages/Login';
import IssueDetail from './pages/IssueDetail';
import Community from './pages/Community';
import Profile from './pages/Profile';
import { useAuth } from './contexts/AuthContext';

const ProtectedAdminRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!currentUser) return <Navigate to="/login" replace />;
  // Note: in a real app, you'd check `currentUser.labels.includes('official')`
  return children;
};

const ProtectedCitizenRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!currentUser) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="container mx-auto px-4 pt-24 pb-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/report" element={
              <ProtectedCitizenRoute>
                <Report />
              </ProtectedCitizenRoute>
            } />
            <Route path="/rankings" element={<Rankings />} />
            <Route path="/politician/:slug" element={<Politician />} />
            <Route path="/login" element={<Login />} />
            <Route path="/issue/:id" element={<IssueDetail />} />
            <Route path="/community" element={<Community />} />
            <Route path="/profile" element={
              <ProtectedCitizenRoute>
                <Profile />
              </ProtectedCitizenRoute>
            } />
            <Route path="/admin" element={
              <ProtectedAdminRoute>
                <Admin />
              </ProtectedAdminRoute>
            } />
            <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
