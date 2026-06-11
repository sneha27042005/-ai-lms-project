from rest_framework import serializers
from .models import Quiz, Question, QuizAttempt


class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ['id', 'text', 'option_a', 'option_b', 'option_c', 'option_d', 'order']


class QuestionAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ['id', 'text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_option', 'order']


class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    total_questions = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = ['id', 'course', 'lesson', 'title', 'description', 'passing_score', 'questions', 'total_questions', 'created_at']

    def get_total_questions(self, obj):
        return obj.questions.count()


class QuizAttemptSerializer(serializers.ModelSerializer):
    quiz_title = serializers.SerializerMethodField()

    class Meta:
        model = QuizAttempt
        fields = ['id', 'student', 'quiz', 'quiz_title', 'score', 'total_questions', 'percentage', 'is_passed', 'attempted_at']
        read_only_fields = ['student', 'score', 'total_questions', 'percentage', 'is_passed', 'attempted_at']

    def get_quiz_title(self, obj):
        return obj.quiz.title


class SubmitQuizSerializer(serializers.Serializer):
    answers = serializers.DictField(
        child=serializers.CharField(),
        help_text="Dictionary of question_id: selected_option"
    )