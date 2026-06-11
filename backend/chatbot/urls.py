from django.urls import path
from . import views

urlpatterns = [
    path('send/', views.SendMessageView.as_view(), name='send-message'),
    path('sessions/', views.ChatSessionListView.as_view(), name='chat-sessions'),
    path('sessions/<int:pk>/', views.ChatSessionDetailView.as_view(), name='chat-session-detail'),
]