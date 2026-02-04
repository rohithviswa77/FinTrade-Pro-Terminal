import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Layout, Maximize2, MoveUpRight, Target, Activity, Zap, Loader2, ShieldCheck, BarChart3, TrendingUp, Globe, AlertTriangle, TrendingDown } from 'lucide-react';

export default function TradeDetail() {
  const { symbol } = useParams();
  const chartContainerRef = useRef(null);
  
  // FIXED: Ensure projectionPath is an empty array by default to prevent map() errors
  const [prediction, setPrediction] = useState({ 
    name: "SCANNING", similarity: 0, status: "WAITING", edges: null, 
    projectionPath: [], targetPrice: 0, deadlineX: 75 
  });
  const [livePrice, setLivePrice] = useState(null);
  const [candleHistory, setCandleHistory] = useState([]); 

  const patternImages = {
    "DOUBLE BOTTOM": "https://i.ibb.co/8Y4N9Xj/double-bottom.png", 
    "DOUBLE TOP": "https://i.ibb.co/P50vL9Lp/double-top.png",
    "HEAD AND SHOULDERS BOTTOM": "https://i.ibb.co/293bad/head-shoulders.png",
    "HEAD AND SHOULDERS TOP": "https://i.ibb.co/293bad/head-shoulders.png",
    "REVERSAL": "https://i.ibb.co/8Y4N9Xj/double-bottom.png",
    "CONTINUATION": "https://i.ibb.co/ascending-triangle.png"
  };

  const analyzeStructureWithPython = async (ohlc) => {
    try {
      const response = await fetch('http://localhost:5001/analyze-structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ohlc })
      });
      return await response.json();
    } catch (err) {
      console.error("Python Structural Engine Offline:", err);
      return null;
    }
  };

  useEffect(() => {
    let ws;
    let isActive = true;

    const connect = () => {
      if (!symbol) return;
      // Fixed: Institutional 30m kline stream
      const wsUrl = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_30m`;
      ws = new WebSocket(wsUrl);

      ws.onmessage = async (event) => {
        if (!isActive) return;
        const data = JSON.parse(event.data);
        const price = parseFloat(data.k.c);
        const volume = parseFloat(data.k.v);
        setLivePrice(price);

        setCandleHistory((prev) => {
          const updated = [...prev, { 
            close: price, 
            high: parseFloat(data.k.h),
            low: parseFloat(data.k.l),
            open: parseFloat(data.k.o),
            v: volume 
          }].slice(-40);

          // Fixed: Trigger only on candle close to prevent coordinate jitter
          if (updated.length === 40 && data.k.x && isActive) {
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

  const isBearish = useMemo(() => {
    const bearishKeywords = ["TOP", "BEARISH", "DESCENDING", "RISING_WEDGE", "QUASIMODO_BEARISH"];
    return bearishKeywords.some(keyword => (prediction.name || "").toUpperCase().includes(keyword));
  }, [prediction.name]);

  // FIXED: Optimized Coordinate Engine for 30M Timeframe
  const getSvgPoints = () => {
    if (!prediction.projectionPath?.length || !chartContainerRef.current || !livePrice) return "";
    
    const width = chartContainerRef.current.clientWidth;
    const height = chartContainerRef.current.clientHeight;

    return prediction.projectionPath.map(p => {
      // Scale X based on a 70-unit span to match the Python skeleton
      const x = ((p.x - 10) / 70) * width; 
      // Scale Y based on a 5% volatility window around live price
      const priceRange = livePrice * 0.05; 
      const y = (height / 2) - ((p.y - livePrice) / priceRange) * height;
      return `${x},${y}`;
    }).join(' ');
  };

  return (
    <div className="h-screen bg-[#060709] text-white flex overflow-hidden font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 border-l border-white/5">
        <header className="h-16 border-b border-white/5 bg-[#0b0e11] flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600/20 p-2 rounded-lg border border-blue-500/30">
              <BarChart3 size={18} className="text-blue-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight uppercase leading-none">{symbol}</h1>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1 flex items-center gap-2">
                <ShieldCheck size={10} className="text-green-500" /> MD5 30M Structural Overlay
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">Market Exchange (₹)</p>
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

            {/* PREDICTIVE OVERLAY LAYER */}
            {prediction.projectionPath?.length > 0 && prediction.similarity > 70 && (
              <svg className="absolute inset-0 pointer-events-none w-full h-full z-30 overflow-visible">
                {/* Breakout Deadline */}
                {prediction.deadlineX && chartContainerRef.current && (
                  <line 
                    x1={`${((prediction.deadlineX - 10) / 70) * chartContainerRef.current.clientWidth}`} 
                    y1="0" 
                    x2={`${((prediction.deadlineX - 10) / 70) * chartContainerRef.current.clientWidth}`} 
                    y2="100%" 
                    stroke={isBearish ? "rgba(239, 68, 68, 0.3)" : "rgba(59, 130, 246, 0.3)"} 
                    strokeWidth="1" 
                    strokeDasharray="5,5" 
                  />
                )}

                <polyline
                  fill="none"
                  stroke={isBearish ? "#ef4444" : "#3b82f6"} 
                  strokeWidth="3"
                  strokeDasharray="10,5"
                  points={getSvgPoints()}
                  className="transition-all duration-1000 opacity-70"
                />
                <circle 
                  cx={getSvgPoints().split(' ').pop().split(',')[0]} 
                  cy={getSvgPoints().split(' ').pop().split(',')[1]} 
                  r="6" 
                  fill={isBearish ? "#ef4444" : "#3b82f6"} 
                  className="animate-ping" 
                />
              </svg>
            )}
          </div>

          <aside className="w-85 border-l border-white/5 bg-[#0b0e11] flex flex-col p-6 shrink-0 shadow-2xl">
            {/* Probability HUD */}
            <div className="bg-[#1e222d] border border-white/10 p-5 rounded-2xl mb-5 relative overflow-hidden">
               <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Matching Probability</h3>
               <div className="flex items-end gap-2">
                  <span className="text-5xl font-black text-white">{prediction.similarity}%</span>
                  <span className="text-[10px] font-bold text-blue-500 uppercase pb-2">Accuracy</span>
               </div>
               <div className="mt-5 w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${prediction.similarity}%` }} />
               </div>
            </div>

            <div className="flex-1 bg-[#1e222d] border border-white/10 rounded-2xl p-6 flex flex-col">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Structural DNA</h3>
                <div className={`px-2 py-1 rounded text-[8px] font-black border uppercase tracking-widest flex items-center gap-1.5 ${
                  prediction.status === 'ACTIVE_BREAKOUT' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                  prediction.status === 'WEAK_BREAKOUT' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 
                  'bg-blue-500/10 text-blue-500 border-blue-500/20'
                }`}>
                  {prediction.status === 'WEAK_BREAKOUT' && <AlertTriangle size={10} />}
                  {prediction.status}
                </div>
              </div>
              
              <div className="flex-1 bg-black/40 rounded-2xl flex flex-col items-center justify-center p-6 relative border border-white/5 mb-6 shadow-inner overflow-hidden">
                 {prediction.name !== "SCANNING" ? (
                   <>
                    <img 
                      src={patternImages[prediction.name.split(' (')[0]] || patternImages["REVERSAL"]} 
                      className="w-full h-full object-contain opacity-20 invert grayscale brightness-200"
                      alt="DNA Geometry"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                       <p className="text-sm font-black text-white uppercase text-center px-4 leading-tight drop-shadow-lg">{prediction.name}</p>
                    </div>
                   </>
                 ) : (
                   <div className="flex flex-col items-center gap-3">
                     <Loader2 className="animate-spin text-blue-500" size={32} />
                     <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest text-center">Identifying Geometric<br/>Families...</p>
                   </div>
                 )}
              </div>

              <div className={`p-5 rounded-2xl border border-white/5 transition-colors ${isBearish ? 'bg-red-500/5 hover:border-red-500/30' : 'bg-black/30 hover:border-blue-500/30'}`}>
                <div className="flex items-center gap-2 mb-3">
                  {isBearish ? <TrendingDown size={14} className="text-red-500" /> : <Target size={14} className="text-blue-500" />}
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                    {isBearish ? 'Short Objective' : 'Exit Objective'}
                  </span>
                </div>
                <p className={`text-3xl font-mono font-black tracking-tighter ${isBearish ? 'text-red-500' : 'text-white'}`}>
                  ₹{prediction.targetPrice?.toLocaleString('en-IN') || "0.00"}
                </p>
                <div className={`mt-3 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest ${isBearish ? 'text-red-400' : 'text-green-500'}`}>
                   {isBearish ? <Activity size={12} /> : <TrendingUp size={12} />} 
                   Institutional {isBearish ? 'Short' : 'Long'} Projection
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}