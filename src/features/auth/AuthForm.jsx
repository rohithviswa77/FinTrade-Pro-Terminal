import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function AuthForm({ title, buttonText, onSubmit, showConfirmPassword = false }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (showConfirmPassword && password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    onSubmit(email, password);
  };

  return (
    <div className="w-full max-w-md bg-slate-900/50 border border-slate-800 p-8 rounded-2xl backdrop-blur-xl shadow-2xl">
      <h2 className="text-2xl font-bold text-white text-center mb-8">{title}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input 
          type="email" 
          placeholder="Email" 
          className="w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input 
          type="password" 
          placeholder="Password" 
          className="w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {showConfirmPassword && (
          <input 
            type="password" 
            placeholder="Confirm Password" 
            className="w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        )}
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all mt-4">
          {buttonText}
        </button>
      </form>
    </div>
  );
}