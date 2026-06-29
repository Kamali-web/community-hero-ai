/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Award, Medal, Sparkles, TrendingUp, CheckCircle, ShieldAlert } from 'lucide-react';
import { Citizen } from '../types';

interface LeaderboardViewProps {
  citizens: Citizen[];
}

export default function LeaderboardView({ citizens }: LeaderboardViewProps) {
  // Sort citizens descending by points
  const rankedCitizens = [...citizens].sort((a, b) => b.points - a.points);

  const getRankBadge = (index: number) => {
    switch (index) {
      case 0: return <Medal className="w-5 h-5 text-yellow-500" />;
      case 1: return <Medal className="w-5 h-5 text-slate-400" />;
      case 2: return <Medal className="w-5 h-5 text-amber-700" />;
      default: return <span className="font-mono text-gray-500 font-bold text-sm w-5 text-center">#{index + 1}</span>;
    }
  };

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'Civic Hero': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'Local Watcher': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'Community Guardian': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default: return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      
      {/* Title */}
      <div>
        <h2 className="font-display font-bold text-3xl text-white text-center">Civic Hero Leaderboard</h2>
        <p className="text-xs text-gray-400 font-mono tracking-wide text-center uppercase mt-1">CROWDSOURCED VERIFICATIONS & COMMITTED INCIDENT DETECTORS</p>
      </div>

      {/* Info Promo banner */}
      <div className="glass p-5 rounded-2xl border border-white/5 space-y-2 bg-gradient-to-r from-brand-primary/5 to-transparent text-center max-w-2xl mx-auto">
        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-white">
          <Sparkles className="w-4 h-4 text-brand-primary animate-pulse" />
          <span>Contribute, Earn, and Reward Aegis City</span>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed max-w-md mx-auto">
          Every verified complaint, status validation, and comment upvote logs Hero Points on your municipal ledger. Top citizens earn transit credits and community honor rolls.
        </p>
      </div>

      {/* Ranked Feed list */}
      <div className="glass rounded-3xl border border-white/5 overflow-hidden">
        <div className="bg-slate-900/60 p-4 border-b border-white/5 flex items-center justify-between text-xs text-gray-500 font-mono">
          <span>CIVIC OPERATOR RANKINGS</span>
          <span>COMPOSITE SCORE</span>
        </div>

        <div className="divide-y divide-white/5">
          {rankedCitizens.map((citizen, index) => (
            <div 
              key={citizen.id} 
              className={`p-4 sm:p-5 flex items-center justify-between gap-4 transition-all hover:bg-white/[0.02] ${
                index === 0 ? 'bg-brand-primary/5' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Ranking Medals */}
                <div className="w-8 flex justify-center">
                  {getRankBadge(index)}
                </div>

                {/* Avatar */}
                <img 
                  src={citizen.avatar} 
                  alt={citizen.name} 
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl object-cover border border-white/10" 
                />

                {/* Name & Badges */}
                <div className="space-y-1">
                  <h4 className="font-display font-bold text-sm sm:text-base text-white flex items-center gap-2">
                    {citizen.name}
                    {index === 0 && <span className="text-[10px] bg-brand-primary/20 text-brand-primary font-bold px-1.5 py-0.5 rounded-full font-mono uppercase">Top Hero</span>}
                  </h4>
                  
                  {/* Badges */}
                  <div className="flex flex-wrap gap-1">
                    {citizen.badges.map((badge) => (
                      <span 
                        key={badge} 
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${getBadgeColor(badge)}`}
                      >
                        {badge.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Score HUD */}
              <div className="text-right">
                <span className="text-[10px] text-gray-500 font-mono uppercase block">Hero Points</span>
                <span className="text-sm sm:text-lg font-bold font-mono text-white text-glow">{citizen.points}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Milestones explanation */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
        <div className="p-4 bg-slate-900/40 border border-white/5 rounded-xl space-y-1 text-center">
          <Medal className="w-5 h-5 text-yellow-500 mx-auto" />
          <h5 className="text-xs font-bold text-white">500 PTS: Eco-Transit Pass</h5>
          <p className="text-[10px] text-gray-400">Unlock free light-rail passes for the upcoming month.</p>
        </div>
        <div className="p-4 bg-slate-900/40 border border-white/5 rounded-xl space-y-1 text-center">
           Medals: <Medal className="w-5 h-5 text-slate-400 mx-auto" />
          <h5 className="text-xs font-bold text-white">1,500 PTS: Parking Waiver</h5>
          <p className="text-[10px] text-gray-400">Unlock 30 hours of complimentary municipal zone parking.</p>
        </div>
        <div className="p-4 bg-slate-900/40 border border-white/5 rounded-xl space-y-1 text-center">
          <Medal className="w-5 h-5 text-amber-700 mx-auto" />
          <h5 className="text-xs font-bold text-white">3,000 PTS: Tree Dedication</h5>
          <p className="text-[10px] text-gray-400">Sponsor and name a maple tree planted in Aegis Park.</p>
        </div>
      </div>

    </div>
  );
}
