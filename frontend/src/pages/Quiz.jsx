import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuiz, submitQuiz } from '../services/api';

const Quiz = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuiz();
  }, [id]);

  const fetchQuiz = async () => {
    try {
      const res = await getQuiz(id);
      setQuiz(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId, option) => {
    setAnswers({ ...answers, [questionId]: option });
  };

  const handleSubmit = async () => {
    try {
      const res = await submitQuiz(id, answers);
      setResult(res.data);
    } catch (error) {
      alert('Submission failed');
    }
  };

  if (loading) return <div className="text-center py-20">Loading...</div>;
  if (!quiz) return <div className="text-center py-20">Quiz not found</div>;

  if (result) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-6 max-w-2xl">
          <div className="bg-white rounded-2xl shadow-2xl p-10 text-center">
            <div className="text-6xl mb-4">
              {result.is_passed ? '🎉' : '😔'}
            </div>
            <h1 className="text-3xl font-bold mb-4">
              {result.is_passed ? 'Congratulations!' : 'Keep Trying!'}
            </h1>
            <div className="text-5xl font-bold text-blue-600 my-6">
              {result.percentage}%
            </div>
            <p className="text-gray-600 mb-2">
              Score: {result.score} / {result.total_questions}
            </p>
            <p className="text-gray-600 mb-6">
              Passing Score: {result.passing_score}%
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate('/quizzes')}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition"
              >
                Back to Quizzes
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-6 max-w-3xl">
        {/* Header with back button */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/quizzes')}
            className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-2"
          >
            ← Back to Quizzes
          </button>
          <div className="text-gray-600 text-sm">
            Answered: {answeredCount} / {quiz.questions.length}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{quiz.title}</h1>
          <p className="text-gray-600 mb-8">{quiz.description}</p>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">Progress</span>
              <span className="text-sm font-semibold text-gray-700">
                {answeredCount}/{quiz.questions.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(answeredCount / quiz.questions.length) * 100}%` }}
              />
            </div>
          </div>

          {quiz.questions.map((q, idx) => (
            <div key={q.id} className="mb-6 p-6 border rounded-lg hover:bg-gray-50 transition">
              <h3 className="font-semibold mb-4 text-gray-800">
                {idx + 1}. {q.text}
              </h3>
              <div className="space-y-2">
                {['A', 'B', 'C', 'D'].map((opt) => (
                  <label
                    key={opt}
                    className={`flex items-center gap-3 p-3 rounded cursor-pointer transition ${
                      answers[q.id] === opt
                        ? 'bg-blue-100 border-2 border-blue-500'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      value={opt}
                      checked={answers[q.id] === opt}
                      onChange={() => handleAnswer(q.id, opt)}
                    />
                    <span>
                      <strong>{opt}.</strong> {q[`option_${opt.toLowerCase()}`]}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <div className="flex gap-4 mt-8">
            <button
              onClick={() => navigate('/quizzes')}
              className="flex-1 bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition"
            >
              Submit Quiz
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quiz;