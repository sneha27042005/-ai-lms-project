import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getQuizzes } from '../services/api';

const Quizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getQuizzes();
      setQuizzes(res.data);
    } catch (error) {
      console.error(error);
      setError('Failed to load quizzes. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
          <p className="text-gray-600 mt-4">Loading quizzes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">📝 Quizzes</h1>
          <p className="text-gray-600 text-lg">Test your knowledge with our interactive quizzes</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {/* Quiz Cards */}
        {quizzes.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-gray-600 text-lg">No quizzes available yet.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz, idx) => (
              <div
                key={quiz.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition transform hover:-translate-y-1 cursor-pointer"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-6 text-white">
                  <div className="text-4xl mb-2">📝</div>
                  <h3 className="text-xl font-bold">Quiz {idx + 1}</h3>
                </div>

                {/* Card Body */}
                <div className="p-6">
                  <h4 className="text-lg font-bold text-gray-800 mb-2">
                    {quiz.title}
                  </h4>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {quiz.description || 'Test your knowledge'}
                  </p>

                  <div className="flex justify-between text-sm text-gray-500 mb-4 pb-4 border-b">
                    <span className="flex items-center gap-1">
                      📋 {quiz.total_questions} {quiz.total_questions === 1 ? 'Question' : 'Questions'}
                    </span>
                    <span className="flex items-center gap-1">
                      🎯 {quiz.passing_score}%
                    </span>
                  </div>

                  <button
                    onClick={() => navigate(`/quiz/${quiz.id}`)}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition flex items-center justify-center gap-2"
                  >
                    Start Quiz <span>→</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Quizzes;