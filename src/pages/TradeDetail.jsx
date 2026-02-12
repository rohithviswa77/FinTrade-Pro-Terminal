import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Layout, BarChart3, ShieldCheck, Loader2, Zap, TrendingUp, TrendingDown, Lock, AlertTriangle } from 'lucide-react';

export default function TradeDetail() {
  const { symbol } = useParams();
  const alertAudio = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'));
  
  // STABILITY REFS
  const lastAnalysisTime = useRef(0);
  const socketRef = useRef(null);
  
  const [prediction, setPrediction] = useState({ 
    name: "SCANNING", similarity: 0, status: "WAITING",
    targetPrice: 0, isBullish: true 
  });
  const [livePrice, setLivePrice] = useState(null);
  const [candleHistory, setCandleHistory] = useState([]); 
  const [lastLockedPattern, setLastLockedPattern] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isEngineOnline, setIsEngineOnline] = useState(true);

  const bufferProgress = useMemo(() => {
    return Math.min(Math.round((candleHistory.length / 120) * 100), 100);
  }, [candleHistory.length]);

  // --- CLEAN CRYPTO BOOTSTRAP ---
  const fetchWarmUpData = async (activeSymbol) => {
    try {
      const formattedSymbol = activeSymbol.replace('USDT', '/USDT');
      const response = await fetch(`http://localhost:5001/warm-up?symbol=${formattedSymbol}&timeframe=30m`);
      
      if (!response.ok) throw new Error("Offline");
      
      const history = await response.json();
      if (Array.isArray(history)) {
        setCandleHistory(history);
        setIsEngineOnline(true);
      }
    } catch (err) {
      setIsEngineOnline(false);
      console.warn("AI Engine Offline");
    }
  };

  const analyzeStructureWithPython = async (ohlc) => {
    try {
      const response = await fetch('http://localhost:5001/analyze-structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ohlc }) 
      });
      const verdict = await response.json();

      setIsEngineOnline(true);
      if (verdict.status === "AI_LOCKED" && verdict.name !== lastLockedPattern) {
        alertAudio.current.play().catch(() => {});
        setLastLockedPattern(verdict.name);
      } else if (verdict.status !== "AI_LOCKED") {
        setLastLockedPattern(""); 
      }
      return verdict;
    } catch (err) {
      setIsEngineOnline(false);
      return null;
    }
  };

  useEffect(() => {
    let isActive = true;
    const connect = async () => {
      if (!symbol || !isActive) return;

      await fetchWarmUpData(symbol);

      if (socketRef.current) socketRef.current.close();
      const wsUrl = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_30m`;
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => isActive && setIsConnected(true);
      ws.onmessage = async (event) => {
        if (!isActive) return;
        const data = JSON.parse(event.data);
        const price = parseFloat(data.k.c);
        setLivePrice(price);

        if (Date.now() - lastAnalysisTime.current > 5000 || data.k.x) {
          lastAnalysisTime.current = Date.now();
          setCandleHistory(prev => {
            const updated = [...prev, { 
              open: parseFloat(data.k.o), 
              high: parseFloat(data.k.h), 
              low: parseFloat(data.k.l), 
              close: price, 
              v: parseFloat(data.k.v) 
            }].slice(-120);
            
            if (updated.length >= 100) {
              analyzeStructureWithPython(updated).then(v => v && setPrediction(v));
            }
            return updated;
          });
        }
      };
      ws.onclose = () => isActive && setTimeout(connect, 5000);
    };

    connect();
    return () => { isActive = false; if (socketRef.current) socketRef.current.close(); };
  }, [symbol]);

  return (
    <div className="h-screen bg-[#060709] text-white flex overflow-hidden font-sans text-xs">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 border-l border-white/5">
        <header className="h-16 border-b border-white/5 bg-[#0b0e11] flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className={`p-2 rounded-lg border ${prediction.status === "AI_LOCKED" ? 'border-blue-500 bg-blue-500/10' : 'border-white/10'}`}>
              <BarChart3 size={18} className="text-blue-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold uppercase tracking-tighter">{symbol}</h1>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              </div>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">
                Institutional Binance Feed
              </p>
            </div>
          </div>

          {!isEngineOnline && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-4 py-1.5 rounded-full animate-pulse">
              <AlertTriangle size={12} className="text-red-500" />
              <span className="text-[10px] font-black text-red-500 uppercase">AI Engine Offline</span>
            </div>
          )}

          <div className="text-right">
            <p className="text-[9px] font-bold text-slate-500 uppercase leading-none">Live Price (USDT)</p>
            <p className="text-2xl font-mono font-black mt-1 text-blue-500">
              {livePrice ? livePrice.toLocaleString() : '---'}
            </p>
          </div>
        </header>

        <div className="flex-1 relative flex min-h-0">
          <div className="flex-1 relative bg-black">
            <iframe 
              src={`https://s.tradingview.com/widgetembed/?symbol=BINANCE:${symbol}&interval=30&theme=dark&style=1`} 
              className="w-full h-full border-none opacity-90" 
              title="TradingView Chart"
            />
          </div>

          <aside className="w-80 border-l border-white/5 bg-[#0b0e11] flex flex-col p-6 shrink-0 overflow-y-auto">
            <div className="bg-white/5 border border-white/5 p-4 rounded-2xl mb-5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase">DNA Stability</span>
                  <span className="text-[10px] font-mono text-blue-500">{candleHistory.length}/120</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all duration-700" style={{ width: `${bufferProgress}%` }} />
                </div>
            </div>

            <div className="bg-[#1e222d] border border-white/10 p-5 rounded-2xl mb-5">
               <h3 className="text-[10px] font-black text-slate-500 uppercase mb-3">Confidence</h3>
               <span className="text-5xl font-black text-white">{prediction.similarity}%</span>
            </div>

            <div className="flex-1 bg-[#1e222d] border border-white/10 rounded-2xl p-6 flex flex-col">
              <h3 className="text-[10px] font-black text-slate-400 uppercase mb-5">Pattern Analysis</h3>
              <div className="flex-1 bg-black/40 rounded-2xl flex flex-col items-center justify-center p-6 border border-white/5 mb-6">
                 {prediction.name !== "SCANNING" ? (
                    <div className="text-center">
                       <p className="text-xl font-black uppercase text-blue-400">{prediction.name}</p>
                       {prediction.status === "AI_LOCKED" && (
                        <div className="mt-3 flex items-center justify-center gap-2 px-3 py-1 rounded-full text-[8px] font-bold bg-blue-500/20 text-blue-500">
                          <Lock size={10} /> AI_LOCKED
                        </div>
                       )}
                    </div>
                 ) : (
                   <div className="flex flex-col items-center gap-3">
                     <Loader2 className="animate-spin text-blue-500" size={32} />
                     <p className="text-[10px] text-slate-600 font-black uppercase">Scanning DNA...</p>
                   </div>
                 )}
              </div>

              <div className="p-5 rounded-2xl border bg-black/30 border-white/5">
                <div className="flex items-center gap-2 mb-3">
                  {prediction.isBullish ? <TrendingUp size={14} className="text-green-500" /> : <TrendingDown size={14} className="text-red-500" />}
                  <span className="text-[10px] font-black uppercase text-slate-500">AI Target</span>
                </div>
                <p className="text-3xl font-mono font-black text-white">
                  ${prediction.targetPrice?.toLocaleString() || "0.00"}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}