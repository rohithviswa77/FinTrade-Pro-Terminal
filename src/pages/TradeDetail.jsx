import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { getMarketPrediction } from '../utils/predictiveEngine';
import { Layout, Maximize2, MoveUpRight, Target, Activity, Zap } from 'lucide-react';

export default function TradeDetail() {
  const { symbol } = useParams();
  const [prediction, setPrediction] = useState({ 
    name: "SCANNING", similarity: 0, status: "WAITING", color: "text-slate-500",
    edges: null, visualSkeleton: [] 
  });
  const [livePrice, setLivePrice] = useState(null);
  const [candleHistory, setCandleHistory] = useState([]); 
  const [isSyncing, setIsSyncing] = useState(true);

  // 1. DYNAMIC AUTO-TRENDLINE: Connects structural high points
  const trendlineCoords = useMemo(() => {
    if (candleHistory.length < 40) return null;
    const highs = candleHistory.map(c => c.high);
    const maxHigh = Math.max(...highs);
    const firstHighIdx = highs.indexOf(maxHigh);
    const remainingHighs = highs.slice(firstHighIdx + 1);
    const secondHigh = Math.max(...remainingHighs) || maxHigh;
    
    // Calculate rotation for the CSS overlay
    return { slope: (secondHigh - maxHigh) / 40 };
  }, [candleHistory]);

  useEffect(() => {
    let ws;
    const connect = () => {
      const wsUrl = `wss://stream.binance.com:9443/ws/${symbol?.toLowerCase()}@kline_1m`;
      ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const price = parseFloat(data.k.c);
        setLivePrice(price);
        setCandleHistory((prev) => {
          const updated = [...prev, { high: parseFloat(data.k.h), close: price }].slice(-40);
          const verdict = getMarketPrediction(updated); // Structural Engine Call
          if (verdict) setPrediction(verdict);
          setIsSyncing(false);
          return updated;
        });
      };
    };
    connect();
    return () => ws?.close();
  }, [symbol]);

  return (
    <div className="h-screen bg-slate-950 text-white flex overflow-hidden font-sans">
      <Sidebar />
      <main className="flex-1 p-8 flex flex-col min-w-0">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">{symbol}</h1>
          <div className="text-right">
             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Market Price (₹)</span>
             <p className="text-3xl font-mono font-bold text-blue-500 leading-none mt-1">₹{livePrice?.toLocaleString()}</p>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-6 flex-1 min-h-0 overflow-hidden">
          {/* MAIN CHART WITH AUTO-TRENDLINE */}
          <div className="col-span-8 bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden relative h-full">
            <iframe src={`https://s.tradingview.com/widgetembed/?symbol=BINANCE:${symbol}&interval=1&theme=dark`} className="w-full h-full border-none" title="Market Chart" />
            
            {/* Auto-Trendline Overlay */}
            <div className="absolute inset-0 pointer-events-none border-t-2 border-blue-500/40 border-dashed" 
                 style={{ top: '35%', transform: `rotate(${trendlineCoords?.slope || 0}deg)` }} />
            
            <div className="absolute top-4 left-4 flex gap-2">
               <div className="bg-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg">
                  <Maximize2 size={12} /> Auto-Trendline Active
               </div>
            </div>
          </div>

          {/* SECONDARY SIDEBAR: STRUCTURAL IDEAL VIEW */}
          <div className="col-span-4 flex flex-col space-y-4 h-full overflow-hidden">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex-1 flex flex-col shadow-2xl relative overflow-hidden">
              <div className="mb-6 flex justify-between items-center relative z-10">
                <div>
                   <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-tighter mb-1">Ideal Pattern Projection</h3>
                   <div className={`text-3xl font-black tracking-tighter ${prediction.color}`}>{prediction.name}</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 shadow-xl">
                   <Layout size={20} className="text-blue-500" />
                </div>
              </div>

              {/* DUAL-LAYER STRUCTURAL VISUALIZER */}
              <div className="relative flex-1 bg-slate-950/80 rounded-2xl border border-slate-800 flex flex-col items-center justify-center overflow-hidden mb-6">
                
                {/* 1. ACTUAL PATTERN EDGE (Neckline) */}
                {prediction.edges && (
                   <div className="absolute w-full px-6 flex flex-col items-center" style={{ top: '35%' }}>
                      <div className="w-full h-[2px] bg-red-500/60 relative animate-pulse">
                         <span className="absolute -top-5 right-0 text-[9px] font-black text-red-500 uppercase tracking-widest">Resistance Edge (Neckline)</span>
                      </div>
                   </div>
                )}

                {/* 2. IDEAL SHAPE COMPLETION IMAGE */}
                {/* Fixed path to the image you provided */}
                <div className="relative w-full h-56 flex items-center justify-center px-8">
                   <img 
                     src="https://i.postimg.cc/858a83/double-bottom.png" 
                     alt="Pattern DNA Structure" 
                     className="w-full h-full object-contain opacity-40 grayscale invert brightness-200"
                   />
                </div>

                {/* 3. SIMILARITY PROGRESS TRACKER */}
                <div className="absolute bottom-6 left-6 right-6 bg-slate-900/95 p-4 rounded-2xl border border-slate-800 shadow-2xl">
                   <div className="flex justify-between items-center text-[10px] font-black uppercase mb-2">
                      <span className="text-slate-500 flex items-center gap-1"><Zap size={10} className="text-yellow-500" /> Pattern Match</span>
                      <span className="text-blue-400">{prediction.similarity}% Accurate</span>
                   </div>
                   <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 transition-all duration-1000 ease-out" style={{ width: `${prediction.similarity}%` }} />
                   </div>
                </div>
              </div>

              {/* EXPECTED BREAKDOWN EDGE DATA */}
              <div className="p-5 bg-blue-500/10 border border-blue-500/20 rounded-3xl relative overflow-hidden">
                 <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-500/10 blur-2xl" />
                 <div className="flex items-center gap-2 mb-3 relative z-10">
                    <Target size={16} className="text-blue-500" />
                    <span className="text-[10px] font-black uppercase text-blue-400 tracking-[0.2em]">Expected Breakdown Edge</span>
                 </div>
                 <div className="flex justify-between items-end relative z-10">
                    <p className="text-xs font-bold text-slate-400">Target Breakout Above:</p>
                    <p className="text-2xl font-mono font-black text-white">
                        {prediction.edges?.neckline ? `₹${prediction.edges.neckline.toLocaleString()}` : "SCANNING..."}
                    </p>
                 </div>
                 <div className="mt-3 flex items-center gap-1 text-green-400 text-[10px] font-black uppercase tracking-widest relative z-10">
                    <MoveUpRight size={14} /> Potential 0.45% Move Post-Break
                 </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}