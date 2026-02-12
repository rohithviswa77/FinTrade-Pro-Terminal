import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { auth } from '../firebase/config';
import { LogOut, Activity, LayoutDashboard, LineChart, Settings, ShieldCheck, Zap, FlaskConical } from 'lucide-react';

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

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
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
      path: location.pathname.startsWith('/trade') ? location.pathname : '/trade/BTCUSDT' 
    },
    { 
      name: 'Simulation Lab', 
      icon: FlaskConical, 
      path: '/simulation' 
    },
    { 
      name: 'Settings', 
      icon: Settings, 
      path: '/settings' 
    },
  ];

  return (
    <aside className="w-64 border-r border-white/5 flex flex-col py-8 bg-[#060709] sticky top-0 h-screen z-50 shadow-2xl">
      {/* Institutional Brand Header */}
      <Link to="/" className="px-6 mb-10 flex items-center gap-3 group">
        <div className="bg-blue-600 p-2 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.3)] group-hover:scale-110 transition-transform duration-500">
          <Activity className="text-white" size={24} />
        </div>
        <div>
          <span className="text-xl font-black tracking-tighter text-white block leading-none">FinTrade</span>
          <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1 block">MD5 Master Terminal</span>
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
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-black transition-all group ${
                active 
                  ? 'bg-blue-600/10 text-blue-500 border border-blue-500/10' 
                  : 'text-slate-500 hover:bg-[#1e222d] hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-4">
                <item.icon size={18} className={active ? 'text-blue-500' : 'text-slate-500 group-hover:text-slate-200'} />
                <span className="text-[13px] tracking-tight">{item.name}</span>
              </div>
              
              {/* Dynamic Session Indicators for Lab and Trade Terminal */}
              {active && (item.name === 'Trade Terminal' || item.name === 'Simulation Lab') && (
                <div className="flex gap-1">
                   <div className={`w-1.5 h-1.5 ${item.name === 'Simulation Lab' ? 'bg-purple-500' : 'bg-blue-500'} rounded-full animate-ping`} />
                   <div className={`w-1.5 h-1.5 ${item.name === 'Simulation Lab' ? 'bg-purple-500' : 'bg-blue-500'} rounded-full`} />
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Institutional Engine Status */}
      <div className="px-4 mb-6">
        <div className="bg-[#1e222d] rounded-3xl p-5 border border-white/5 shadow-inner relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2">
            <Zap size={12} className="text-blue-500/30 group-hover:text-blue-500 transition-colors" />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck size={14} className="text-green-500" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">MD5 Engine Active</span>
          </div>
          <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
            Scanning <span className="text-blue-500">200+ structural variants</span> on the 30M institutional interval.
          </p>
          <div className="mt-3 w-full h-1 bg-black rounded-full overflow-hidden">
             <div className="h-full bg-green-500 animate-pulse w-[85%]" />
          </div>
        </div>
      </div>

      {/* Logout Action */}
      <div className="px-4 pt-6 border-t border-white/5">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-slate-600 hover:bg-red-500/10 hover:text-red-500 transition-all group font-black"
        >
          <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[13px] tracking-tight">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}