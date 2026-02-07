import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Layout, Maximize2, MoveUpRight, Target, Activity, Zap, Loader2, ShieldCheck, BarChart3, TrendingUp, Globe, AlertTriangle, TrendingDown, Lock } from 'lucide-react';

export default function TradeDetail() {
  const { symbol } = useParams();
  const chartContainerRef = useRef(null);
  
  const [prediction, setPrediction] = useState({ 
    name: "SCANNING", similarity: 0, status: "WAITING",
    projectionPath: [], targetPrice: 0 
  });
  const [livePrice, setLivePrice] = useState(null);
  const [candleHistory, setCandleHistory] = useState([]); 

  const patternImages = {
    "DOUBLE BOTTOM": "https://i.ibb.co/8Y4N9Xj/double-bottom.png", 
    "HEAD AND SHOULDERS": "https://i.ibb.co/293bad/head-shoulders.png",
    "BULLISH FLAG": "https://i.ibb.co/ascending-triangle.png",
    "NEUTRAL": "https://i.ibb.co/8Y4N9Xj/double-bottom.png"
  };

  const analyzeStructureWithPython = async (ohlc) => {
    try {
      // 50k Adaptive Engine requires at least 120 candles for full context
      const response = await fetch('http://localhost:5001/analyze-structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ohlc: ohlc.slice(-120) })
      });
      return await response.json();
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
      const wsUrl = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_30m`;
      ws = new WebSocket(wsUrl);

      ws.onmessage = async (event) => {
        if (!isActive) return;
        const data = JSON.parse(event.data);
        const price = parseFloat(data.k.c);
        setLivePrice(price);

        setCandleHistory((prev) => {
          // Increase buffer to 120 candles for the Institutional Brain
          const updated = [...prev, { 
            close: price, 
            high: parseFloat(data.k.h),
            low: parseFloat(data.k.l),
            open: parseFloat(data.k.o)
          }].slice(-120);

          // Trigger AI analysis on every new price movement for real-time monitoring
          if (updated.length >= 30 && isActive) {
            analyzeStructureWithPython(updated).then(verdict => {
              if (verdict && isActive) setPrediction(verdict);
            });
          }
          return updated;
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
  
  const isBearish = useMemo(() => {
    return ["TOP", "BEARISH", "HEAD AND SHOULDERS"].some(k => 
      (prediction.name || "").toUpperCase().includes(k)
    );
  }, [prediction.name]);

  return (
    <div className="h-screen bg-[#060709] text-white flex overflow-hidden font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 border-l border-white/5">
        <header className="h-16 border-b border-white/5 bg-[#0b0e11] flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <div className={`p-2 rounded-lg border transition-colors ${isLocked ? 'bg-green-500/20 border-green-500/50' : 'bg-blue-600/20 border-blue-500/30'}`}>
              <BarChart3 size={18} className={isLocked ? "text-green-500" : "text-blue-500"} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight uppercase flex items-center gap-2">
                {symbol} {isLocked && <Lock size={16} className="text-green-500 animate-pulse" />}
              </h1>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1 flex items-center gap-2">
                <ShieldCheck size={10} className={isLocked ? "text-green-500" : "text-blue-500"} /> 
                {isLocked ? "Institutional Structure Locked" : "Adaptive AI Scanning..."}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">Live Market (₹)</p>
            <p className={`text-2xl font-mono font-black mt-1 ${isBearish ? 'text-red-500' : 'text-blue-500'}`}>
              {livePrice?.toLocaleString('en-IN')}
            </p>
          </div>
        </header>

        <div className="flex-1 relative flex min-h-0">
          <div className="flex-1 relative bg-black overflow-hidden" ref={chartContainerRef}>
            <iframe 
              src={`https://s.tradingview.com/widgetembed/?symbol=BINANCE:${symbol}&interval=30&theme=dark&style=1&hide_top_toolbar=true`} 
              className="w-full h-full border-none opacity-80" 
              title="MD5 Master View"
            />
          </div>

          <aside className="w-85 border-l border-white/5 bg-[#0b0e11] flex flex-col p-6 shrink-0 shadow-2xl">
            {/* Probability HUD with Confidence Meter */}
            <div className={`border p-5 rounded-2xl mb-5 transition-all ${isLocked ? 'bg-green-500/5 border-green-500/30' : 'bg-[#1e222d] border-white/10'}`}>
               <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">AI Confidence</h3>
               <div className="flex items-end gap-2">
                  <span className={`text-5xl font-black ${isLocked ? 'text-green-500' : 'text-white'}`}>{prediction.similarity}%</span>
                  <span className="text-[10px] font-bold text-blue-500 uppercase pb-2">Verified</span>
               </div>
               <div className="mt-5 w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-1000 ${isLocked ? 'bg-green-500' : 'bg-blue-500'}`} 
                       style={{ width: `${prediction.similarity}%` }} />
               </div>
            </div>

            <div className="flex-1 bg-[#1e222d] border border-white/10 rounded-2xl p-6 flex flex-col">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Structural DNA</h3>
                <div className={`px-2 py-1 rounded text-[8px] font-black border uppercase tracking-widest flex items-center gap-1.5 ${
                  isLocked ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                }`}>
                  {prediction.name === "SCANNING" ? <Loader2 size={10} className="animate-spin" /> : <Zap size={10} />}
                  {prediction.status}
                </div>
              </div>
              
              <div className="flex-1 bg-black/40 rounded-2xl flex flex-col items-center justify-center p-6 relative border border-white/5 mb-6 shadow-inner">
                 {prediction.name !== "SCANNING" ? (
                   <>
                    <img 
                      src={patternImages[prediction.name] || patternImages["NEUTRAL"]} 
                      className="w-full h-full object-contain opacity-20 invert grayscale brightness-200"
                      alt="Geometric Skeleton"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                       <p className="text-sm font-black text-white uppercase text-center px-4 drop-shadow-lg">{prediction.name}</p>
                       {isLocked && <p className="text-[8px] font-bold text-green-500 mt-2 tracking-widest uppercase">Pattern Confirmed</p>}
                    </div>
                   </>
                 ) : (
                   <div className="flex flex-col items-center gap-3 text-center">
                     <Loader2 className="animate-spin text-blue-500" size={32} />
                     <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Analyzing Global<br/>Pivots...</p>
                   </div>
                 )}
              </div>

              <div className={`p-5 rounded-2xl border border-white/5 transition-colors ${isBearish ? 'bg-red-500/5 hover:border-red-500/30' : 'bg-black/30 hover:border-blue-500/30'}`}>
                <div className="flex items-center gap-2 mb-3">
                  {isBearish ? <TrendingDown size={14} className="text-red-500" /> : <Target size={14} className="text-blue-500" />}
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Projected Target</span>
                </div>
                <p className={`text-3xl font-mono font-black tracking-tighter ${isBearish ? 'text-red-500' : 'text-white'}`}>
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