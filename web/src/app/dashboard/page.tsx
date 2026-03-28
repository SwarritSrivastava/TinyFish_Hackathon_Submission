"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Loader2, Download, Terminal, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Mode = 'E2E' | 'DISCOVERY' | 'EVALUATE';

export default function Home() {
  const [mode, setMode] = useState<Mode>('E2E');
  const [query, setQuery] = useState("San Francisco AI Engineers");
  const [limit, setLimit] = useState<number | string>(3);
  const [urlsText, setUrlsText] = useState("https://brittanychiang.com\nhttps://leerob.io\nhttps://brianlovin.com");
  
  const [status, setStatus] = useState("IDLE"); // IDLE, RUNNING, COMPLETE, ERROR
  const [logs, setLogs] = useState<string[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [streamingUrl, setStreamingUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ current: number, total: number, etaSeconds: number } | null>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handleRun = async (e: any) => {
    e.preventDefault();
    setStatus("RUNNING");
    setLogs([`Initializing Platform in ${mode} mode...`]);
    setResults([]);
    setStreamingUrl(null);
    setProgress(null);

    try {
      let bodyData: any = { mode };
      if (mode !== 'EVALUATE') {
         bodyData.query = query;
         bodyData.limit = typeof limit === "string" ? parseInt(limit) || 3 : limit;
      }
      if (mode === 'EVALUATE') {
         bodyData.urls = urlsText.split('\n').map(l => l.trim()).filter(l => l.startsWith('http'));
      }

      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData)
      });

      if (!response.body) throw new Error("No readable stream");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6);
            if (!dataStr) continue;
            try {
              const event = JSON.parse(dataStr);
              if (event.type === "PROGRESS") {
                 setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${event.purpose}`]);
              } else if (event.type === "STREAMING_URL") {
                 setStreamingUrl(event.streaming_url);
                 setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Active Headless Browser Connection Established...`]);
              } else if (event.type === "META") {
                 setProgress({ current: event.current, total: event.total, etaSeconds: event.etaSeconds });
              } else if (event.type === "ERROR") {
                 setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ERROR: ${event.message}`]);
                 setStatus("ERROR");
                 return;
              } else if (event.type === "COMPLETE") {
                 const rawData = event.result;
                 let parsed: any[] = [];
                 if (Array.isArray(rawData)) parsed = rawData;
                 else if (typeof rawData === "object" && rawData) {
                    const keys = Object.keys(rawData);
                    for (const k of keys) {
                       if (Array.isArray(rawData[k])) {
                          parsed = rawData[k];
                          break;
                       }
                    }
                    if (parsed.length === 0) parsed = [rawData];
                 } else {
                    parsed = [rawData];
                 }
                 setResults(parsed);
                 setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Mission complete! Download your CSV matrix below.`]);
                 setStatus("COMPLETE");
              }
            } catch (e) {
              console.error("Parse error:", e, dataStr);
            }
          }
        }
      }
    } catch (err: any) {
      setLogs(prev => [...prev, `[ERROR] ${err.message}`]);
      setStatus("ERROR");
    }
  };

  const handleDownload = () => {
    if (results.length === 0) return;
    const header = Object.keys(results[0]).join(",");
    const rows = results.map(obj => Object.values(obj).map(v => {
      if (Array.isArray(v)) {
        return `"${v.map(item => String(item).replace(/"/g, '""')).join(", ")}"`;
      } else if (typeof v === "object" && v !== null) {
        return `"${JSON.stringify(v).replace(/"/g, '""')}"`;
      }
      return `"${String(v || "").replace(/"/g, '""')}"`;
    }).join(","));
    const csvStr = [header, ...rows].join("\n");
    const blob = new Blob([csvStr], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = mode === 'DISCOVERY' ? 'discovered_portfolios.csv' : 'evaluated_candidates.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-white selection:bg-purple-500/30 font-sans pb-24 overflow-x-hidden">
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[150px] rounded-full mix-blend-screen pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/20 blur-[150px] rounded-full mix-blend-screen pointer-events-none" />

      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-neutral-950/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
             <Settings className="w-5 h-5 text-purple-400" />
             HireScan<span className="text-purple-400">.ai</span> / Dashboard
          </div>
          <a href="/" className="text-sm font-bold text-neutral-200 hover:text-white transition-colors">
            Exit Dashboard →
          </a>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 pt-28 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-base font-medium text-purple-300 mb-6 backdrop-blur-md shadow-lg shadow-purple-900/20">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)]"></span>
            </span>
            Tri-Modal Platform powered by TinyFish API
          </div>
          <h1 className="text-6xl font-bold tracking-tight mb-4 bg-gradient-to-br from-white via-white to-white/40 bg-clip-text text-transparent">
            Control Console
          </h1>
          <p className="text-xl text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            Autonomous multi-agent orchestration. Discover portfolios and evaluate hundreds of frameworks simultaneously.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5 space-y-6">
            <form onSubmit={handleRun} className="p-8 rounded-[2rem] bg-neutral-900/40 border border-white/5 backdrop-blur-2xl shadow-2xl relative overflow-hidden group min-h-[500px] flex flex-col">
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              <h2 className="text-xl font-semibold mb-8 flex items-center gap-3">
                <Settings className="w-6 h-6 text-purple-400" />
                Execution Directives
              </h2>

              <div className="relative z-10 flex flex-col flex-1">
                {/* Mode Selector */}
                <div className="flex rounded-2xl bg-black/50 p-1.5 mb-8 border border-white/5 shadow-inner">
                  {(['E2E', 'DISCOVERY', 'EVALUATE'] as Mode[]).map(tab => (
                    <button
                      type="button"
                      key={tab}
                      onClick={() => setMode(tab)}
                      className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${mode === tab ? 'bg-purple-600 shadow-xl shadow-purple-900/30 text-white' : 'text-neutral-200 hover:text-white hover:bg-white/10'}`}
                    >
                      {tab === 'E2E' ? 'Orchestrator' : tab === 'DISCOVERY' ? 'Discovery' : 'CSV Eval'}
                    </button>
                  ))}
                </div>

                <div className="flex-1">
                  {mode !== 'EVALUATE' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                      <div>
                        <label className="block text-sm font-bold text-neutral-100 mb-2">Target Audience or Role</label>
                        <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                          <input 
                            type="text" 
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="e.g. Next.js Engineers in NY"
                            className="w-full bg-black/60 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-medium shadow-inner"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-neutral-100 mb-2">Discovery Bound (Max Limits)</label>
                        <input 
                          type="number" 
                          value={limit}
                          onChange={e => setLimit(e.target.value === "" ? "" : parseInt(e.target.value))}
                          min="1" max="100"
                          className="w-full bg-black/60 border border-white/10 rounded-xl py-4 px-4 text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-medium shadow-inner"
                        />
                      </div>
                    </motion.div>
                  )}

                  {mode === 'EVALUATE' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                      <div>
                        <label className="block text-sm font-bold text-neutral-100 mb-2">Portfolio CSV URLs (One per line)</label>
                        <textarea 
                          rows={6}
                          value={urlsText}
                          onChange={e => setUrlsText(e.target.value)}
                          placeholder="https://johndoe.com..."
                          className="w-full bg-black/60 border border-white/10 rounded-xl py-4 px-4 text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-mono text-sm leading-relaxed custom-scrollbar shadow-inner"
                        />
                      </div>
                    </motion.div>
                  )}
                </div>

                <AnimatePresence>
                  {status === "RUNNING" && progress && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex flex-col gap-2 mt-4 mb-2">
                       <div className="flex justify-between text-sm font-semibold text-neutral-300">
                         <span className="text-purple-400">Agent {progress.current} of {progress.total} executing</span>
                         <span>~{Math.ceil(progress.etaSeconds / 60)} min remaining</span>
                       </div>
                       <div className="w-full bg-black/50 rounded-full h-2 overflow-hidden shadow-inner border border-white/5 relative">
                          <motion.div 
                            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 relative"
                            initial={{ width: 0 }}
                            animate={{ width: `${(progress.current / progress.total) * 100}%` }}
                            transition={{ duration: 1, ease: "easeInOut" }}
                          />
                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-6">
                  <button 
                    type="submit" 
                    disabled={status === "RUNNING"}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 rounded-xl hover:from-purple-500 hover:to-blue-500 transition-all pointer-events-auto disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-purple-900/30 tracking-wide text-lg"
                  >
                    {status === "RUNNING" ? <><Loader2 className="w-6 h-6 animate-spin" /> Executing {mode} Pipeline...</> : "Deploy Platform Agents"}
                  </button>
                </div>
              </div>
            </form>

            {streamingUrl && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-3xl bg-blue-900/10 border border-blue-500/20 backdrop-blur-xl shadow-lg">
                 <h3 className="text-sm font-medium text-blue-400 mb-2 flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                   Live Browser Streaming
                 </h3>
                 <p className="text-sm text-neutral-400 mb-4 leading-relaxed">Watch the agent interact with the live UI in real-time as it extracts data.</p>
                 <a href={streamingUrl} target="_blank" rel="noreferrer" className="inline-block px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-sm font-medium rounded-lg transition-colors border border-blue-500/30">
                   Open Console View ↗
                 </a>
              </motion.div>
            )}
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="p-1.5 rounded-[2rem] bg-gradient-to-b from-white/10 to-transparent">
              <div className="bg-neutral-950 rounded-[1.8rem] min-h-[500px] flex flex-col overflow-hidden relative shadow-2xl">
                <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Terminal className="w-5 h-5 text-neutral-500" />
                    <span className="text-sm font-semibold tracking-wider text-neutral-400/80">HIRE-SCAN-STDOUT</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/20 hover:bg-red-500/40 transition-colors" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 hover:bg-yellow-500/40 transition-colors" />
                    <div className="w-3 h-3 rounded-full bg-green-500/20 hover:bg-green-500/40 transition-colors" />
                  </div>
                </div>
                <div className="p-6 flex-1 font-mono text-base bg-black/20 leading-loose text-neutral-300 h-[430px] overflow-y-auto custom-scrollbar shadow-inner">
                  {logs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-neutral-400 italic gap-4 font-bold">
                      <Terminal className="w-12 h-12 opacity-20" />
                      SYSTEM READY. WAITING FOR DIRECTIVE.
                    </div>
                  ) : (
                    <div className="space-y-3 pb-12">
                      {logs.map((log, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} className={`${log.includes('ERROR') ? 'text-red-400 font-bold' : log.includes('Mission complete') ? 'text-blue-400 font-bold' : 'text-green-400/90'}`}>
                          {log}
                        </motion.div>
                      ))}
                      {status === "RUNNING" && (
                        <div className="flex items-center gap-2 mt-6 text-neutral-500"><span className="animate-pulse w-2 h-5 bg-neutral-500 inline-block" /></div>
                      )}
                      <div ref={logsEndRef} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {results.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-16 bg-neutral-900/40 border border-white/10 rounded-[2rem] backdrop-blur-xl overflow-hidden shadow-2xl mb-24 relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="p-8 border-b border-white/10 flex items-center justify-between bg-white/[0.02] relative z-10">
                <h3 className="text-xl font-bold flex items-center gap-3">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]"></span>
                  </span>
                  Data Matrix Delivery
                </h3>
                <button onClick={handleDownload} className="flex items-center gap-2 text-sm bg-white/10 hover:bg-white/20 hover:scale-105 transition-all px-5 py-3 rounded-xl font-semibold shadow-lg">
                  <Download className="w-4 h-4" /> Export payload.csv
                </button>
              </div>
              <div className="overflow-x-auto relative z-10 p-2">
                <table className="w-full text-left text-sm text-neutral-300">
                  <thead className="text-neutral-400">
                    <tr>
                      {Object.keys(results[0]).map(key => (
                        <th key={key} className="px-6 py-5 font-bold uppercase tracking-widest text-xs border-b border-white/5">{key.replace(/([A-Z])/g, ' $1').trim()}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02]">
                    {results.map((item, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.04] transition-colors group/row">
                        {Object.values(item).map((val: any, j) => (
                          <td key={j} className="px-6 py-6 break-words max-w-[250px] leading-relaxed relative">
                            {Array.isArray(val) ? (
                              <div className="flex flex-wrap gap-2">
                                {val.map((stackItem, i) => (
                                  <span key={i} className="px-2 py-1 rounded-md bg-white/5 text-xs font-mono text-purple-200 border border-white/5">{stackItem}</span>
                                ))}
                              </div>
                            ) : val ? String(val) : <span className="text-neutral-600 italic">N/A</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }
      `}</style>
    </main>
  );
}
