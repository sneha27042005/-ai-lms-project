from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import LessonProgress, CourseProgress
from .serializers import LessonProgressSerializer, CourseProgressSerializer
from courses.models import Lesson, Course


class MarkLessonCompleteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, lesson_id):
        try:
            lesson = Lesson.objects.get(id=lesson_id)
        except Lesson.DoesNotExist:
            return Response({
                'error': 'Lesson not found'
            }, status=status.HTTP_404_NOT_FOUND)

        lesson_progress, created = LessonProgress.objects.get_or_create(
            student=request.user,
            lesson=lesson
        )

        if not lesson_progress.is_completed:
            lesson_progress.is_completed = True
            lesson_progress.completed_at = timezone.now()
            lesson_progress.save()

        # Update course progress
        course = lesson.course
        total_lessons = course.lessons.count()
        completed_lessons = LessonProgress.objects.filter(
            student=request.user,
            lesson__course=course,
            is_completed=True
        ).count()

        percentage = (completed_lessons / total_lessons * 100) if total_lessons > 0 else 0
        is_completed = percentage == 100

        course_progress, _ = CourseProgress.objects.get_or_create(
            student=request.user,
            course=course
        )
        course_progress.completed_lessons = completed_lessons
        course_progress.total_lessons = total_lessons
        course_progress.percentage = round(percentage, 2)
        course_progress.is_completed = is_completed
        course_progress.save()

        return Response({
            'message': 'Lesson marked as complete',
            'lesson_progress': LessonProgressSerializer(lesson_progress).data,
            'course_progress': CourseProgressSerializer(course_progress).data
        }, status=status.HTTP_200_OK)


class CourseProgressView(generics.ListAPIView):
    serializer_class = CourseProgressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CourseProgress.objects.filter(student=self.request.user)


class LessonProgressView(generics.ListAPIView):
    serializer_class = LessonProgressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return LessonProgress.objects.filter(student=self.request.user)


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from courses.models import Enrollment
        from quizzes.models import QuizAttempt

        enrollments = Enrollment.objects.filter(student=request.user).count()
        completed_courses = CourseProgress.objects.filter(
            student=request.user,
            is_completed=True
        ).count()
        quiz_attempts = QuizAttempt.objects.filter(student=request.user).count()
        passed_quizzes = QuizAttempt.objects.filter(
            student=request.user,
            is_passed=True
        ).count()

        recent_progress = CourseProgress.objects.filter(
            student=request.user
        ).order_by('-last_accessed')[:5]

        return Response({
            'stats': {
                'total_enrollments': enrollments,
                'completed_courses': completed_courses,
                'quiz_attempts': quiz_attempts,
                'passed_quizzes': passed_quizzes,
            },
            'recent_progress': CourseProgressSerializer(recent_progress, many=True).data
        })