import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import MiniChart from '../components/MiniChart';
import { ChevronRight, Clock, Globe, Zap, ShieldCheck } from 'lucide-react';

export default function Dashboard() {
  // Global Market Watchlist for 24/7 analysis
  const [watchlist] = useState(["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "ADAUSDT", "LINKUSDT"]);
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
    <div className="min-h-screen bg-slate-950 text-slate-200 flex">
      {/* Sidebar now uses w-64, so flex-1 handles the remaining space */}
      <Sidebar />
      
      <main className="flex-1 flex flex-col min-w-0">
        <Header onSearch={handleNavigation} />
        
        <div className="p-8 space-y-10 max-w-7xl mx-auto w-full">
          
          {/* 1. Quick Access: Recently Analyzed */}
          {recent.length > 0 && (
            <section>
              <div className="flex items-center space-x-2 mb-4 text-slate-500">
                <Clock size={16} />
                <h2 className="text-xs font-bold uppercase tracking-widest">Recent Terminals</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {recent.map((s) => (
                  <div 
                    key={s} 
                    onClick={() => handleNavigation(s)} 
                    className="p-4 bg-slate-900/40 border border-slate-800 rounded-2xl hover:border-blue-500/50 hover:bg-slate-900/60 transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-white tracking-tighter">{s}</span>
                      <Zap size={14} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 2. Market Monitor: Verification Active */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-600/10 rounded-lg">
                  <Globe size={20} className="text-blue-500" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight">Market Monitor</h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1">
                    <ShieldCheck size={12} className="text-green-500" /> Pattern Engine Active
                  </p>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Base Currency</span>
                <p className="text-sm font-bold text-blue-500">INR (₹) Value</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {watchlist.map((s) => (
                <div 
                  key={s} 
                  onClick={() => handleNavigation(s)} 
                  className="group flex items-center justify-between p-4 bg-slate-900/20 border border-slate-800 rounded-2xl hover:bg-slate-900/60 hover:border-slate-700 transition-all cursor-pointer"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center font-black text-blue-500 text-lg shadow-inner">
                      {s[0]}
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg leading-none mb-1">{s}</h3>
                      <div className="flex items-center space-x-2">
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 font-bold border border-blue-500/20">
                          PRO FEED
                        </span>
                        <span className="text-[9px] text-slate-500 font-medium uppercase tracking-tighter">Binance Global</span>
                      </div>
                    </div>
                  </div>

                  {/* High-fidelity sparkline logic */}
                  <div className="hidden lg:block opacity-40 group-hover:opacity-100 transition-all transform group-hover:scale-105">
                    <MiniChart symbol={s} color="#3b82f6" />
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Verification</p>
                      <p className="text-sm font-mono text-white">38 Patterns</p>
                    </div>
                    <div className="p-2 bg-slate-800/50 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all text-slate-500">
                      <ChevronRight size={20} />
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