import React, { useState } from 'react';
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../firebase/config";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Reset link sent! Please check your email inbox.");
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="bg-amber-600/20 p-3 rounded-full">
            <Mail className="text-amber-500" size={32} />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white text-center mb-4">Reset Password</h2>
        <p className="text-slate-400 text-center mb-8 text-sm">We will send a secure link to your email to reset your credentials.</p>
        <form onSubmit={handleReset} className="space-y-4">
          <input 
            type="email" 
            placeholder="Email Address"
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg">
            Send Reset Link
          </button>
        </form>
        <div className="mt-6 text-center">
          <Link to="/login" className="text-blue-500 hover:underline">Back to Sign In</Link>
        </div>
      </div>
    </div>
  );
}