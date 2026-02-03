import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { auth } from '../firebase/config';
import { LogOut, Activity, LayoutDashboard, LineChart, Settings, ShieldCheck } from 'lucide-react';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  // Improved helper for accurate route highlighting
  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    // Matches the base path (e.g., /trade or /settings) even with sub-routes
    return location.pathname.startsWith(path);
  };

  const menuItems = [
    { 
      name: 'Dashboard', 
      icon: LayoutDashboard, 
      path: '/' 
    },
    { 
      name: 'Trade Terminal', 
      icon: LineChart, 
      // Simplified: If on a trade page, stay there; otherwise default to BTCUSDT
      path: location.pathname.startsWith('/trade') ? location.pathname : '/trade/BTCUSDT' 
    },
    { 
      name: 'Settings', 
      icon: Settings, 
      path: '/settings' // Straightforward path to fix the opening issue
    },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 flex flex-col py-8 bg-slate-950 sticky top-0 h-screen z-50">
      {/* Brand Header */}
      <Link to="/" className="px-6 mb-10 flex items-center gap-3 group">
        <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-900/40 group-hover:scale-110 transition-transform">
          <Activity className="text-white" size={24} />
        </div>
        <div>
          <span className="text-xl font-black tracking-tighter text-white block leading-none">FinTrade</span>
          <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Pro Terminal</span>
        </div>
      </Link>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all group ${
                active 
                  ? 'bg-blue-600/10 text-blue-500 shadow-sm' 
                  : 'text-slate-500 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-4">
                <item.icon size={20} className={active ? 'text-blue-500' : 'text-slate-500 group-hover:text-slate-200'} />
                <span className="text-sm">{item.name}</span>
              </div>
              {/* Pulse indicator for the active trading session */}
              {active && item.name === 'Trade Terminal' && (
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Pattern Engine Status Card */}
      <div className="px-6 mb-6">
        <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-800">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={14} className="text-green-500" />
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">Verification Active</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-tight">Scanning 38 Groww-standard patterns.</p>
        </div>
      </div>

      {/* Logout Action */}
      <div className="px-4 pt-6 border-t border-slate-900">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-slate-500 hover:bg-red-500/10 hover:text-red-500 transition-all group font-bold"
        >
          <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}