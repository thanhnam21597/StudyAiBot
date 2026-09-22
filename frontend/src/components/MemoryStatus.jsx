import React from 'react';
import { Database, ShieldCheck, RefreshCw, Brain, AlertCircle, Wifi, WifiOff } from 'lucide-react';

export default function MemoryStatus({ memory, onRefresh, isSyncing }) {
  if (!memory) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-slate-400 text-sm flex items-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
        Connecting to Walrus Memory (MemWal)...
      </div>
    );
  }

  const memories = memory.memories || [];
  const memoryCount = memory.memory_count || memories.length;
  const isHealthy = memory.health !== false && memory.status !== 'error';
  const namespace = memory.namespace || `studymate:${memory.user_id}`;

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
              Walrus Memory
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                MemWal SDK
              </span>
            </h3>
            <p className="text-xs text-slate-400 truncate max-w-[200px]">
              Student: <span className="text-slate-200 font-mono">{memory.user_id}</span>
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

      {/* Connection & Namespace Status */}
      <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1">
            {isHealthy ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-rose-400" />
            )}
            Status:
          </span>
          <span className={`text-[11px] font-medium ${isHealthy ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isHealthy ? '● Connected' : '● Disconnected'}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            Namespace:
          </span>
          <span className="font-mono text-teal-300 truncate max-w-[160px] text-[11px]">
            {namespace}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1">
            <Brain className="w-3.5 h-3.5 text-violet-400" />
            Stored Memories:
          </span>
          <span className="text-slate-200 font-semibold text-[11px]">
            {memoryCount}
          </span>
        </div>
      </div>

      {/* Error display */}
      {memory.error && (
        <div className="bg-rose-950/30 border border-rose-500/20 rounded-lg p-2.5 text-xs text-rose-300 flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{memory.error}</span>
        </div>
      )}

      {/* Recalled Memories List */}
      <div>
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-2">
          <Brain className="w-3.5 h-3.5 text-violet-400" />
          Recalled Memories ({memories.length})
        </span>

        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
          {memories.length > 0 ? (
            memories.map((mem, idx) => (
              <div
                key={idx}
                className="bg-slate-800/50 border border-slate-700/40 rounded-lg px-3 py-2 text-xs text-slate-200 flex items-start gap-2 hover:border-violet-500/30 transition-colors"
              >
                <span className="text-violet-400 shrink-0 mt-0.5">•</span>
                <span className="flex-1 leading-relaxed">{mem.text || mem}</span>
                {mem.distance != null && (
                  <span className="text-[10px] text-slate-500 shrink-0 font-mono tabular-nums">
                    {mem.distance.toFixed(3)}
                  </span>
                )}
              </div>
            ))
          ) : (
            <div className="text-xs text-slate-500 italic px-2 py-3 text-center">
              No memories stored yet. Start chatting to build your learning profile!
            </div>
          )}
        </div>
      </div>

      {/* Footer info */}
      <div className="border-t border-slate-800 pt-2 text-[10px] text-slate-500 text-center">
        Powered by Walrus Protocol — Decentralized, Persistent, Verifiable Memory
      </div>
    </div>
  );
}
