from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Quiz, Question, QuizAttempt
from .serializers import (
    QuizSerializer, QuestionSerializer,
    QuizAttemptSerializer, SubmitQuizSerializer
)


class QuizListView(generics.ListCreateAPIView):
    serializer_class = QuizSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        course_id = self.kwargs.get('course_id')
        if course_id:
            return Quiz.objects.filter(course_id=course_id)
        return Quiz.objects.all()


class QuizDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]


class QuestionListView(generics.ListCreateAPIView):
    serializer_class = QuestionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        quiz_id = self.kwargs['quiz_id']
        return Question.objects.filter(quiz_id=quiz_id)

    def perform_create(self, serializer):
        quiz_id = self.kwargs['quiz_id']
        quiz = Quiz.objects.get(id=quiz_id)
        serializer.save(quiz=quiz)


class SubmitQuizView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, quiz_id):
        try:
            quiz = Quiz.objects.get(id=quiz_id)
        except Quiz.DoesNotExist:
            return Response({
                'error': 'Quiz not found'
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = SubmitQuizSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        answers = serializer.validated_data['answers']
        questions = quiz.questions.all()
        total_questions = questions.count()
        score = 0

        results = []
        for question in questions:
            selected = answers.get(str(question.id), '').upper()
            is_correct = selected == question.correct_option
            if is_correct:
                score += 1
            results.append({
                'question_id': question.id,
                'question': question.text,
                'selected': selected,
                'correct': question.correct_option,
                'is_correct': is_correct
            })

        percentage = (score / total_questions * 100) if total_questions > 0 else 0
        is_passed = percentage >= quiz.passing_score

        attempt = QuizAttempt.objects.create(
            student=request.user,
            quiz=quiz,
            score=score,
            total_questions=total_questions,
            percentage=percentage,
            is_passed=is_passed
        )

        return Response({
            'message': 'Quiz submitted successfully',
            'score': score,
            'total_questions': total_questions,
            'percentage': round(percentage, 2),
            'is_passed': is_passed,
            'passing_score': quiz.passing_score,
            'results': results
        }, status=status.HTTP_200_OK)


class MyAttemptsView(generics.ListAPIView):
    serializer_class = QuizAttemptSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return QuizAttempt.objects.filter(student=self.request.user)