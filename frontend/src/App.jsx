import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import Dashboard from './pages/Dashboard';
import Chatbot from './pages/Chatbot';
import Quiz from './pages/Quiz';
import { useAuth } from './context/AuthContext';
import Quizzes from './pages/Quizzes';

// Protect routes that need login
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="text-center py-20">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

// Redirect logged-in users away from login/register
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="text-center py-20">Loading...</div>;
  if (user) return <Navigate to="/dashboard" />;
  return children;
};

function App() {
  return (
    <div>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        
        {/* Public routes - redirect if already logged in */}
        <Route path="/login" element={
          <PublicRoute><Login /></PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute><Register /></PublicRoute>
        } />
        
        <Route path="/courses" element={<Courses />} />
        
        {/* Protected routes - need login */}
        <Route path="/courses/:id" element={
          <ProtectedRoute><CourseDetail /></ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/chatbot" element={
          <ProtectedRoute><Chatbot /></ProtectedRoute>
        } />
        <Route path="/quiz/:id" element={
          <ProtectedRoute><Quiz /></ProtectedRoute>
        } />
        <Route path="/quizzes" element={
  <ProtectedRoute><Quizzes /></ProtectedRoute>
} />
      </Routes>
      
    </div>
  );
}

export default App;