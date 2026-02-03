import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { User, Shield, Bell, Moon, Globe, Save } from 'lucide-react';
import { auth } from '../firebase/config';

export default function Settings() {
  const [user] = useState(auth.currentUser);
  const [loading, setLoading] = useState(false);

  const handleSave = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      <Sidebar />
      <main className="flex-1 p-8 flex flex-col space-y-8 max-w-4xl">
        
        <header>
          <h1 className="text-4xl font-black tracking-tighter">Settings</h1>
          <p className="text-slate-500">Manage your FinTrade account and terminal preferences.</p>
        </header>

        <div className="space-y-6">
          {/* 1. Profile Section */}
          <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <User className="text-blue-500" size={20} />
              <h2 className="text-lg font-bold">Profile Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Email Address</label>
                <input 
                  type="text" 
                  disabled 
                  value={user?.email || "user@fintrade.com"} 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-400 cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Display Name</label>
                <input 
                  type="text" 
                  placeholder="Enter Name"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>
          </section>

          {/* 2. Preferences Section */}
          <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Globe className="text-blue-500" size={20} />
              <h2 className="text-lg font-bold">Terminal Preferences</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-600/10 rounded-lg text-blue-500"><Moon size={18} /></div>
                  <div>
                    <p className="font-bold text-sm">Dark Mode</p>
                    <p className="text-xs text-slate-500">Always active for professional terminals.</p>
                  </div>
                </div>
                <div className="w-12 h-6 bg-blue-600 rounded-full relative p-1 cursor-not-allowed">
                  <div className="w-4 h-4 bg-white rounded-full ml-auto shadow-sm" />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-600/10 rounded-lg text-blue-500"><Bell size={18} /></div>
                  <div>
                    <p className="font-bold text-sm">Pattern Alerts</p>
                    <p className="text-xs text-slate-500">Notify me when a High Confidence pattern is found.</p>
                  </div>
                </div>
                <div className="w-12 h-6 bg-slate-800 rounded-full relative p-1 cursor-pointer hover:bg-slate-700 transition-all">
                  <div className="w-4 h-4 bg-slate-400 rounded-full" />
                </div>
              </div>
            </div>
          </section>

          {/* 3. Security Section */}
          <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="text-red-500" size={20} />
              <h2 className="text-lg font-bold">Security</h2>
            </div>
            <button className="text-sm font-bold text-red-500 hover:bg-red-500/10 px-4 py-2 rounded-lg transition-all">
              Change Password
            </button>
          </section>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-xl shadow-blue-900/20 active:scale-95"
            >
              {loading ? "Saving..." : <><Save size={18} /> Save Changes</>}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}