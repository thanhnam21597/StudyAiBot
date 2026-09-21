import React from 'react';
import { Database, ShieldCheck, RefreshCw, BookOpen, AlertCircle, Cpu } from 'lucide-react';

export default function MemoryStatus({ memory, onRefresh, isSyncing }) {
  if (!memory) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-slate-400 text-sm flex items-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
        Syncing Walrus Memory...
      </div>
    );
  }

  const knownTopics = memory.known_topics || [];
  const weakPoints = memory.weak_points || [];
  const inProgress = memory.in_progress_tasks || [];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
              Walrus Decentralized Memory
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                MemWal
              </span>
            </h3>
            <p className="text-xs text-slate-400 truncate max-w-[200px]">
              Student ID: <span className="text-slate-200 font-mono">{memory.user_id}</span>
            </p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={isSyncing}
          className="p-1.5 text-slate-400 hover:text-teal-300 hover:bg-slate-800 rounded-lg transition-colors"
          title="Refresh Walrus Memory"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-teal-400' : ''}`} />
        </button>
      </div>

      {/* Blob status */}
      <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            Blob ID:
          </span>
          <span className="font-mono text-teal-300 truncate max-w-[140px] text-[11px]">
            {memory.latest_blob_id || memory.blob_id || 'No Blob saved yet'}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            Status:
          </span>
          <span className="text-slate-300 text-[11px] capitalize">
            {memory.status || 'Active'}
          </span>
        </div>
      </div>

      {/* Current Goal */}
      <div>
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1">
          🎯 Current Goal
        </span>
        <p className="text-xs text-slate-200 bg-slate-800/50 rounded-lg p-2.5 border border-slate-700/50 leading-relaxed">
          {memory.current_goal || 'No goal set yet'}
        </p>
      </div>

      {/* Topics & Weak points */}
      <div className="space-y-3">
        <div>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" /> Mastered Concepts ({knownTopics.length})
          </span>
          <div className="flex flex-wrap gap-1.5">
            {knownTopics.length > 0 ? (
              knownTopics.map((topic, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded-md text-[11px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  {topic}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-500 italic">None recorded yet</span>
            )}
          </div>
        </div>

        <div>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" /> Areas for Improvement ({weakPoints.length})
          </span>
          <div className="flex flex-wrap gap-1.5">
            {weakPoints.length > 0 ? (
              weakPoints.map((pt, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded-md text-[11px] bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  {pt}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-500 italic">No weak points recorded</span>
            )}
          </div>
        </div>

        <div>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1.5">
            ⏳ Ongoing Tasks
          </span>
          <div className="space-y-1">
            {inProgress.length > 0 ? (
              inProgress.map((task, idx) => (
                <div key={idx} className="text-xs text-slate-300 bg-slate-800/40 px-2 py-1 rounded border border-slate-800 truncate">
                  • {task}
                </div>
              ))
            ) : (
              <span className="text-xs text-slate-500 italic">No in-progress tasks</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
