import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendMessage } from '../services/api';

const Chatbot = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I'm your AI Tutor. How can I help you learn today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [savedChats, setSavedChats] = useState([]);
  const [currentChatName, setCurrentChatName] = useState('New Chat');
  const [editingName, setEditingName] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState('');
  const messagesEndRef = useRef(null);
  const nameInputRef = useRef(null);

  // ─── Load saved chats from localStorage on mount ───────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem('chatHistory');
    if (stored) {
      setSavedChats(JSON.parse(stored));
    }
  }, []);

  // ─── Auto-scroll to bottom ─────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── Focus name input when editing ────────────────────────────────────────
  useEffect(() => {
    if (editingName) nameInputRef.current?.focus();
  }, [editingName]);

  // ─── Show temporary notification ──────────────────────────────────────────
  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  // ─── Save current chat to localStorage ────────────────────────────────────
  const saveCurrentChat = () => {
    if (messages.length <= 1) {
      showNotification('⚠️ No conversation to save yet!');
      return;
    }

    const newChat = {
      id: sessionId || Date.now().toString(),
      name: currentChatName,
      messages,
      savedAt: new Date().toISOString(),
      messageCount: messages.length,
    };

    const updated = savedChats.filter((c) => c.id !== newChat.id);
    const newList = [newChat, ...updated];

    setSavedChats(newList);
    localStorage.setItem('chatHistory', JSON.stringify(newList));
    showNotification('✅ Chat saved successfully!');
  };

  // ─── Load a saved chat ─────────────────────────────────────────────────────
  const loadChat = (chat) => {
    setMessages(chat.messages);
    setCurrentChatName(chat.name);
    setSessionId(chat.id);
    setShowHistory(false);
    showNotification(`📂 Loaded: "${chat.name}"`);
  };

  // ─── Delete a saved chat ───────────────────────────────────────────────────
  const deleteChat = (chatId, e) => {
    e.stopPropagation();
    const updated = savedChats.filter((c) => c.id !== chatId);
    setSavedChats(updated);
    localStorage.setItem('chatHistory', JSON.stringify(updated));
    showNotification('🗑️ Chat deleted!');
  };

  // ─── Start a brand new chat ────────────────────────────────────────────────
  const startNewChat = () => {
    setMessages([
      { role: 'assistant', content: "Hello! I'm your AI Tutor. How can I help you learn today?" },
    ]);
    setInput('');
    setSessionId(null);
    setCurrentChatName('New Chat');
    setShowHistory(false);
    showNotification('🆕 New chat started!');
  };

  // ─── Clear all history ─────────────────────────────────────────────────────
  const clearAllHistory = () => {
    if (window.confirm('Are you sure you want to delete ALL saved chats?')) {
      setSavedChats([]);
      localStorage.removeItem('chatHistory');
      showNotification('🗑️ All history cleared!');
    }
  };

  // ─── Export chat as .txt file ──────────────────────────────────────────────
  const exportChat = (chat, e) => {
    e.stopPropagation();
    const content = chat.messages
      .map((m) => `[${m.role.toUpperCase()}]: ${m.content}`)
      .join('\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${chat.name}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('📥 Chat exported!');
  };

  // ─── Export current chat ───────────────────────────────────────────────────
  const exportCurrentChat = () => {
    if (messages.length <= 1) {
      showNotification('⚠️ No conversation to export yet!');
      return;
    }
    const content = messages
      .map((m) => `[${m.role.toUpperCase()}]: ${m.content}`)
      .join('\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentChatName}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('📥 Chat exported!');
  };

  // ─── Filter chats by search ────────────────────────────────────────────────
  const filteredChats = savedChats.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.messages.some((m) =>
        m.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  // ─── Format date ───────────────────────────────────────────────────────────
  const formatDate = (iso) => {
    const date = new Date(iso);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ─── Send message ──────────────────────────────────────────────────────────
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setLoading(true);

    // Auto-name the chat after first user message
    if (messages.length === 1 && currentChatName === 'New Chat') {
      setCurrentChatName(
        userMessage.length > 30 ? userMessage.slice(0, 30) + '...' : userMessage
      );
    }

    try {
      const res = await sendMessage(userMessage, sessionId);
      setSessionId(res.data.session_id);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: res.data.message },
      ]);
    } catch (error) {
      const errorMsg =
        error.response?.data?.error ||
        'Sorry, I had trouble responding. Please try again.';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: errorMsg },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* ── Notification Toast ──────────────────────────────────────────────── */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-gray-800 text-white px-5 py-3 rounded-xl shadow-lg animate-fade-in">
          {notification}
        </div>
      )}

      <div className="container mx-auto px-6 max-w-5xl">
        <div className="flex gap-4">

          {/* ── Sidebar: Chat History ────────────────────────────────────────── */}
          {showHistory && (
            <div className="w-72 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
              {/* Sidebar Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
                <h2 className="font-bold text-lg">📚 Chat History</h2>
                <p className="text-blue-100 text-xs">{savedChats.length} saved chats</p>
              </div>

              {/* Search */}
              <div className="p-3 border-b">
                <input
                  type="text"
                  placeholder="🔍 Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400"
                />
              </div>

              {/* New Chat Button */}
              <div className="p-3 border-b">
                <button
                  onClick={startNewChat}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition"
                >
                  + New Chat
                </button>
              </div>

              {/* Chat List */}
              <div className="flex-1 overflow-y-auto">
                {filteredChats.length === 0 ? (
                  <div className="p-6 text-center text-gray-400">
                    <div className="text-4xl mb-2">💬</div>
                    <p className="text-sm">
                      {searchQuery ? 'No chats found' : 'No saved chats yet'}
                    </p>
                  </div>
                ) : (
                  filteredChats.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => loadChat(chat)}
                      className="p-3 border-b hover:bg-blue-50 cursor-pointer transition group"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-800 truncate">
                            {chat.name}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            🕒 {formatDate(chat.savedAt)}
                          </p>
                          <p className="text-xs text-gray-400">
                            💬 {chat.messageCount} messages
                          </p>
                          {/* Last message preview */}
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            {chat.messages[chat.messages.length - 1]?.content}
                          </p>
                        </div>
                        {/* Action Buttons */}
                        <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition">
                          <button
                            onClick={(e) => exportChat(chat, e)}
                            title="Export"
                            className="text-blue-500 hover:text-blue-700 text-xs p-1"
                          >
                            📥
                          </button>
                          <button
                            onClick={(e) => deleteChat(chat.id, e)}
                            title="Delete"
                            className="text-red-400 hover:text-red-600 text-xs p-1"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Clear All */}
              {savedChats.length > 0 && (
                <div className="p-3 border-t">
                  <button
                    onClick={clearAllHistory}
                    className="w-full text-red-500 hover:text-red-700 text-xs py-2 border border-red-200 rounded-lg hover:bg-red-50 transition"
                  >
                    🗑️ Clear All History
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Main Chat Window ──────────────────────────────────────────────── */}
          <div className="flex-1 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🤖</span>
                  <div>
                    {/* Editable Chat Name */}
                    {editingName ? (
                      <input
                        ref={nameInputRef}
                        type="text"
                        value={currentChatName}
                        onChange={(e) => setCurrentChatName(e.target.value)}
                        onBlur={() => setEditingName(false)}
                        onKeyDown={(e) => e.key === 'Enter' && setEditingName(false)}
                        className="bg-white/20 text-white font-bold text-lg px-2 py-0.5 rounded outline-none border border-white/50 w-48"
                      />
                    ) : (
                      <h1
                        onClick={() => setEditingName(true)}
                        title="Click to rename"
                        className="text-lg font-bold cursor-pointer hover:bg-white/10 px-1 rounded flex items-center gap-1"
                      >
                        {currentChatName} <span className="text-sm">✏️</span>
                      </h1>
                    )}
                    <p className="text-blue-100 text-xs">Powered by Gemini AI</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition flex items-center gap-1"
                  >
                    📚 {showHistory ? 'Hide' : 'History'}
                    {savedChats.length > 0 && (
                      <span className="bg-white text-purple-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
                        {savedChats.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={saveCurrentChat}
                    className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition"
                  >
                    💾 Save
                  </button>
                  <button
                    onClick={exportCurrentChat}
                    className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition"
                  >
                    📥 Export
                  </button>
                  <button
                    onClick={startNewChat}
                    className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition"
                  >
                    🆕
                  </button>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition"
                  >
                    ← Back
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 h-[500px] overflow-y-auto p-6 space-y-4 bg-gray-50">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] p-4 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                        : 'bg-white text-gray-800 shadow'
                    }`}
                  >
                    <div className="text-sm font-semibold mb-1">
                      {msg.role === 'user' ? '👤 You' : '🤖 AI Tutor'}
                    </div>
                    <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white p-4 rounded-2xl shadow">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 border-t bg-white flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything about your courses..."
                disabled={loading}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition"
              >
                Send 🚀
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;