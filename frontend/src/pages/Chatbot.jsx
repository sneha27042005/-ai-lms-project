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
  const [showBackModal, setShowBackModal] = useState(false);
  const messagesEndRef = useRef(null);
  const editInputRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('conversations', JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (editingId) editInputRef.current?.focus();
  }, [editingId]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  useEffect(() => {
    if (activeId) {
      const conv = conversations.find((c) => c.id === activeId);
      if (conv) setMessages(conv.messages);
    } else {
      setMessages([]);
    }
  }, [activeId]);

  const saveMessages = (id, newMessages) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, messages: newMessages, updatedAt: Date.now() } : c
      )
    );
  };

  const newConversation = () => {
    setActiveId(null);
    setMessages([]);
    setSessionId(null);
    setInput('');
  };

  const deleteConversation = (id, e) => {
    e.stopPropagation();
    const updated = conversations.filter((c) => c.id !== id);
    setConversations(updated);
    if (activeId === id) {
      setActiveId(null);
      setMessages([]);
    }
  };

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

  const groupConversations = () => {
    const now = Date.now();
    const day = 86400000;
    const groups = { Today: [], Yesterday: [], 'Past 7 Days': [], Older: [] };
    const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);

    sorted.forEach((c) => {
      const diff = now - c.updatedAt;
      if (diff < day) groups['Today'].push(c);
      else if (diff < 2 * day) groups['Yesterday'].push(c);
      else if (diff < 7 * day) groups['Past 7 Days'].push(c);
      else groups['Older'].push(c);
    });

    return groups;
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');

    let currentId = activeId;
    let currentMessages = [...messages];
    let isNew = false;

    if (!currentId) {
      const id = Date.now().toString();
      const name = userText.length > 35 ? userText.slice(0, 35) + '...' : userText;
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
      const withReply = [...updated, { role: 'assistant', content: res.data.message }];
      setMessages(withReply);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === currentId ? { ...c, messages: withReply, updatedAt: Date.now() } : c
        )
      );
    } catch (error) {
      const errorMsg =
        error.response?.data?.error || 'Something went wrong. Please try again.';
      const withError = [...updated, { role: 'assistant', content: errorMsg }];
      setMessages(withError);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === currentId ? { ...c, messages: withError, updatedAt: Date.now() } : c
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

  const handleBackClick = () => {
    if (messages.length > 0) {
      setShowBackModal(true);
    } else {
      navigate('/dashboard');
    }
  };

  const grouped = groupConversations();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <div
        className={`${
          sidebarOpen ? 'w-72' : 'w-0'
        } transition-all duration-300 bg-white border-r border-gray-200 flex flex-col overflow-hidden shrink-0`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-100">
          <button
            onClick={newConversation}
            className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium transition group"
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Chat
            </span>
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-300">
              <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p className="text-xs">No conversations yet</p>
            </div>
          ) : (
            Object.entries(grouped).map(([label, items]) =>
              items.length > 0 ? (
                <div key={label}>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-2">
                    {label}
                  </p>
                  {items.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => {
                        setActiveId(conv.id);
                        setSessionId(null);
                      }}
                      className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition mb-0.5 ${
                        activeId === conv.id
                          ? 'bg-blue-50 text-blue-700 border border-blue-100'
                          : 'text-gray-600 hover:bg-gray-50'
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
                          className="flex-1 bg-white text-gray-800 text-sm px-2 py-1 rounded-lg outline-none border border-blue-300 focus:ring-2 focus:ring-blue-100"
                        />
                      ) : (
                        <>
                          <svg className={`w-4 h-4 shrink-0 ${activeId === conv.id ? 'text-blue-400' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                          </svg>
                          <span className="flex-1 text-sm truncate">{conv.name}</span>
                          <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                            <button
                              onClick={(e) => startEditing(conv.id, conv.name, e)}
                              className="p-1 rounded-md hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => deleteConversation(conv.id, e)}
                              className="p-1 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500 transition"
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
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleBackClick}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white text-sm font-semibold transition shadow-md shadow-blue-200 hover:shadow-lg hover:shadow-blue-300 active:scale-[0.98]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* ── Main Chat Area ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">

        {/* Top Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
              <span className="text-white text-xs">AI</span>
            </div>
            <span className="font-semibold text-gray-800 text-sm">
              {activeId
                ? conversations.find((c) => c.id === activeId)?.name || 'Chat'
                : 'AI Tutor'}
            </span>
          </div>
        </div>

        {/* Messages / Welcome */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-8 px-4">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
                  <span className="text-white text-2xl">AI</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                  How can I help you today?
                </h1>
                <p className="text-gray-400 text-sm">
                  Your AI tutor is ready to help you learn
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 max-w-lg w-full">
                {[
                  { icon: '🧪', text: 'Explain photosynthesis simply' },
                  { icon: '📐', text: 'Help me solve quadratic equations' },
                  { icon: '🌍', text: 'Summarize World War II causes' },
                  { icon: '🤖', text: 'What is machine learning?' },
                ].map((s) => (
                  <button
                    key={s.text}
                    onClick={() => setInput(s.text)}
                    className="text-left px-4 py-3.5 rounded-2xl border border-gray-200 hover:border-blue-200 hover:bg-blue-50/50 text-sm text-gray-600 transition group"
                  >
                    <span className="text-lg block mb-1">{s.icon}</span>
                    <span className="group-hover:text-blue-700 transition">{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto w-full px-4 py-6 space-y-5">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5 shadow-sm">
                      AI
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-blue-500 text-white rounded-2xl rounded-br-md shadow-sm'
                        : 'bg-gray-50 text-gray-800 rounded-2xl rounded-bl-md border border-gray-100'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-bold shrink-0 mt-0.5">
                      U
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-sm">
                    AI
                  </div>
                  <div className="bg-gray-50 border border-gray-100 px-5 py-4 rounded-2xl rounded-bl-md">
                    <div className="flex gap-1.5 items-center">
                      <span className="w-2 h-2 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="px-4 py-4 bg-white shrink-0 border-t border-gray-100">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 transition shadow-sm">
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
                className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition ${
                  input.trim() && !loading
                    ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm shadow-blue-200'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <p className="text-center text-[11px] text-gray-300 mt-2">
              Press Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>

      {/* ── Back to Dashboard Modal ──────────────────────────────────────────── */}
      {showBackModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 animate-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Leave this chat?</h3>
                <p className="text-sm text-gray-400">Your chat is automatically saved</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              You&apos;re about to go back to the dashboard. Your conversation history will be preserved and you can continue anytime.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBackModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50 transition"
              >
                Stay Here
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium text-sm hover:from-blue-600 hover:to-indigo-600 transition shadow-md shadow-blue-200"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;