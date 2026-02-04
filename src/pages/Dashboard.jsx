import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import MiniChart from '../components/MiniChart';
import { ChevronRight, Clock, Globe, Zap, ShieldCheck, Activity, Search } from 'lucide-react';

export default function Dashboard() {
  // Enhanced Global Market Watchlist
  const [watchlist] = useState(["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "ADAUSDT", "LINKUSDT", "AVAXUSDT", "DOTUSDT"]);
  const [recent, setRecent] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('fintrade_recent')) || [];
    setRecent(saved);
  }, []);

  const handleNavigation = (symbol) => {
    const updatedRecent = [symbol, ...recent.filter(s => s !== symbol)].slice(0, 4);
    setRecent(updatedRecent);
    localStorage.setItem('fintrade_recent', JSON.stringify(updatedRecent));
    navigate(`/trade/${symbol}`);
  };

  return (
    <div className="min-h-screen bg-[#060709] text-slate-200 flex font-sans overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 flex flex-col min-w-0 border-l border-white/5 overflow-y-auto custom-scrollbar">
        <Header onSearch={handleNavigation} />
        
        <div className="p-8 space-y-12 max-w-7xl mx-auto w-full">
          
          {/* 1. INSTITUTIONAL QUICK ACCESS */}
          {recent.length > 0 && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center space-x-2 mb-5 text-slate-500">
                <Clock size={14} className="text-blue-500" />
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">Active Terminals</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {recent.map((s) => (
                  <div 
                    key={s} 
                    onClick={() => handleNavigation(s)} 
                    className="p-5 bg-[#0b0e11] border border-white/5 rounded-2xl hover:border-blue-500/40 hover:bg-[#1e222d] transition-all cursor-pointer group relative overflow-hidden shadow-2xl"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-mono font-black text-white tracking-tighter text-lg">{s}</span>
                        <p className="text-[8px] text-slate-500 font-bold uppercase mt-1">Ready for Scan</p>
                      </div>
                      <Activity size={16} className="text-blue-500 group-hover:animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 2. MARKET MONITOR: 200+ PATTERN ENGINE */}
          <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-600/10 rounded-2xl border border-blue-500/20 shadow-inner">
                  <Globe size={24} className="text-blue-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Institutional Monitor</h2>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-2 mt-1">
                    <ShieldCheck size={12} className="text-green-500" /> Pattern Engine Active (30M Interval)
                  </p>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Base Liquidity</span>
                <p className="text-lg font-mono font-bold text-blue-500">INR (₹) Direct Feed</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {watchlist.map((s) => (
                <div 
                  key={s} 
                  onClick={() => handleNavigation(s)} 
                  className="group flex items-center justify-between p-5 bg-[#0b0e11] border border-white/5 rounded-3xl hover:bg-[#1e222d] hover:border-blue-500/20 transition-all cursor-pointer shadow-xl relative overflow-hidden"
                >
                  <div className="flex items-center space-x-6 relative z-10">
                    <div className="w-14 h-14 bg-black border border-white/5 rounded-2xl flex items-center justify-center font-black text-blue-500 text-xl shadow-2xl group-hover:scale-110 transition-transform">
                      {s[0]}
                    </div>
                    <div>
                      <h3 className="text-white font-black text-xl leading-none mb-2 tracking-tighter uppercase">{s}</h3>
                      <div className="flex items-center space-x-2">
                        <span className="text-[8px] px-2 py-0.5 rounded-full bg-blue-500 text-white font-black tracking-widest border border-blue-400/30 shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                          LIVE
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Binance institutional</span>
                      </div>
                    </div>
                  </div>

                  {/* HIGH-FIDELITY SPARKLINE */}
                  <div className="hidden lg:block opacity-30 group-hover:opacity-80 transition-all transform group-hover:scale-110 translate-x-10">
                    <MiniChart symbol={s} color="#3b82f6" />
                  </div>

                  <div className="flex items-center space-x-8 relative z-10">
                    <div className="text-right hidden sm:block border-l border-white/5 pl-8">
                      <p className="text-[9px] text-slate-500 uppercase font-black tracking-[0.2em] mb-1">Deep Analysis</p>
                      <p className="text-base font-mono font-black text-white">200+ Variants</p>
                    </div>
                    <div className="p-3 bg-[#1e222d] border border-white/5 rounded-2xl group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all text-slate-400">
                      <ChevronRight size={24} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}