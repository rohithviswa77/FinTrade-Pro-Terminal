import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import SimulationChart from '../components/SimulationChart';
import { Play, Zap, RefreshCw, ArrowRightCircle, Binary, BrainCircuit } from 'lucide-react';

export default function Simulation() {
  const [data, setData] = useState([]);
  const [prediction, setPrediction] = useState({ name: "SCANNING", similarity: 0, targetPrice: 0 });
  const [currentPatternIndex, setCurrentPatternIndex] = useState(0);
  const [showFull, setShowFull] = useState(false);

  const PATTERN_TYPES = [
    "BULL_FLAG", "DOUBLE_TOP", "HEAD_AND_SHOULDERS", "CUP_AND_HANDLE", 
    "ASCENDING_TRIANGLE", "DESCENDING_TRIANGLE", "FALLING_WEDGE", "RISING_WEDGE",
    "DOUBLE_BOTTOM", "INVERSE_H_S", "BULL_PENNANT", "BEAR_PENNANT"
  ];

  // Logic to generate the dummy stock data remains the same
  const generateData = (type, isFull) => {
    let points = [];
    let price = 100;
    const vol = 2.5; 

    if (type === 'BULL_FLAG') {
      for (let i = 0; i < 40; i++) { price += (vol + Math.random()); points.push({close: price}); } 
      if (isFull) for (let i = 0; i < 40; i++) { price -= (vol * 0.2 + Math.random() * 0.1); points.push({close: price}); }
    } 
    else if (type === 'DOUBLE_TOP') {
      for (let i = 0; i < 20; i++) { price += vol * 1.5; points.push({close: price}); }
      for (let i = 0; i < 20; i++) { price -= vol; points.push({close: price}); } 
      if (isFull) {
        for (let i = 0; i < 20; i++) { price += vol * 1.2; points.push({close: price}); }
        for (let i = 0; i < 20; i++) { price -= vol * 2; points.push({close: price}); }
      }
    }
    else if (type === 'DESCENDING_TRIANGLE') {
      const floor = 100;
      const segments = isFull ? 80 : 40;
      for (let i = 0; i < segments; i++) {
        price = floor + (Math.random() * (80 - i) * (vol * 0.5));
        points.push({close: price});
      }
    }
    else {
      for (let i = 0; i < (isFull ? 80 : 40); i++) {
        price += (Math.random() - 0.5) * vol;
        points.push({close: price});
      }
    }

    const formatted = points.map(p => ({
      open: p.close + (Math.random() - 0.5),
      high: p.close + Math.random() + 0.2,
      low: p.close - Math.random() - 0.2,
      close: p.close,
      v: 500
    }));

    while (formatted.length < 120) {
      const base = formatted[0]?.open || 100;
      const jitter = (Math.random() - 0.5) * 0.5;
      formatted.unshift({
        open: base + jitter,
        high: base + jitter + 0.3,
        low: base + jitter - 0.3,
        close: base + jitter,
        v: 100
      });
    }
    return formatted;
  };

  const handleNextPattern = () => {
    const nextIdx = (currentPatternIndex + 1) % PATTERN_TYPES.length;
    setCurrentPatternIndex(nextIdx);
    setShowFull(false);
    const newData = generateData(PATTERN_TYPES[nextIdx], false);
    setData(newData);
    runAI(newData);
  };

  const runAI = async (ohlc) => {
    try {
      const response = await fetch('http://localhost:5001/analyze-structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ohlc })
      });
      const result = await response.json();
      setPrediction(result);
    } catch (err) { 
      setPrediction({ name: "OFFLINE", similarity: 0, targetPrice: 0 });
    }
  };

  const revealFull = () => {
    setShowFull(true);
    const fullData = generateData(PATTERN_TYPES[currentPatternIndex], true);
    setData(fullData);
    runAI(fullData);
  };

  useEffect(() => {
    const initial = generateData(PATTERN_TYPES[0], false);
    setData(initial);
    runAI(initial);
  }, []);

  return (
    <div className="h-screen bg-[#060709] text-white flex overflow-hidden font-sans">
      <Sidebar />
      <main className="flex-1 p-8 flex flex-col gap-6">
        
        <div className="bg-[#0b0e11] p-8 rounded-[32px] border border-white/5 flex justify-between items-center shadow-2xl">
          <div className="flex items-center gap-6">
            <div className="bg-blue-600/20 p-4 rounded-2xl border border-blue-500/20">
               <BrainCircuit className="text-blue-500" size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-black italic uppercase tracking-tighter text-white">Simulation Lab</h1>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-1 italic">
                {PATTERN_TYPES[currentPatternIndex].replace('_', ' ')} DNA Scan
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <button onClick={handleNextPattern} className="flex items-center gap-2 bg-[#1e222d] hover:bg-[#2a2f3e] px-6 py-3 rounded-xl font-black uppercase text-[10px] transition-all border border-white/5">
              <ArrowRightCircle size={14} /> Next Pattern
            </button>
            <button onClick={revealFull} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-black uppercase text-[10px] transition-all shadow-lg shadow-blue-500/20">
              <Zap size={14} /> Complete & Confirm
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
          <div className="lg:col-span-3 bg-[#0b0e11] rounded-[32px] border border-white/5 p-8 relative overflow-hidden">
             <div className="absolute top-8 right-8 z-10 flex flex-col items-end gap-2">
                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${showFull ? 'bg-green-600' : 'bg-orange-600 shadow-[0_0_10px_rgba(234,88,12,0.4)]'}`}>
                    {showFull ? 'Confirmed' : 'Half Pattern Mode'}
                </span>
                
                {/* REVEAL REAL NAME ON CONFIRM */}
                {showFull && (
                  <div className="bg-white/10 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl animate-in fade-in slide-in-from-top-2">
                    <p className="text-[7px] text-slate-400 uppercase font-black tracking-widest">Real Geometry</p>
                    <p className="text-xs font-black text-blue-400 uppercase">
                      {PATTERN_TYPES[currentPatternIndex].replace('_', ' ')}
                    </p>
                  </div>
                )}
             </div>
             <SimulationChart data={data} />
          </div>

          <div className="flex flex-col gap-6">
            <div className={`rounded-[32px] border p-8 flex-1 flex flex-col justify-center text-center transition-all duration-500 ${prediction.similarity > 50 ? 'bg-blue-600/10 border-blue-500/30' : 'bg-[#0b0e11] border-white/5'}`}>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 italic">Brain Verdict</p>
                
                {/* Name logic: Only mention the name if > 50% */}
                <h2 className="text-3xl font-black text-white uppercase mb-2 leading-none">
                  {prediction.similarity > 50 ? prediction.name : "IDENTIFYING..."}
                </h2>
                
                <div className={`text-5xl font-black mb-6 font-mono ${prediction.similarity > 50 ? 'text-blue-500' : 'text-slate-600'}`}>
                    {prediction.similarity}%
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 transition-all duration-1000" style={{width: `${prediction.similarity}%`}} />
                </div>
            </div>

            <div className="bg-blue-600/5 border border-blue-500/20 rounded-[32px] p-6 text-center">
                <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1 italic">Target Estimate</p>
                <p className="text-2xl font-mono font-black text-white">${prediction.targetPrice || '0.00'}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}