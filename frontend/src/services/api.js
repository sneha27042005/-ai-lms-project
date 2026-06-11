import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_URL,
});

// Add token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const registerUser = (data) => api.post('/auth/register/', data);
export const loginUser = (data) => api.post('/auth/login/', data);
export const getProfile = () => api.get('/auth/profile/');

// Courses APIs
export const getCourses = () => api.get('/courses/');
export const getCourse = (id) => api.get(`/courses/${id}/`);
export const createCourse = (data) => api.post('/courses/', data);
export const enrollCourse = (id) => api.post(`/courses/${id}/enroll/`);
export const getMyCourses = () => api.get('/courses/my-courses/');

// Lessons APIs
export const getLessons = (courseId) => api.get(`/courses/${courseId}/lessons/`);
export const createLesson = (courseId, data) => api.post(`/courses/${courseId}/lessons/`, data);

// Quiz APIs
export const getQuizzes = () => api.get('/quizzes/');
export const getQuiz = (id) => api.get(`/quizzes/${id}/`);
export const submitQuiz = (id, answers) => api.post(`/quizzes/${id}/submit/`, { answers });

// Chatbot APIs
export const sendMessage = (message, sessionId = null) => {
  const payload = { message };
  if (sessionId) payload.session_id = sessionId;
  return api.post('/chatbot/send/', payload);
};
export const getChatSessions = () => api.get('/chatbot/sessions/');

// Progress APIs
export const getDashboard = () => api.get('/progress/dashboard/');
export const markLessonComplete = (lessonId) => api.post(`/progress/lessons/${lessonId}/complete/`);



export default api;