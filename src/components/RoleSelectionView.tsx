/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldAlert, User, Landmark, ShieldCheck, Key, LogOut, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RoleSelectionViewProps {
  onSelectRole: (role: 'citizen' | 'authority' | 'child') => void;
  user: any;
  onSignOut: () => void;
}

export default function RoleSelectionView({ onSelectRole, user, onSignOut }: RoleSelectionViewProps) {
  const [showAuthCode, setShowAuthCode] = useState(false);
  const [authCode, setAuthCode] = useState('');
  const [codeError, setCodeError] = useState(false);

  const handleAuthoritySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authCode.trim().toUpperCase() === 'AEGIS100') {
      setCodeError(false);
      onSelectRole('authority');
    } else {
      setCodeError(true);
      setTimeout(() => setCodeError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-gray-100 flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Immersive Background Atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-slate-950 -z-10" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="w-full max-w-4xl space-y-8 z-10">
        
        {/* Top bar with sign out */}
        <div className="flex justify-between items-center bg-slate-900/40 border border-white/5 px-6 py-3 rounded-2xl backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-gray-400 font-mono">Logged in as <strong className="text-gray-200">{user.email}</strong></span>
          </div>
          <button 
            onClick={onSignOut}
            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>

        {/* Core Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 border border-indigo-500/20 rounded-2xl mb-2 text-indigo-400 glow-primary">
            <ShieldAlert className="w-10 h-10 text-white" />
          </div>
          <h2 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight">
            Choose Your Station
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto leading-relaxed">
            Aegis Smart City relies on specialized hubs. Select your profile role to receive a customized interface and security desk access.
          </p>
        </div>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Citizen */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="glass p-6 rounded-3xl border border-white/5 bg-slate-900/40 flex flex-col justify-between cursor-pointer hover:border-indigo-500/30 transition-all group relative overflow-hidden"
            onClick={() => onSelectRole('citizen')}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full pointer-events-none group-hover:bg-indigo-500/10 transition-colors" />
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <User className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display font-bold text-lg text-white">Active Citizen</h3>
                <span className="text-[10px] text-indigo-400 font-mono uppercase font-bold tracking-wide">Age 18+ Command Desk</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Report municipal issues, upvote neighborhood reports, chat with CivicGPT, and redeem points to raise organic virtual sanctuaries.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-white/5 text-right">
              <span className="text-xs font-bold text-indigo-400 group-hover:underline">Enter Desk &rarr;</span>
            </div>
          </motion.div>

          {/* Card 2: Authority */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="glass p-6 rounded-3xl border border-white/5 bg-slate-900/40 flex flex-col justify-between cursor-pointer hover:border-cyan-500/30 transition-all group relative overflow-hidden"
            onClick={() => setShowAuthCode(true)}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-bl-full pointer-events-none group-hover:bg-cyan-500/10 transition-colors" />
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Landmark className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display font-bold text-lg text-white">City Authority</h3>
                <span className="text-[10px] text-cyan-400 font-mono uppercase font-bold tracking-wide">Administrative Access</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Review automated AI hazard classifications, triage live community tickets, dispatch maintenance crews, and manage sensor predictions.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-white/5 text-right">
              <span className="text-xs font-bold text-cyan-400 group-hover:underline">Verify Credentials &rarr;</span>
            </div>
          </motion.div>

          {/* Card 3: Kid (Below 18) */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="glass p-6 rounded-3xl border border-white/5 bg-slate-900/40 flex flex-col justify-between cursor-pointer hover:border-yellow-500/30 transition-all group relative overflow-hidden"
            onClick={() => onSelectRole('child')}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-bl-full pointer-events-none group-hover:bg-yellow-500/10 transition-colors" />
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400">
                <Sparkles className="w-6 h-6 animate-spin" style={{ animationDuration: '6s' }} />
              </div>
              <div className="space-y-1">
                <h3 className="font-display font-bold text-lg text-white">Eco Junior Hero</h3>
                <span className="text-[10px] text-yellow-500 font-mono uppercase font-bold tracking-wide">Age under 18 Sanctuary</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Super gamified reporting workspace! Evolve custom Avengers or Magic Companions, win medals, and plant real forests by saving streets!
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-white/5 text-right">
              <span className="text-xs font-bold text-yellow-500 group-hover:underline">Spawn Sanctuary &rarr;</span>
            </div>
          </motion.div>

        </div>

        {/* Passcode Drawer Overlay */}
        <AnimatePresence>
          {showAuthCode && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{ scale: 0.95, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 10 }}
                className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 relative"
              >
                <div className="space-y-2 text-center">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mx-auto">
                    <Key className="w-6 h-6" />
                  </div>
                  <h3 className="font-display font-bold text-xl text-white">Authority Verification</h3>
                  <p className="text-xs text-slate-400">
                    Entering administrative dashboard requires a municipal security key.
                  </p>
                  <p className="text-[11px] bg-slate-950/80 border border-white/5 py-1.5 px-3 rounded-lg text-slate-500 font-mono">
                    💡 For testing/review: Use key <strong className="text-cyan-400">AEGIS100</strong>
                  </p>
                </div>

                <form onSubmit={handleAuthoritySubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase text-slate-400 block tracking-wider">MUNICIPAL PASSCODE</label>
                    <input 
                      type="password"
                      autoFocus
                      required
                      placeholder="Enter security passcode"
                      value={authCode}
                      onChange={(e) => setAuthCode(e.target.value)}
                      className={`w-full px-4 py-3 bg-slate-950/80 border text-center rounded-xl text-white tracking-widest outline-none transition-all font-mono uppercase ${
                        codeError ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-800 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10'
                      }`}
                    />
                  </div>

                  {codeError && (
                    <p className="text-center text-xs text-red-400 font-bold font-mono">❌ INVALID SECURITY TOKEN</p>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAuthCode(false);
                        setAuthCode('');
                      }}
                      className="flex-1 py-3 bg-slate-950 text-slate-400 border border-slate-800 hover:text-white rounded-xl text-xs font-bold transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-cyan-500/20"
                    >
                      Authenticate Desk
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
