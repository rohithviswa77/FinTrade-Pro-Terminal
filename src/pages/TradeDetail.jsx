import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { getMarketPrediction } from '../utils/predictiveEngine';
import { ShieldCheck, Zap, Activity, History, FastForward, Loader2 } from 'lucide-react';

export default function TradeDetail() {
  const { symbol } = useParams();
  const [prediction, setPrediction] = useState({ 
    name: "ANALYZING", signal: "WAIT", prediction: "SYNCING", color: "text-slate-500", patternData: null, confidence: "Low" 
  });
  const [livePrice, setLivePrice] = useState(null);
  const [candleHistory, setCandleHistory] = useState([]); 
  const [tradeHistory, setTradeHistory] = useState([]); 
  const [accuracy, setAccuracy] = useState({ wins: 0, total: 0 });
  const [isSyncing, setIsSyncing] = useState(true);
  const socketRef = useRef(null);

  const formatINR = (val) => new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR'
  }).format(val || 0);

  const calculatePL = (trade) => {
    if (!livePrice) return 0;
    return trade.type === 'PURCHASE' ? (livePrice - trade.entry) : (trade.entry - livePrice);
  };

  const winPercentage = useMemo(() => 
    accuracy.total > 0 ? ((accuracy.wins / accuracy.total) * 100).toFixed(1) : "0.0", 
  [accuracy]);

  useEffect(() => {
    let ws;
    let isMounted = true;

    const prefillHistory = async () => {
      try {
        const response = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=1m&limit=30`
        );
        const data = await response.json();
        const history = data.map(d => ({
          open: parseFloat(d[1]), high: parseFloat(d[2]), low: parseFloat(d[3]), close: parseFloat(d[4])
        }));
        if (isMounted) {
          setCandleHistory(history);
          setIsSyncing(false);
        }
      } catch (err) {
        console.error("History Fetch Error:", err);
      }
    };

    const connect = () => {
      prefillHistory();
      const wsUrl = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_1m`;
      ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onmessage = (event) => {
        if (!isMounted) return;
        const data = JSON.parse(event.data);
        const k = data.k;
        const price = parseFloat(k.c);
        setLivePrice(price);

        const currentCandle = { open: parseFloat(k.o), high: parseFloat(k.h), low: parseFloat(k.l), close: price };
        
        setCandleHistory((prev) => {
          const analysisData = [...prev, currentCandle];
          if (analysisData.length >= 30) {
            const verdict = getMarketPrediction(analysisData);
            if (verdict) setPrediction(verdict);
          }
          return k.x ? [...prev, currentCandle].slice(-30) : prev;
        });
      };
    };

    connect();
    return () => {
      isMounted = false;
      if (ws && ws.readyState === WebSocket.OPEN) ws.close();
    };
  }, [symbol]);

  useEffect(() => {
    if (tradeHistory.length > 0) {
      const latestTrade = tradeHistory[0];
      const pl = calculatePL(latestTrade);
      if (Math.abs(pl) > 15 || (Date.now() - latestTrade.id > 600000)) {
        setAccuracy(prev => {
          const isWin = (latestTrade.type === 'PURCHASE' && pl > 0) || (latestTrade.type === 'SELL' && pl > 0);
          return { wins: isWin ? prev.wins + 1 : prev.wins, total: prev.total + 1 };
        });
      }
    }
  }, [livePrice]);

  useEffect(() => {
    if (prediction.confidence?.includes("High") && prediction.signal !== "WAIT") {
      setTradeHistory(prev => {
        const isDuplicate = prev[0]?.pattern === prediction.name && Math.abs(prev[0]?.entry - livePrice) < 5;
        if (isDuplicate) return prev;
        return [{ id: Date.now(), type: prediction.signal, entry: livePrice, pattern: prediction.name }, ...prev].slice(0, 5);
      });
    }
  }, [prediction.name, prediction.confidence]);

  return (
    <div className="h-screen bg-slate-950 text-white flex overflow-hidden">
      <Sidebar />
      <main className="flex-1 p-8 flex flex-col min-w-0">
        <header className="flex justify-between items-center mb-6 flex-none">
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase">{symbol}</h1>
            <p className="text-slate-500 flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
              <ShieldCheck size={14} className="text-blue-500" /> 
              {isSyncing ? "Establishing Trend Context..." : "30-Candle Verification Active"}
            </p>
          </div>
          <div className="text-right">
             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live Price (₹)</span>
             <p className="text-3xl font-mono font-bold text-blue-500">{formatINR(livePrice)}</p>
          </div>
        </header>

        {/* Main Grid: min-h-0 and overflow-hidden lock the chart size */}
        <div className="grid grid-cols-12 gap-6 flex-1 min-h-0 overflow-hidden">
          
          {/* Chart Container: Fixed and non-growing */}
          <div className="col-span-9 bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden relative h-full">
            <iframe 
              src={`https://s.tradingview.com/widgetembed/?symbol=BINANCE:${symbol}&interval=1&theme=dark`} 
              className="w-full h-full border-none" 
              title="Market Chart" 
            />
            {isSyncing && (
              <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Pre-filling History Buffer</p>
              </div>
            )}
          </div>

          {/* Sidebar Panel: Independently scrollable with the thin blue bar */}
          <div className="col-span-3 flex flex-col space-y-4 overflow-y-auto pr-2 custom-scrollbar h-full">
            
            {/* Accuracy Meter: flex-none prevents squishing */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex-none shadow-2xl relative overflow-hidden">
               <div className="absolute -right-4 -top-4 w-20 h-20 bg-blue-500/10 blur-3xl" />
               <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Signal Accuracy</h3>
                  <Zap size={14} className="text-yellow-500 fill-yellow-500" />
               </div>
               <div className="flex items-end gap-2 mb-4">
                  <span className="text-5xl font-black tracking-tighter">{winPercentage}%</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase pb-1">Win Rate</span>
               </div>
               <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${winPercentage}%` }} />
               </div>
            </div>

            {/* Forecast Panel */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex-1 flex flex-col shadow-2xl min-h-[500px]">
              <div className="mb-4 flex-none">
                <div className="flex items-center justify-between mb-4">
                   <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Forecast</h3>
                   <Activity size={14} className="text-blue-500 animate-pulse" />
                </div>
                <div className={`text-2xl font-black leading-tight ${prediction.color}`}>{prediction.name}</div>
                <div className="mt-1 text-[10px] font-bold text-blue-400 uppercase tracking-widest">{prediction.confidence} Reversal</div>
              </div>

              <div className="flex flex-col items-center justify-center py-4 border-y border-slate-800/50 mb-4 flex-none text-center">
                 <div className={`text-6xl font-black mb-1 ${prediction.color}`}>
                   {prediction.signal === 'PURCHASE' ? 'UP' : prediction.signal === 'SELL' ? 'DOWN' : '--'}
                 </div>
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-tight">
                   Next 10-Candle Path: {prediction.prediction}
                 </span>
              </div>

              <div className="mb-6 flex-none">
                <div className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase mb-3 tracking-widest">
                  <span>Forecast Path</span>
                  <FastForward size={12} />
                </div>
                <div className="flex gap-1 h-10">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className={`flex-1 rounded-sm transition-all ${
                      prediction.signal === 'PURCHASE' ? 'bg-green-500' : 
                      prediction.signal === 'SELL' ? 'bg-red-500' : 'bg-slate-800'
                    }`} style={{ opacity: 1 - (i * 0.08) }} />
                  ))}
                </div>
              </div>

              {/* Performance Log Container: Scrollable internally */}
              <div className="flex-1 min-h-0 overflow-y-auto mb-4 border-t border-slate-800 pt-4 custom-scrollbar pr-1">
                <div className="flex items-center justify-between text-[9px] font-black text-slate-500 uppercase mb-2 sticky top-0 bg-slate-900 py-1">
                    <span>Performance Log</span>
                    <History size={10} />
                </div>
                <div className="space-y-2">
                  {tradeHistory.map(trade => {
                    const pl = calculatePL(trade);
                    return (
                      <div key={trade.id} className="p-2 bg-slate-950/50 border border-slate-800 rounded-lg flex justify-between animate-in slide-in-from-right-2">
                        <span className="text-[9px] font-bold text-white leading-none">{trade.pattern}</span>
                        <span className={`text-[9px] font-mono font-bold ${pl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {formatINR(pl)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button className={`w-full py-4 rounded-2xl font-black text-sm transition-all flex-none active:scale-95 shadow-2xl ${
                prediction.signal === 'PURCHASE' ? 'bg-green-600' : 
                prediction.signal === 'SELL' ? 'bg-red-600' : 'bg-slate-800'
              }`}>
                {prediction.signal !== 'WAIT' ? `EXECUTE ${prediction.signal}` : 'SCANNING TREND'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}