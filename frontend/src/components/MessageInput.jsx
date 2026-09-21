import React, { useState } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';

export default function MessageInput({ onSendMessage, disabled }) {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const quickPrompts = [
    "Explain Dijkstra's Algorithm in Python",
    "Check for bugs in my recursive function",
    "What is my current study progress in Walrus Memory?",
  ];

  return (
    <div className="space-y-3">
      {/* Quick suggestions */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-[11px] text-slate-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" /> Suggestions:
        </span>
        {quickPrompts.map((prompt, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSendMessage(prompt)}
            disabled={disabled}
            className="text-xs bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white px-2.5 py-1 rounded-full border border-slate-700 transition duration-150 disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask StudyMate Bot about concepts, debug code, or resume your project..."
          disabled={disabled}
          className="w-full bg-slate-900 border border-slate-700/80 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 rounded-2xl py-3.5 pl-4 pr-14 text-sm text-slate-100 placeholder-slate-400 resize-none outline-none transition-all shadow-inner"
        />

        <button
          type="submit"
          disabled={!input.trim() || disabled}
          className="absolute right-2.5 p-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed shadow-md transition-transform active:scale-95"
        >
          {disabled ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>
    </div>
  );
}
