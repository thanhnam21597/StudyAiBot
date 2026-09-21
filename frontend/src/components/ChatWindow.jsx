import React, { useEffect, useRef, useState } from 'react';
import { Bot, User, Database, Undo2, AlertCircle, Trash2, X } from 'lucide-react';

export default function ChatWindow({
  messages,
  isLoading,
  onRecallMessage,
  onDeleteMessage,
  onClearHistory,
}) {
  const scrollRef = useRef(null);
  const [targetRecallMsg, setTargetRecallMsg] = useState(null);
  const [targetDeleteMsg, setTargetDeleteMsg] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Close modals on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setTargetRecallMsg(null);
        setTargetDeleteMsg(null);
        setShowClearConfirm(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const confirmRecall = () => {
    if (targetRecallMsg && onRecallMessage) {
      onRecallMessage(targetRecallMsg.id);
    }
    setTargetRecallMsg(null);
  };

  const confirmDelete = () => {
    if (targetDeleteMsg && onDeleteMessage) {
      onDeleteMessage(targetDeleteMsg.id);
    }
    setTargetDeleteMsg(null);
  };

  const confirmClear = () => {
    if (onClearHistory) {
      onClearHistory();
    }
    setShowClearConfirm(false);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
      {/* Top chat actions bar */}
      {messages.length > 0 && (
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 text-xs text-slate-400 shrink-0">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Cuộc trò chuyện trực tiếp ({messages.length} tin nhắn)</span>
          </span>
          <button
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all font-medium"
            title="Xóa toàn bộ lịch sử trò chuyện"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa lịch sử</span>
          </button>
        </div>
      )}

      {/* Messages container */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 p-2 pr-2 select-text"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
            <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-4">
              <Bot className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-slate-200 mb-1">
              Chào mừng bạn đến với StudyMate Bot!
            </h3>
            <p className="text-sm text-slate-400 max-w-md">
              Tất cả tiến độ học tập, bài tập đang làm dở và ghi chú đều được lưu trữ an toàn trên Walrus Memory. Bạn có thể gửi câu hỏi, thu hồi hoặc xóa tin nhắn bất kỳ lúc nào!
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isAssistant = msg.role === 'assistant';
            const isRecalled = Boolean(msg.is_recalled);
            const hasId = Boolean(msg.id);

            return (
              <div
                key={msg.id || index}
                className={`group flex gap-3 items-start relative ${
                  isAssistant ? 'justify-start' : 'justify-end'
                }`}
              >
                {/* Assistant Avatar */}
                {isAssistant && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-500 flex items-center justify-center text-white shrink-0 shadow-md mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                {/* Message Bubble + Action Wrapper */}
                <div
                  className={`relative flex items-center gap-1.5 max-w-[85%] sm:max-w-[78%] ${
                    isAssistant ? 'flex-row' : 'flex-row-reverse'
                  }`}
                >
                  {/* Bubble Container */}
                  <div
                    className={`rounded-2xl p-4 shadow-md transition-all duration-200 w-full ${
                      isRecalled
                        ? 'bg-slate-900/60 border border-dashed border-slate-700/70 text-slate-400'
                        : isAssistant
                        ? 'bg-slate-800/90 border border-slate-700/60 text-slate-100'
                        : 'bg-teal-600 text-white'
                    }`}
                  >
                    {/* Assistant header badges */}
                    {isAssistant && (
                      <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-700/40 text-[11px] text-teal-300">
                        <span className="font-semibold text-slate-200">StudyMate Bot</span>
                        <span className="flex items-center gap-1 bg-teal-950/60 px-1.5 py-0.5 rounded border border-teal-800/40 text-[10px]">
                          <Database className="w-2.5 h-2.5" /> Walrus Synced
                        </span>
                      </div>
                    )}

                    {/* Content area */}
                    {isRecalled ? (
                      <div className="flex items-center gap-2 text-sm italic text-slate-400 py-0.5">
                        <Undo2 className="w-4 h-4 text-slate-500 shrink-0" />
                        <span>Tin nhắn đã được thu hồi</span>
                      </div>
                    ) : (
                      <div className="text-sm whitespace-pre-wrap leading-relaxed">
                        {msg.content}
                      </div>
                    )}

                    {/* Timestamp and Recalled status badge */}
                    <div className="mt-2 flex items-center justify-end gap-2">
                      {isRecalled && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/50">
                          Đã thu hồi
                        </span>
                      )}
                      <span
                        className={`text-[10px] ${
                          isRecalled
                            ? 'text-slate-500'
                            : isAssistant
                            ? 'text-slate-400'
                            : 'text-teal-100'
                        }`}
                      >
                        {msg.timestamp
                          ? new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Vừa xong'}
                      </span>
                    </div>
                  </div>

                  {/* Hover Action Buttons */}
                  {hasId && (
                    <div
                      className="opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-1 shrink-0 bg-slate-900/90 p-1 rounded-xl border border-slate-700/80 shadow-lg"
                    >
                      {/* Nút Thu hồi (nếu chưa thu hồi) */}
                      {!isRecalled && (
                        <button
                          onClick={() => setTargetRecallMsg(msg)}
                          className="p-1 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-colors"
                          title="Thu hồi tin nhắn (rút lại nội dung)"
                          aria-label="Thu hồi tin nhắn"
                        >
                          <Undo2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Nút Xóa vĩnh viễn */}
                      <button
                        onClick={() => setTargetDeleteMsg(msg)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title="Xóa vĩnh viễn tin nhắn này"
                        aria-label="Xóa tin nhắn"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* User Avatar */}
                {!isAssistant && (
                  <div className="w-8 h-8 rounded-xl bg-slate-700 flex items-center justify-center text-slate-200 shrink-0 shadow-md mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Loading state indicator */}
        {isLoading && (
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-500 flex items-center justify-center text-white shrink-0 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-800/90 border border-slate-700/60 rounded-2xl px-4 py-3 text-sm text-slate-300 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="text-xs text-slate-400 ml-1">Đang suy nghĩ & truy vấn Walrus Memory...</span>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Message Recall (Fixed at screen center) */}
      {targetRecallMsg && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setTargetRecallMsg(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
        >
          <div className="bg-slate-900 border border-slate-700/90 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5 text-amber-400">
                <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <Undo2 className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-slate-100 text-sm">Thu hồi tin nhắn</h3>
              </div>
              <button
                onClick={() => setTargetRecallMsg(null)}
                className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300 my-4 leading-relaxed">
              Bạn có chắc chắn muốn <span className="text-amber-300 font-semibold">thu hồi tin nhắn này</span> không?
              Tin nhắn sẽ được rút lại, hiển thị thành trạng thái <i>"Tin nhắn đã được thu hồi"</i> và không còn được bot dùng làm ngữ cảnh học tập.
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setTargetRecallMsg(null)}
                className="px-4 py-2 text-xs rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors border border-slate-700"
              >
                Hủy
              </button>
              <button
                onClick={confirmRecall}
                className="px-4 py-2 text-xs rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium shadow-md transition-all cursor-pointer"
              >
                Xác nhận thu hồi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete Single Message (Fixed at screen center) */}
      {targetDeleteMsg && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setTargetDeleteMsg(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
        >
          <div className="bg-slate-900 border border-slate-700/90 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5 text-rose-400">
                <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
                  <Trash2 className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-slate-100 text-sm">Xóa vĩnh viễn tin nhắn</h3>
              </div>
              <button
                onClick={() => setTargetDeleteMsg(null)}
                className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300 my-4 leading-relaxed">
              Bạn có chắc muốn <span className="text-rose-300 font-semibold">xóa vĩnh viễn tin nhắn này</span> khỏi hệ thống không?
              Thao tác này sẽ xóa hoàn toàn tin nhắn khỏi cơ sở dữ liệu và giao diện.
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setTargetDeleteMsg(null)}
                className="px-4 py-2 text-xs rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors border border-slate-700"
              >
                Hủy
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-xs rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium shadow-md transition-all cursor-pointer"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Clear History (Fixed at screen center) */}
      {showClearConfirm && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowClearConfirm(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
        >
          <div className="bg-slate-900 border border-slate-700/90 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5 text-rose-400">
                <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-slate-100 text-sm">Xóa toàn bộ lịch sử chat</h3>
              </div>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300 my-4 leading-relaxed">
              Thao tác này sẽ <span className="text-rose-300 font-semibold">xóa toàn bộ tin nhắn</span> trong phiên học tập hiện tại của học viên.
              Toàn bộ lịch sử cuộc trò chuyện sẽ được làm mới. Bạn có chắc muốn tiếp tục không?
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-xs rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors border border-slate-700"
              >
                Hủy
              </button>
              <button
                onClick={confirmClear}
                className="px-4 py-2 text-xs rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium shadow-md transition-all cursor-pointer"
              >
                Xóa tất cả
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
