import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Layout, Maximize2, MoveUpRight, Target, Activity, Zap, Loader2, ShieldCheck, BarChart3, TrendingUp, Globe, AlertTriangle, TrendingDown, Lock } from 'lucide-react';

export default function TradeDetail() {
  const { symbol } = useParams();
  const chartContainerRef = useRef(null);
  const alertAudio = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'));
  
  const [prediction, setPrediction] = useState({ 
    name: "SCANNING", similarity: 0, status: "WAITING",
    targetPrice: 0, isBullish: true 
  });
  const [livePrice, setLivePrice] = useState(null);
  const [candleHistory, setCandleHistory] = useState([]); 
  const [lastLockedPattern, setLastLockedPattern] = useState("");

  const bufferProgress = useMemo(() => {
    return Math.min(Math.round((candleHistory.length / 120) * 100), 100);
  }, [candleHistory.length]);

  const analyzeStructureWithPython = async (ohlc) => {
    try {
      const response = await fetch('http://localhost:5001/analyze-structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ohlc }) 
      });
      const verdict = await response.json();

      if (verdict.status === "AI_LOCKED" && verdict.name !== lastLockedPattern) {
        alertAudio.current.play().catch(() => {});
        setLastLockedPattern(verdict.name);
      } else if (verdict.status !== "AI_LOCKED") {
        setLastLockedPattern(""); 
      }
      return verdict;
    } catch (err) {
      console.error("AI Engine Offline:", err);
      return null;
    }
  };

  useEffect(() => {
    let ws;
    let isActive = true;

    const connect = () => {
      if (!symbol) return;
      // Using 30m for macro analysis, but the queue will shift on every price update
      const wsUrl = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_30m`;
      ws = new WebSocket(wsUrl);

      ws.onmessage = async (event) => {
        if (!isActive) return;
        const data = JSON.parse(event.data);
        const price = parseFloat(data.k.c);
        setLivePrice(price);

        // SLIDING WINDOW QUEUE LOGIC
        setCandleHistory((prev) => {
          const newCandle = { 
            open: parseFloat(data.k.o),
            high: parseFloat(data.k.h),
            low: parseFloat(data.k.l),
            close: price, 
            v: parseFloat(data.k.v)
          };

          // 1. Add newest data to the end
          // 2. slice(-120) releases the oldest candle from the beginning
          const updatedQueue = [...prev, newCandle].slice(-120);

          // Trigger AI analysis on the shifted window
          if (isActive) {
            analyzeStructureWithPython(updatedQueue).then(verdict => {
              if (verdict && isActive) setPrediction(verdict);
            });
          }
          return updatedQueue;
        });
      };
    };

    connect();
    return () => {
      isActive = false;
      if (ws && ws.readyState === WebSocket.OPEN) ws.close();
    };
  }, [symbol]);

  const isLocked = useMemo(() => prediction.status === "AI_LOCKED", [prediction.status]);
  const isBullish = prediction.isBullish;

  return (
    <div className="h-screen bg-[#060709] text-white flex overflow-hidden font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 border-l border-white/5">
        <header className="h-16 border-b border-white/5 bg-[#0b0e11] flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <div className={`p-2 rounded-lg border transition-all duration-500 ${isLocked ? (isBullish ? 'bg-green-500/20 border-green-500' : 'bg-red-500/20 border-red-500') : 'bg-blue-600/20 border-blue-500/30'}`}>
              <BarChart3 size={18} className={isLocked ? (isBullish ? "text-green-500" : "text-red-500") : "text-blue-500"} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight uppercase flex items-center gap-2">
                {symbol} {isLocked && <Lock size={16} className={isBullish ? "text-green-500 animate-pulse" : "text-red-500 animate-pulse"} />}
              </h1>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1 flex items-center gap-2">
                <ShieldCheck size={10} className={bufferProgress === 100 ? "text-green-500" : "text-yellow-500"} /> 
                {bufferProgress < 100 ? `Syncing Queue (${bufferProgress}%)` : "Sliding Window Active"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">Live Price (₹)</p>
            <p className={`text-2xl font-mono font-black mt-1 ${isLocked ? (isBullish ? 'text-green-500' : 'text-red-500') : 'text-blue-500'}`}>
              {livePrice?.toLocaleString('en-IN')}
            </p>
          </div>
        </header>

        <div className="flex-1 relative flex min-h-0">
          <div className="flex-1 relative bg-black overflow-hidden" ref={chartContainerRef}>
            <iframe 
              src={`https://s.tradingview.com/widgetembed/?symbol=BINANCE:${symbol}&interval=30&theme=dark&style=1&hide_top_toolbar=true`} 
              className="w-full h-full border-none opacity-80" 
              title="Master Terminal View"
            />
          </div>

          <aside className="w-85 border-l border-white/5 bg-[#0b0e11] flex flex-col p-6 shrink-0 shadow-2xl">
            {/* QUEUE STATUS HUD */}
            {bufferProgress < 100 && (
              <div className="bg-yellow-500/5 border border-yellow-500/20 p-4 rounded-2xl mb-5 animate-pulse">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest flex items-center gap-2">
                    <Loader2 size={10} className="animate-spin" /> Shifting Queue
                  </span>
                  <span className="text-[10px] font-mono font-bold text-yellow-500">
                    {candleHistory.length} / 120
                  </span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500 transition-all duration-500" 
                       style={{ width: `${bufferProgress}%` }} />
                </div>
              </div>
            )}

            <div className={`border p-5 rounded-2xl mb-5 transition-all duration-500 ${isLocked ? (isBullish ? 'bg-green-500/10 border-green-500/50' : 'bg-red-500/10 border-red-500/50') : 'bg-[#1e222d] border-white/10'}`}>
               <div className="flex justify-between items-center mb-3">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">AI Confidence</h3>
                  {isLocked && <Zap size={14} className={`${isBullish ? 'text-green-500' : 'text-red-500'} animate-bounce`} />}
               </div>
               <div className="flex items-end gap-2">
                  <span className={`text-5xl font-black transition-colors ${isLocked ? (isBullish ? 'text-green-500' : 'text-red-500') : 'text-white'}`}>{prediction.similarity}%</span>
                  <span className="text-[10px] font-bold text-blue-500 uppercase pb-2">Match</span>
               </div>
            </div>

            <div className="flex-1 bg-[#1e222d] border border-white/10 rounded-2xl p-6 flex flex-col">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5">Current Structure</h3>
              
              <div className="flex-1 bg-black/40 rounded-2xl flex flex-col items-center justify-center p-6 relative border border-white/5 mb-6 shadow-inner overflow-hidden">
                 {prediction.name !== "SCANNING" ? (
                    <div className="text-center">
                       <p className={`text-xl font-black uppercase tracking-tighter drop-shadow-lg ${isLocked ? (isBullish ? 'text-green-400' : 'text-red-400') : 'text-white'}`}>
                        {prediction.name}
                       </p>
                       {isLocked && <div className={`mt-2 text-[8px] font-bold px-3 py-1 rounded-full uppercase tracking-widest animate-pulse ${isBullish ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>LOCKED</div>}
                    </div>
                 ) : (
                   <div className="flex flex-col items-center gap-3 text-center">
                     <Loader2 className="animate-spin text-blue-500" size={32} />
                     <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Processing Shifting<br/>Queue Window...</p>
                   </div>
                 )}
              </div>

              <div className={`p-5 rounded-2xl border transition-all duration-500 ${isLocked ? (isBullish ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30') : 'bg-black/30 border-white/5'}`}>
                <div className="flex items-center gap-2 mb-3">
                  {isBullish ? <TrendingUp size={14} className="text-green-500" /> : <TrendingDown size={14} className="text-red-500" />}
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">AI Target</span>
                </div>
                <p className={`text-3xl font-mono font-black tracking-tighter ${isLocked ? (isBullish ? 'text-green-500' : 'text-red-500') : 'text-white'}`}>
                  ₹{prediction.targetPrice?.toLocaleString('en-IN') || "0.00"}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}