# 🎓 AI Learning Management System (AI LMS)

A modern Learning Management System with AI-powered tutoring built using Django REST Framework and React.

## 🌟 Features

- 🔐 **JWT Authentication** - Secure user registration and login
- 📚 **Course Management** - Create, browse, and enroll in courses
- 📖 **Lesson System** - Structured lessons with progress tracking
- 📝 **Quiz System** - Interactive quizzes with auto-grading
- 🤖 **AI Tutor Chatbot** - Personal AI tutor powered by Google Gemini
- 📊 **Progress Tracking** - Detailed analytics and dashboard
- 🎨 **Modern UI** - Beautiful design with Tailwind CSS

## 🛠️ Tech Stack

### Backend
- **Python 3.12**
- **Django 6.0**
- **Django REST Framework**
- **PostgreSQL**
- **JWT Authentication** (Simple JWT)
- **Google Gemini AI API**

### Frontend
- **React 18** (with Vite)
- **Tailwind CSS**
- **React Router**
- **Axios**

## 📁 Project Structure
ai-lms-project/
├── backend/
│ ├── accounts/ # User authentication
│ ├── courses/ # Course management
│ ├── quizzes/ # Quiz system
│ ├── chatbot/ # AI tutor integration
│ ├── progress/ # Progress tracking
│ └── config/ # Django settings
├── frontend/
│ ├── src/
│ │ ├── components/ # Reusable components
│ │ ├── pages/ # Page components
│ │ ├── context/ # Auth context
│ │ └── services/ # API services
│ └── public/
└── README.md



## 🚀 Installation & Setup

### Prerequisites
- Python 3.12+
- Node.js 18+
- PostgreSQL
- Gemini API Key

### Backend Setup

```bash
# Clone repository
git clone https://github.com/sneha27042005/-ai-lms-project.git
cd ai-lms-project/backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Create .env file
# Add your environment variables (see .env.example)

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run server
python manage.py runserver
Frontend Setup
Bash

cd frontend
npm install
npm run dev
🔑 Environment Variables (.env)
env

SECRET_KEY=your-secret-key
DEBUG=True
DB_NAME=lms_db
DB_USER=postgres
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=5432
GEMINI_API_KEY=your-gemini-api-key

📡 API Endpoints
Authentication
Method	Endpoint	Description
POST	/api/auth/register/	Register new user
POST	/api/auth/login/	Login user
POST	/api/auth/logout/	Logout user
GET	/api/auth/profile/	Get user profile
POST	/api/auth/token/refresh/	Refresh JWT token
Courses
Method	Endpoint	Description
GET	/api/courses/	List all courses
POST	/api/courses/	Create course
GET	/api/courses/{id}/	Get course details
PUT	/api/courses/{id}/	Update course
DELETE	/api/courses/{id}/	Delete course
POST	/api/courses/{id}/enroll/	Enroll in course
GET	/api/courses/my-courses/	Get enrolled courses
Lessons
Method	Endpoint	Description
GET	/api/courses/{course_id}/lessons/	List lessons
POST	/api/courses/{course_id}/lessons/	Create lesson
GET	/api/courses/{course_id}/lessons/{id}/	Get lesson
Quizzes
Method	Endpoint	Description
GET	/api/quizzes/	List all quizzes
GET	/api/quizzes/{id}/	Get quiz details
POST	/api/quizzes/{id}/submit/	Submit quiz answers
GET	/api/quizzes/my-attempts/	Get quiz attempts
AI Chatbot
Method	Endpoint	Description
POST	/api/chatbot/send/	Send message to AI
GET	/api/chatbot/sessions/	List chat sessions
GET	/api/chatbot/sessions/{id}/	Get session messages
Progress
Method	Endpoint	Description
GET	/api/progress/dashboard/	Get dashboard stats
GET	/api/progress/courses/	Course progress
POST	/api/progress/lessons/{id}/complete/	Mark lesson complete
🧪 Sample API Requests
Register
JSON

POST /api/auth/register/
{
    "username": "student1",
    "email": "student@example.com",
    "password": "password123",
    "confirm_password": "password123",
    "role": "student"
}
Login
JSON

POST /api/auth/login/
{
    "email": "student@example.com",
    "password": "password123"
}
Chat with AI
JSON

POST /api/chatbot/send/
Headers: Authorization: Bearer <token>
{
    "message": "Explain Python loops"
}
👨‍💻 Author
Sneha - GitHub

📄 License
This project is licensed under the MIT License.

🙏 Acknowledgments
Google Gemini AI for chatbot intelligence
Django REST Framework
React & Tailwind CSS community