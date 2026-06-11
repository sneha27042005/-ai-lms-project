import google.generativeai as genai
from django.conf import settings
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import ChatSession, ChatMessage
from .serializers import ChatSessionSerializer, ChatMessageSerializer, SendMessageSerializer

genai.configure(api_key=settings.GEMINI_API_KEY)

class SendMessageView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SendMessageSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user_message = serializer.validated_data['message']
        session_id = serializer.validated_data.get('session_id')

        if session_id:
            try:
                session = ChatSession.objects.get(id=session_id, user=request.user)
            except ChatSession.DoesNotExist:
                return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)
        else:
            session = ChatSession.objects.create(
                user=request.user,
                title=user_message[:50]
            )

        ChatMessage.objects.create(
            session=session,
            role='user',
            content=user_message
        )

        history = ChatMessage.objects.filter(session=session).order_by('created_at')
        
        context = """You are an AI tutor for an online learning platform. 
        Help students understand concepts, answer questions about their courses, 
        and provide learning guidance. Be friendly, clear and educational."""

        conversation = context + "\n\n"
        for msg in history:
            if msg.role == 'user':
                conversation += f"Student: {msg.content}\n"
            else:
                conversation += f"Tutor: {msg.content}\n"

        try:
            model = genai.GenerativeModel('models/gemini-2.5-flash')
            response = model.generate_content(conversation)
            ai_response = response.text

            ChatMessage.objects.create(
                session=session,
                role='assistant',
                content=ai_response
            )

            return Response({
                'session_id': session.id,
                'message': ai_response,
                'session_title': session.title
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': f'AI service error: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ChatSessionListView(generics.ListAPIView):
    serializer_class = ChatSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ChatSession.objects.filter(user=self.request.user).order_by('-updated_at')


class ChatSessionDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = ChatSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ChatSession.objects.filter(user=self.request.user)