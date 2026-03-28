"use client";

import { motion } from "framer-motion";
import { ArrowRight, Bot, Code2, Cpu, Globe2, Sparkles } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white selection:bg-purple-500/30 font-sans overflow-x-hidden relative">
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[150px] rounded-full mix-blend-screen pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/20 blur-[150px] rounded-full mix-blend-screen pointer-events-none" />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-neutral-950/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
             <Bot className="w-6 h-6 text-purple-400" />
             HireScan<span className="text-purple-400">.ai</span>
          </div>
          <Link href="/dashboard" className="text-sm font-bold text-neutral-100 hover:text-white transition-colors">
            Access Dashboard →
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 pt-40 pb-20 relative z-10">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-purple-300 mb-8 backdrop-blur-md shadow-lg shadow-purple-900/20"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />    
            The Ultimate Hackathon Submission
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }}
            className="text-7xl md:text-8xl font-black tracking-tight mb-8 bg-gradient-to-br from-white via-white to-white/30 bg-clip-text text-transparent leading-[1.1]"
          >
            Autonomous <br/>
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Talent Orchestration</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl text-neutral-300 max-w-2xl mx-auto leading-relaxed mb-12"
          >
            Discover, evaluate, and extract unstructured developer portfolios using a multi-agent AI pipeline powered by TinyFish.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link 
              href="/dashboard"
              className="px-8 py-5 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-lg hover:from-purple-500 hover:to-blue-500 hover:scale-105 transition-all shadow-xl shadow-purple-900/30 flex items-center gap-2 group w-full sm:w-auto justify-center"
            >
              Enter the Dashboard
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a 
              href="https://github.com/tiny-fish/mcp-tinyfish" target="_blank" rel="noreferrer"
              className="px-8 py-5 rounded-2xl bg-white/10 border border-white/20 text-neutral-100 font-bold text-lg hover:bg-white/20 transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
            >
               Powered by TinyFish
            </a>
          </motion.div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }} className="p-8 rounded-[2rem] bg-neutral-900/40 border border-white/5 backdrop-blur-xl hover:bg-white/[0.02] transition-colors relative group">
             <Globe2 className="w-10 h-10 text-purple-400 mb-6" />
             <h3 className="text-xl font-bold mb-3">Discovery Engine</h3>
             <p className="text-neutral-400 leading-relaxed">Agent 1 navigates DuckDuckGo to organically find the most relevant developer portfolios bypassing traditional job boards.</p>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.5 }} className="p-8 rounded-[2rem] bg-neutral-900/40 border border-white/5 backdrop-blur-xl hover:bg-white/[0.02] transition-colors relative group">
             <Cpu className="w-10 h-10 text-blue-400 mb-6" />
             <h3 className="text-xl font-bold mb-3">Tri-Modal Orchestration</h3>
             <p className="text-neutral-400 leading-relaxed">Sequentially chains multiple headless browser sessions, evaluating UI/UX and extracting deeply unstructured data profiles simultaneously.</p>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }} className="p-8 rounded-[2rem] bg-neutral-900/40 border border-white/5 backdrop-blur-xl hover:bg-white/[0.02] transition-colors relative group">
             <Code2 className="w-10 h-10 text-emerald-400 mb-6" />
             <h3 className="text-xl font-bold mb-3">Matrix Extractor</h3>
             <p className="text-neutral-400 leading-relaxed">Parses the tech stack, top projects, and identity metrics into clean CSS grids and CSV matrices for seamless ingestion.</p>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
