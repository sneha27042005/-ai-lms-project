from django.urls import path
from . import views

urlpatterns = [
    path('', views.CourseListView.as_view(), name='course-list'),
    path('<int:pk>/', views.CourseDetailView.as_view(), name='course-detail'),
    path('categories/', views.CategoryListView.as_view(), name='category-list'),
    path('<int:course_id>/lessons/', views.LessonListView.as_view(), name='lesson-list'),
    path('<int:course_id>/lessons/<int:pk>/', views.LessonDetailView.as_view(), name='lesson-detail'),
    path('<int:course_id>/enroll/', views.EnrollView.as_view(), name='enroll'),
    path('my-courses/', views.MyCoursesView.as_view(), name='my-courses'),
]