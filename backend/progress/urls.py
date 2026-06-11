from django.urls import path
from . import views

urlpatterns = [
    path('lessons/<int:lesson_id>/complete/', views.MarkLessonCompleteView.as_view(), name='mark-complete'),
    path('courses/', views.CourseProgressView.as_view(), name='course-progress'),
    path('lessons/', views.LessonProgressView.as_view(), name='lesson-progress'),
    path('dashboard/', views.DashboardView.as_view(), name='dashboard'),
]