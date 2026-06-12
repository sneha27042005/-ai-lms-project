import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendMessage } from '../services/api';

const Chatbot = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState(() => {
    const stored = localStorage.getItem('conversations');
    return stored ? JSON.parse(stored) : [];
  });
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);
  const editInputRef = useRef(null);
  const textareaRef = useRef(null);

  // ── Persist conversations ──────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('conversations', JSON.stringify(conversations));
  }, [conversations]);

  // ── Scroll to bottom ───────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // ── Focus edit input ───────────────────────────────────────────────────────
  useEffect(() => {
    if (editingId) editInputRef.current?.focus();
  }, [editingId]);

  // ── Auto-resize textarea ───────────────────────────────────────────────────
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  // ── Load active conversation messages ──────────────────────────────────────
  useEffect(() => {
    if (activeId) {
      const conv = conversations.find((c) => c.id === activeId);
      if (conv) setMessages(conv.messages);
    } else {
      setMessages([]);
    }
  }, [activeId]);

  // ── Save messages to active conversation ───────────────────────────────────
  const saveMessages = (id, newMessages) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, messages: newMessages, updatedAt: Date.now() } : c
      )
    );
  };

  // ── Create new conversation ────────────────────────────────────────────────
  const newConversation = () => {
    setActiveId(null);
    setMessages([]);
    setSessionId(null);
    setInput('');
  };

  // ── Delete conversation ────────────────────────────────────────────────────
  const deleteConversation = (id, e) => {
    e.stopPropagation();
    const updated = conversations.filter((c) => c.id !== id);
    setConversations(updated);
    if (activeId === id) {
      setActiveId(null);
      setMessages([]);
    }
  };

  // ── Rename conversation ────────────────────────────────────────────────────
  const startEditing = (id, name, e) => {
    e.stopPropagation();
    setEditingId(id);
    setEditingName(name);
  };

  const saveEditing = () => {
    if (editingName.trim()) {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === editingId ? { ...c, name: editingName.trim() } : c
        )
      );
    }
    setEditingId(null);
    setEditingName('');
  };

  // ── Group conversations by date ────────────────────────────────────────────
  const groupConversations = () => {
    const now = Date.now();
    const day = 86400000;
    const groups = { Today: [], Yesterday: [], 'Past 7 Days': [], Older: [] };

    conversations.forEach((c) => {
      const diff = now - c.updatedAt;
      if (diff < day) groups['Today'].push(c);
      else if (diff < 2 * day) groups['Yesterday'].push(c);
      else if (diff < 7 * day) groups['Past 7 Days'].push(c);
      else groups['Older'].push(c);
    });

    return groups;
  };

  // ── Send message ───────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');

    let currentId = activeId;
    let currentMessages = [...messages];
    let isNew = false;

    // Create new conversation if none active
    if (!currentId) {
      const id = Date.now().toString();
      const name =
        userText.length > 35 ? userText.slice(0, 35) + '...' : userText;
      const newConv = {
        id,
        name,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setConversations((prev) => [newConv, ...prev]);
      setActiveId(id);
      currentId = id;
      currentMessages = [];
      isNew = true;
    }

    const updated = [...currentMessages, { role: 'user', content: userText }];
    setMessages(updated);
    if (!isNew) saveMessages(currentId, updated);
    setLoading(true);

    try {
      const res = await sendMessage(userText, sessionId);
      setSessionId(res.data.session_id);
      const withReply = [
        ...updated,
        { role: 'assistant', content: res.data.message },
      ];
      setMessages(withReply);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === currentId
            ? { ...c, messages: withReply, updatedAt: Date.now() }
            : c
        )
      );
    } catch (error) {
      const errorMsg =
        error.response?.data?.error ||
        'Something went wrong. Please try again.';
      const withError = [
        ...updated,
        { role: 'assistant', content: errorMsg },
      ];
      setMessages(withError);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === currentId
            ? { ...c, messages: withError, updatedAt: Date.now() }
            : c
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const grouped = groupConversations();

  return (
    <div className="flex h-screen bg-white overflow-hidden">

      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } transition-all duration-300 bg-[#171717] flex flex-col overflow-hidden shrink-0`}
      >
        {/* Top */}
        <div className="p-3 flex flex-col gap-1">
          {/* New Chat */}
          <button
            onClick={newConversation}
            className="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-white/10 text-white text-sm transition group"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              AI Tutor
            </span>
            <svg className="w-4 h-4 opacity-60 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
          {conversations.length === 0 ? (
            <p className="text-center text-white/30 text-xs mt-8 px-4">
              No conversations yet
            </p>
          ) : (
            Object.entries(grouped).map(([label, items]) =>
              items.length > 0 ? (
                <div key={label}>
                  <p className="text-white/40 text-xs font-medium px-3 py-2 uppercase tracking-wider">
                    {label}
                  </p>
                  {items.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => {
                        setActiveId(conv.id);
                        setSessionId(null);
                      }}
                      className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition mb-0.5 ${
                        activeId === conv.id
                          ? 'bg-white/15 text-white'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {editingId === conv.id ? (
                        <input
                          ref={editInputRef}
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onBlur={saveEditing}
                          onKeyDown={(e) => e.key === 'Enter' && saveEditing()}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 bg-white/10 text-white text-sm px-2 py-0.5 rounded outline-none border border-white/30"
                        />
                      ) : (
                        <>
                          <span className="flex-1 text-sm truncate">{conv.name}</span>
                          <div className="hidden group-hover:flex items-center gap-1 shrink-0">
                            <button
                              onClick={(e) => startEditing(conv.id, conv.name, e)}
                              className="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white transition"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => deleteConversation(conv.id, e)}
                              className="p-1 rounded hover:bg-white/10 text-white/60 hover:text-red-400 transition"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : null
            )
          )}
        </div>

        {/* Back to Dashboard */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white text-sm transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* ── Main Area ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-semibold text-gray-800 text-sm">
            {activeId
              ? conversations.find((c) => c.id === activeId)?.name || 'Chat'
              : 'AI Tutor'}
          </span>
        </div>

        {/* Messages or Welcome Screen */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            // ── Welcome Screen ───────────────────────────────────────────────
            <div className="flex flex-col items-center justify-center h-full gap-6 px-4">
              <div className="text-center">
                <div className="text-5xl mb-4">🤖</div>
                <h1 className="text-2xl font-bold text-gray-800 mb-1">
                  How can I help you today?
                </h1>
                <p className="text-gray-400 text-sm">
                  Powered by Gemini AI • Ask me anything
                </p>
              </div>
              {/* Suggestions */}
              <div className="grid grid-cols-2 gap-3 max-w-lg w-full">
                {[
                  'Explain photosynthesis simply',
                  'Help me solve quadratic equations',
                  'Summarize World War II causes',
                  'What is machine learning?',
                ].map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="text-left px-4 py-3 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-sm text-gray-700 transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // ── Message List ─────────────────────────────────────────────────
            <div className="max-w-3xl mx-auto w-full px-4 py-6 space-y-6">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm shrink-0 mt-0.5">
                      🤖
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-gray-100 text-gray-800 rounded-br-sm'
                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm shrink-0 mt-0.5">
                      👤
                    </div>
                  )}
                </div>
              ))}

              {/* Typing Indicator */}
              {loading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm shrink-0">
                    🤖
                  </div>
                  <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm">
                    <div className="flex gap-1.5 items-center h-4">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="px-4 py-4 bg-white shrink-0">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-3 bg-white border border-gray-300 rounded-2xl px-4 py-3 shadow-sm focus-within:border-gray-400 transition">
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message AI Tutor..."
                disabled={loading}
                className="flex-1 resize-none bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none max-h-48"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition ${
                  input.trim() && !loading
                    ? 'bg-gray-800 hover:bg-gray-700 text-white'
                    : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <p className="text-center text-xs text-gray-400 mt-2">
              Press Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;