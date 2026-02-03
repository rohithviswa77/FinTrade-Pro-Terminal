import React, { useState } from 'react';
import { Search, Globe } from 'lucide-react';

export default function Header({ onSearch, currentSymbol }) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query) onSearch(query.toUpperCase());
  };

  return (
    <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-900/30 backdrop-blur-md">
      <div className="flex items-center space-x-6">
        <h1 className="text-xl font-bold tracking-tight text-white">
          FinTrade <span className="text-blue-500">Terminal</span>
        </h1>
        {/* Search Bar */}
        <form onSubmit={handleSubmit} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text"
            placeholder="Search e.g. BTCUSDT"
            className="bg-slate-800 border border-slate-700 text-sm text-white rounded-full pl-10 pr-4 py-2 w-64 focus:ring-2 focus:ring-blue-500 outline-none"
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>
      </div>

      <div className="flex items-center space-x-4">
        <div className="text-right mr-4">
          <p className="text-xs text-slate-500 uppercase font-bold">Current Asset</p>
          <p className="text-sm text-white font-mono">{currentSymbol || "Select Asset"}</p>
        </div>
        <div className="flex items-center space-x-2 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Live</span>
        </div>
      </div>
    </header>
  );
}