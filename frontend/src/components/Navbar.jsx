import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/" className="text-white text-2xl font-bold flex items-center gap-2">
          🎓 AI LMS
        </Link>

        <div className="flex items-center gap-6">
          <Link to="/" className="text-white hover:text-gray-200">Home</Link>
          <Link to="/courses" className="text-white hover:text-gray-200">Courses</Link>
          
          {user ? (
            <>
              <Link to="/dashboard" className="text-white hover:text-gray-200">Dashboard</Link>
              <Link to="/chatbot" className="text-white hover:text-gray-200">AI Tutor</Link>
              <Link to="/quiz/1" className="text-white hover:text-gray-200">Quizzes</Link>
              <span className="text-white">👋 {user.username}</span>
              <button 
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                className="text-white hover:text-gray-200"
              >
                Login
              </Link>
              <Link 
                to="/register" 
                className="bg-white text-blue-600 hover:bg-gray-100 px-4 py-2 rounded-lg font-semibold transition"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;