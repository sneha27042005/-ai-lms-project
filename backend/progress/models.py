from django.db import models
from django.conf import settings
from courses.models import Course, Lesson


class LessonProgress(models.Model):
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='lesson_progress')
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='progress')
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student.email} - {self.lesson.title}"

    class Meta:
        unique_together = ['student', 'lesson']


class CourseProgress(models.Model):
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='course_progress')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='progress')
    completed_lessons = models.IntegerField(default=0)
    total_lessons = models.IntegerField(default=0)
    percentage = models.FloatField(default=0)
    is_completed = models.BooleanField(default=False)
    last_accessed = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.student.email} - {self.course.title} - {self.percentage}%"

    class Meta:
        unique_together = ['student', 'course']