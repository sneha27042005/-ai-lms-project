from django.contrib import admin
from .models import LessonProgress, CourseProgress

admin.site.register(LessonProgress)
admin.site.register(CourseProgress)