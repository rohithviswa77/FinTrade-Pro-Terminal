import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import MiniChart from '../components/MiniChart';
import { ChevronRight, Clock, Globe, Zap, ShieldCheck, Activity, TrendingUp, BarChart4 } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [recent, setRecent] = useState([]);

  // Focused Watchlist for Binance Spot
  const cryptoWatchlist = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "LINKUSDT", "AVAXUSDT"];

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
        
        <div className="p-8 space-y-10 max-w-7xl mx-auto w-full">
          
          {/* 1. MASTER STATUS HUD */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-1000">
            <div className="bg-gradient-to-br from-[#1e222d] to-[#0b0e11] border border-white/5 p-6 rounded-3xl relative overflow-hidden group shadow-2xl">
                <div className="flex justify-between items-start relative z-10">
                    <div>
                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Primary Asset</p>
                        <h2 className="text-2xl font-black text-white italic">BITCOIN</h2>
                    </div>
                    <Zap className="text-blue-500/50 group-hover:text-blue-500 transition-colors" size={24} />
                </div>
                <div className="mt-4 flex items-end gap-3 relative z-10">
                    <span className="text-3xl font-mono font-bold text-white tracking-tighter">BTC/USDT</span>
                </div>
                <div className="absolute -bottom-2 -right-2 opacity-10">
                    <BarChart4 size={100} />
                </div>
            </div>

            <div className="bg-gradient-to-br from-[#1e222d] to-[#0b0e11] border border-white/5 p-6 rounded-3xl relative overflow-hidden group shadow-2xl">
                <div className="flex justify-between items-start relative z-10">
                    <div>
                        <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-1">Smart Contracts</p>
                        <h2 className="text-2xl font-black text-white italic">ETHEREUM</h2>
                    </div>
                    <Activity className="text-purple-500/50 group-hover:text-purple-500 transition-colors" size={24} />
                </div>
                <div className="mt-4 flex items-end gap-3 relative z-10">
                    <span className="text-3xl font-mono font-bold text-white tracking-tighter">ETH/USDT</span>
                </div>
                <div className="absolute -bottom-2 -right-2 opacity-10">
                    <BarChart4 size={100} />
                </div>
            </div>
            
            <div className="bg-blue-600/5 border border-blue-500/20 p-6 rounded-3xl flex flex-col justify-center items-center text-center group hover:bg-blue-600/10 transition-colors">
                <ShieldCheck size={40} className="text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-sm font-black text-white uppercase tracking-tighter">AI Master Brain</h3>
                <p className="text-[9px] text-slate-500 font-bold mt-1 uppercase tracking-[0.2em]">
                  Scanning Structural DNA
                </p>
            </div>
          </section>

          <hr className="border-white/5" />

          {/* 2. CRYPTO RADAR MONITOR */}
          <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="flex items-center space-x-4 mb-8">
              <div className="p-3 bg-white/5 rounded-2xl border border-white/10 shadow-inner">
                <Globe size={24} className="text-blue-500" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight uppercase italic">Structural Radar</h2>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-2 mt-1">
                  <TrendingUp size={12} className="text-green-500" /> Real-time Binance Liquidity Monitoring
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {cryptoWatchlist.map((s) => (
                <div 
                  key={s} 
                  onClick={() => handleNavigation(s)} 
                  className="group flex items-center justify-between p-5 bg-[#0b0e11] border border-white/5 rounded-3xl transition-all cursor-pointer shadow-xl hover:bg-[#1e222d] hover:border-blue-500/30"
                >
                  <div className="flex items-center space-x-6 relative z-10">
                    <div className="w-14 h-14 bg-black border border-white/5 rounded-2xl flex items-center justify-center font-black text-xl shadow-2xl group-hover:scale-110 transition-transform text-blue-500">
                      {s[0]}
                    </div>
                    <div>
                      <h3 className="text-white font-black text-xl leading-none mb-2 tracking-tighter uppercase">{s}</h3>
                      <div className="flex items-center space-x-2">
                        <span className="text-[8px] px-2 py-0.5 rounded-full text-white font-black tracking-widest bg-blue-600 border border-white/10">
                          SPOT
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                          Binance Institutional
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="hidden lg:block opacity-20 group-hover:opacity-80 transition-all transform group-hover:scale-105 translate-x-10">
                    <MiniChart symbol={s} color="#3b82f6" />
                  </div>

                  <div className="flex items-center space-x-8 relative z-10">
                    <div className="text-right hidden sm:block border-l border-white/5 pl-8">
                      <p className="text-[9px] text-slate-500 uppercase font-black tracking-[0.2em] mb-1 italic">Structural Analysis</p>
                      <p className="text-base font-mono font-black text-white">30M / LSTM-CNN</p>
                    </div>
                    <div className="p-3 bg-[#1e222d] border border-white/5 rounded-2xl transition-all text-slate-400 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]">
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