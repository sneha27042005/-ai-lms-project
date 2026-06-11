from rest_framework import serializers
from .models import LessonProgress, CourseProgress


class LessonProgressSerializer(serializers.ModelSerializer):
    lesson_title = serializers.SerializerMethodField()

    class Meta:
        model = LessonProgress
        fields = ['id', 'student', 'lesson', 'lesson_title', 'is_completed', 'completed_at', 'created_at']
        read_only_fields = ['student', 'completed_at']

    def get_lesson_title(self, obj):
        return obj.lesson.title


class CourseProgressSerializer(serializers.ModelSerializer):
    course_title = serializers.SerializerMethodField()

    class Meta:
        model = CourseProgress
        fields = ['id', 'student', 'course', 'course_title', 'completed_lessons', 'total_lessons', 'percentage', 'is_completed', 'last_accessed']
        read_only_fields = ['student', 'completed_lessons', 'total_lessons', 'percentage', 'is_completed']

    def get_course_title(self, obj):
        return obj.course.title