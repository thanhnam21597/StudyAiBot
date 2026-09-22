import React, { useState, useEffect } from 'react';
import { chatApi, memoryApi } from './services/api';
import ChatWindow from './components/ChatWindow';
import MessageInput from './components/MessageInput';
import MemoryStatus from './components/MemoryStatus';
import { GraduationCap, UserCheck, CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function App() {
  const [userId, setUserId] = useState('student_01');
  const [messages, setMessages] = useState([]);
  const [memory, setMemory] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev && prev.message === message ? null : prev));
    }, 3500);
  };

  // Load chat history & memory on user change
  useEffect(() => {
    loadUserContext(userId);
  }, [userId]);

  const loadUserContext = async (targetUser) => {
    setIsSyncing(true);
    try {
      // 1. Fetch Walrus Memory
      const memData = await memoryApi.getMemoryStatus(targetUser);
      setMemory(memData);

      // 2. Fetch Chat History
      const histData = await chatApi.getHistory(targetUser);
      if (histData && histData.messages) {
        setMessages(histData.messages);
      }
    } catch (err) {
      console.warn('Error fetching user context:', err);
      // Fallback state if backend is booting up
      setMemory({
        user_id: targetUser,
        status: "offline_ready",
        current_goal: "Connecting to Django backend & Walrus Protocol...",
        known_topics: ["Python Fundamentals", "Data Structures"],
        weak_points: ["Dijkstra Algorithm", "Dynamic Programming"],
        in_progress_tasks: ["Shortest path graph problem"],
        latest_blob_id: "walrus-blob-demo-init"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

    const tempId = `temp-${Date.now()}`;
    // Optimistically append user message
    const userMsg = {
      id: tempId,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
      is_recalled: false,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await chatApi.sendMessage(userId, text);
      
      // Update messages list with real IDs from backend
      setMessages((prev) => {
        const next = prev.map((m) => {
          if (m.id === tempId && response.user_message) {
            return response.user_message;
          }
          return m;
        });

        if (response.assistant_message) {
          next.push(response.assistant_message);
        } else {
          next.push({
            id: `bot-${Date.now()}`,
            role: 'assistant',
            content: response.reply,
            timestamp: new Date().toISOString(),
            is_recalled: false,
          });
        }
        return next;
      });

      // Refresh memory panel after new facts stored
      if (response.recalled_facts || response.new_facts_stored) {
        try {
          const memData = await memoryApi.getMemoryStatus(userId);
          setMemory(memData);
        } catch (e) {
          console.warn('Memory refresh after chat failed:', e);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMsg = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content:
          '⚠️ Error connecting to StudyMate backend. Please verify that the Django server is running on port 8000.',
        timestamp: new Date().toISOString(),
        is_recalled: false,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsendMessage = async (messageId) => {
    try {
      await chatApi.unsendMessage(messageId, userId);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                is_recalled: true,
                content: 'Tin nhắn đã được rút lại',
                recalled_at: new Date().toISOString(),
              }
            : msg
        )
      );
      showToast('Tin nhắn đã được rút lại thành công.', 'success');
    } catch (err) {
      console.error('Error unsending message:', err);
      showToast('Không thể rút lại tin nhắn. Vui lòng thử lại.', 'error');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await chatApi.deleteMessage(messageId, userId);
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      showToast('Đã xóa tin nhắn thành công.', 'success');
    } catch (err) {
      console.error('Error deleting message:', err);
      showToast('Không thể xóa tin nhắn. Vui lòng thử lại.', 'error');
    }
  };

  const handleClearHistory = async () => {
    try {
      await chatApi.clearHistory(userId);
      setMessages([]);
      showToast('Đã xóa toàn bộ lịch sử trò chuyện.', 'success');
    } catch (err) {
      console.error('Error clearing history:', err);
      showToast('Không thể xóa lịch sử chat.', 'error');
    }
  };

  const handleRefreshMemory = () => {
    loadUserContext(userId);
  };

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl border shadow-xl backdrop-blur-md text-xs font-medium animate-in slide-in-from-top-3 duration-200 bg-slate-900/95 border-slate-700">
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
          <span className={toast.type === 'error' ? 'text-rose-200' : 'text-slate-200'}>
            {toast.message}
          </span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-slate-400 hover:text-slate-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md shrink-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                StudyMate Bot
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/30">
                  v1.0 (Walrus Memory)
                </span>
              </h1>
              <p className="text-xs text-slate-400">Intelligent Study Assistant & Decentralized Storage</p>
            </div>
          </div>

          {/* Student Selector */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/70 text-xs">
              <UserCheck className="w-4 h-4 text-teal-400" />
              <span className="text-slate-400">Student:</span>
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
              >
                <option value="student_01" className="bg-slate-800 text-slate-200">Student 01 (student_01)</option>
                <option value="student_02" className="bg-slate-800 text-slate-200">Student 02 (student_02)</option>
                <option value="student_vip" className="bg-slate-800 text-slate-200">VIP Student (student_vip)</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="flex-1 min-h-0 max-w-7xl w-full mx-auto p-4 flex flex-col md:flex-row gap-4 overflow-hidden">
        {/* Left Side: Walrus Memory Panel */}
        <aside className="w-full md:w-80 lg:w-96 shrink-0 flex flex-col overflow-y-auto">
          <MemoryStatus
            memory={memory}
            onRefresh={handleRefreshMemory}
            isSyncing={isSyncing}
          />
        </aside>

        {/* Right Side: Chat Area */}
        <section className="flex-1 min-h-0 flex flex-col bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md overflow-hidden">
          <ChatWindow
            messages={messages}
            isLoading={isLoading}
            onUnsendMessage={handleUnsendMessage}
            onDeleteMessage={handleDeleteMessage}
            onClearHistory={handleClearHistory}
          />
          <div className="pt-3 border-t border-slate-800/80 shrink-0">
            <MessageInput onSendMessage={handleSendMessage} disabled={isLoading} />
          </div>
        </section>
      </main>
    </div>
  );
}
