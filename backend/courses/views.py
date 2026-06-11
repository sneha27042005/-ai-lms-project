from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Category, Course, Lesson, Enrollment
from .serializers import CategorySerializer, CourseSerializer, LessonSerializer, EnrollmentSerializer


class CategoryListView(generics.ListCreateAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]


class CourseListView(generics.ListCreateAPIView):
    serializer_class = CourseSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = Course.objects.filter(is_published=True)
        category = self.request.query_params.get('category')
        level = self.request.query_params.get('level')
        if category:
            queryset = queryset.filter(category__name__icontains=category)
        if level:
            queryset = queryset.filter(level=level)
        return queryset

    def perform_create(self, serializer):
        serializer.save(instructor=self.request.user)


class CourseDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]


class LessonListView(generics.ListCreateAPIView):
    serializer_class = LessonSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        course_id = self.kwargs['course_id']
        return Lesson.objects.filter(course_id=course_id)

    def perform_create(self, serializer):
        course_id = self.kwargs['course_id']
        course = Course.objects.get(id=course_id)
        serializer.save(course=course)


class LessonDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = LessonSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        course_id = self.kwargs['course_id']
        return Lesson.objects.filter(course_id=course_id)


class EnrollView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, course_id):
        try:
            course = Course.objects.get(id=course_id)
            enrollment, created = Enrollment.objects.get_or_create(
                student=request.user,
                course=course
            )
            if created:
                return Response({
                    'message': f'Successfully enrolled in {course.title}'
                }, status=status.HTTP_201_CREATED)
            return Response({
                'message': 'Already enrolled in this course'
            }, status=status.HTTP_200_OK)
        except Course.DoesNotExist:
            return Response({
                'error': 'Course not found'
            }, status=status.HTTP_404_NOT_FOUND)


class MyCoursesView(generics.ListAPIView):
    serializer_class = EnrollmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Enrollment.objects.filter(student=self.request.user)