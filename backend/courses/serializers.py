from rest_framework import serializers
from .models import Category, Course, Lesson, Enrollment

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'created_at']


class LessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = ['id', 'title', 'content', 'video_url', 'order', 'duration', 'created_at']


class CourseSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, read_only=True)
    instructor_name = serializers.SerializerMethodField()
    category_name = serializers.SerializerMethodField()
    total_lessons = serializers.SerializerMethodField()
    total_students = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'description', 'instructor',
            'instructor_name', 'category', 'category_name',
            'thumbnail', 'level', 'is_published', 'lessons',
            'total_lessons', 'total_students', 'created_at'
        ]
        read_only_fields = ['instructor']

    def get_instructor_name(self, obj):
        return obj.instructor.username

    def get_category_name(self, obj):
        return obj.category.name if obj.category else None

    def get_total_lessons(self, obj):
        return obj.lessons.count()

    def get_total_students(self, obj):
        return obj.enrollments.count()


class EnrollmentSerializer(serializers.ModelSerializer):
    course_title = serializers.SerializerMethodField()

    class Meta:
        model = Enrollment
        fields = ['id', 'student', 'course', 'course_title', 'enrolled_at', 'is_completed']
        read_only_fields = ['student', 'enrolled_at']

    def get_course_title(self, obj):
        return obj.course.title