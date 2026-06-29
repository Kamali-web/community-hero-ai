/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Cpu, Heart, CheckCircle2, TrendingUp, Sparkles, Users, ArrowRight } from 'lucide-react';
import AuthView from './AuthView';

interface LandingViewProps {
  setCurrentTab: (tab: string) => void;
  kpiStats: any;
  isGuest?: boolean;
  onAuthSuccess?: (user: any) => void;
  onGoToAuth?: () => void;
}

export default function LandingView({ setCurrentTab, kpiStats, isGuest = false, onAuthSuccess, onGoToAuth }: LandingViewProps) {
  const stats = [
    { label: 'Active Reports', value: kpiStats.activeReports, icon: ShieldAlert, color: 'text-brand-warning bg-brand-warning/10' },
    { label: 'Resolved Issues', value: kpiStats.resolvedIssues, icon: CheckCircle2, color: 'text-indigo-400 bg-indigo-400/10' },
    { label: 'Estimated Citizens Benefited', value: kpiStats.citizensBenefited, icon: Users, color: 'text-brand-primary bg-brand-primary/10' },
    { label: 'Water Saved (Liters)', value: kpiStats.waterSavedLiters, icon: TrendingUp, color: 'text-cyan-400 bg-cyan-400/10' }
  ];

  const agents = [
    {
      name: 'Instant Sorting AI',
      desc: 'Instantly groups reports by category, estimates danger levels, and alerts the correct municipal department.',
      tag: 'Agent 1'
    },
    {
      name: 'Report Checker AI',
      desc: 'Looks at photos and description details to filter out duplicate, spam, or fake complaints.',
      tag: 'Agent 2'
    },
    {
      name: 'Safety Level AI',
      desc: 'Scores importance based on proximity to schools, hospitals, residential population, and busy roads.',
      tag: 'Agent 3'
    },
    {
      name: 'Future Warning AI',
      desc: 'Predicts major water leaks, road cracks, and street lights failure before they physically happen.',
      tag: 'Agent 4'
    },
    {
      name: 'Resolution Guard AI',
      desc: 'Keeps an eye on delayed complaints and reminds senior officers to solve them quickly.',
      tag: 'Agent 5'
    }
  ];

  const handleTabNavigation = (tab: string) => {
    if (isGuest) {
      if (onGoToAuth) {
        onGoToAuth();
      }
    } else {
      setCurrentTab(tab);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-24">
      {/* Hero Section */}
      <section className="py-12 relative flex flex-col items-center text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10 animate-pulse duration-5000" />
        
        {/* Centered Pill Badge */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/15 border border-indigo-500/30 rounded-full text-xs text-indigo-400 font-semibold font-mono mb-6"
        >
          <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
          <span>Aegis Shield AI 1.0 is live</span>
        </motion.div>

        {/* High-Impact Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="text-indigo-400 font-mono text-xs sm:text-sm tracking-[0.25em] uppercase font-bold mb-6"
        >
          Predict. Prioritize. Resolve.
        </motion.div>

        {/* High-Impact Main Title */}
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="font-display font-black text-4xl sm:text-5xl md:text-6xl tracking-tight leading-[1.15] max-w-5xl mx-auto text-white"
        >
          Your community becomes a <br />
          <span className="text-indigo-400 text-glow inline-block mt-3 font-black">living sanctuary.</span>
        </motion.h1>

        {/* Clean, descriptive subtitle */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-slate-400 text-sm sm:text-base md:text-lg max-w-3xl mx-auto leading-relaxed mt-6"
        >
          Citizens don't need another unresolved complaint list. You need an active system that directly monitors street health, estimates road and surface repairs with AI, and visualizes civic growth through a digital twin map.
        </motion.p>

        {/* Hero Actions */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-4 pt-8"
        >
          <button 
            onClick={() => handleTabNavigation('report')}
            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 hover:scale-[1.02] flex items-center gap-2 cursor-pointer border border-indigo-400/20"
          >
            Enter Citizen Hub
            <ArrowRight className="w-4 h-4" />
          </button>
          <button 
            onClick={() => handleTabNavigation(isGuest ? 'auth' : 'citizen-dashboard')}
            className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl border border-white/10 hover:border-indigo-500/30 transition-all cursor-pointer"
          >
            Explore Dashboard
          </button>
        </motion.div>
      </section>

      {/* Live Statistics Counter */}
      <section className="space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <h2 className="font-display font-bold text-2xl tracking-wide text-white">Live Ward Safety Stats</h2>
          <p className="text-xs text-gray-400 font-mono">REAL-TIME REPORT DATA UPDATED SECONDS AGO</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="glass p-6 rounded-2xl flex items-center gap-4 border border-white/5 hover:border-brand-primary/20 transition-all"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-white">{stat.value}</div>
                  <div className="text-xs text-gray-400">{stat.label}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Multi-Agent Civic AI Architecture */}
      <section className="space-y-12">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="px-3 py-1 bg-brand-primary/10 rounded-full text-[10px] font-mono text-brand-primary border border-brand-primary/20">AGENT COORDINATION</div>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-white">Autonomous Civic Intelligence Agents</h2>
          <p className="text-gray-400 max-w-xl text-sm leading-relaxed">
            Five synchronized AI agents collaborate in the background to streamline classification, verify integrity, measure urban hazard priority, and predict service breakdowns.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent, idx) => (
            <motion.div
              key={agent.name}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className="glass p-6 rounded-2xl relative overflow-hidden group hover:border-brand-secondary/30 transition-all border border-white/5"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-bl-full -z-10 group-hover:bg-brand-primary/10 transition-colors" />
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono font-bold text-brand-primary bg-brand-primary/10 border border-brand-primary/20 px-2.5 py-0.5 rounded-full">{agent.tag}</span>
                <Cpu className="w-4 h-4 text-brand-secondary" />
              </div>
              <h3 className="font-display font-semibold text-lg text-white mb-2">{agent.name}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{agent.desc}</p>
            </motion.div>
          ))}
          
          {/* Sixth CTA Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-gradient-to-br from-brand-primary/10 via-brand-secondary/10 to-transparent p-6 rounded-2xl border border-brand-primary/20 flex flex-col justify-between"
          >
            <div>
              <Cpu className="w-8 h-8 text-brand-primary mb-3 glow-primary" />
              <h3 className="font-display font-semibold text-lg text-white mb-2">Interactive Ward Map</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Explore live local roads, street lights, and pipe conditions on our interactive map to prevent future hazards.
              </p>
            </div>
            <button 
              onClick={() => handleTabNavigation('twin')}
              className="mt-6 flex items-center justify-center gap-1 text-xs font-semibold text-brand-primary hover:text-brand-secondary group transition-all cursor-pointer"
            >
              View Interactive Map
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Community Health Overview Teaser */}
      <section className="glass rounded-3xl p-8 sm:p-12 border border-white/10 relative overflow-hidden">
        <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-brand-secondary/10 rounded-full blur-3xl -z-10 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <span className="text-[10px] font-mono bg-cyan-400/15 text-cyan-400 border border-cyan-400/25 px-2.5 py-1 rounded-full uppercase tracking-wider">COMMUNITY HEALTH</span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white">How Community Safety is Scored</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Our unique **Community Safety score ({kpiStats.communityHealthScore}/100)** is calculated by combining active street issues, how fast they are solved, citizen happiness, and smart city sensors across five key areas.
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 text-xs text-gray-300">
                <CheckCircle2 className="w-4 h-4 text-brand-success" />
                <span>Road Safety and Quality Index: <strong className="text-white font-mono">{kpiStats.infrastructureScores.roads}%</strong></span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-300">
                <CheckCircle2 className="w-4 h-4 text-brand-success" />
                <span>Water Pipe Integrity Score: <strong className="text-white font-mono">{kpiStats.infrastructureScores.water}%</strong></span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-300">
                <CheckCircle2 className="w-4 h-4 text-brand-success" />
                <span>Clean streets and Garbage Clearance Rate: <strong className="text-white font-mono">{kpiStats.infrastructureScores.waste}%</strong></span>
              </div>
            </div>
            <button 
              onClick={() => handleTabNavigation('twin')}
              className="px-5 py-2.5 bg-slate-900 border border-white/10 hover:border-brand-primary/30 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all mt-4 cursor-pointer"
            >
              Explore Ward Areas
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="relative bg-slate-950 rounded-2xl border border-white/5 p-6 space-y-6 h-full flex flex-col justify-center">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-gray-400">CITIZEN SATISFACTION LEVEL</span>
                <span className="text-brand-success">94% POSITIVE</span>
              </div>
              <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                <div className="bg-brand-success h-full" style={{ width: '94%' }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-gray-400">AVERAGE TIME TO SOLVE PROBLEMS</span>
                <span className="text-cyan-400">18.4 HOURS</span>
              </div>
              <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                <div className="bg-cyan-400 h-full" style={{ width: '82%' }} />
              </div>
            </div>
            <div className="p-4 bg-slate-900/50 rounded-xl border border-white/5 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                <Sparkles className="w-3.5 h-3.5 text-brand-primary" />
                <span>Today's Intelligent Insights</span>
              </div>
              <p className="text-[11px] text-gray-400 leading-snug">
                Resolving the water pipeline burst on Oakwood Avenue is estimated to trigger a +4.2% spike in the city's clean water distribution index.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Testimonial Section */}
      <section className="space-y-8">
        <h2 className="font-display font-bold text-2xl text-center text-white">Aegis Citizens in Action</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass p-6 rounded-2xl border border-white/5 relative">
            <p className="text-gray-300 italic text-sm leading-relaxed mb-4">
              "Being able to take a picture of a street leak, see the AI immediate diagnose the problem, calculate the water volume being wasted, and route it instantly is like holding the keys to the city. I've gained 1,250 points and verified 45 other hazards!"
            </p>
            <div className="flex items-center gap-3">
              <img 
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80" 
                alt="Sarah Jenkins" 
                className="w-10 h-10 rounded-full border border-brand-primary" 
              />
              <div>
                <h4 className="text-xs font-bold text-white">Sarah Jenkins</h4>
                <p className="text-[10px] text-gray-400">Ward 4 Watch Captain (Level 5 Hero)</p>
              </div>
            </div>
          </div>

          <div className="glass p-6 rounded-2xl border border-white/5 relative">
            <p className="text-gray-300 italic text-sm leading-relaxed mb-4">
              "CivicGPT saved us hours. We typed 'Predict infrastructure failures' and it mapped which valves were showing high moisture/pressure. We proactive repaired them before the street flooded. A complete paradigm shift in municipal governance."
            </p>
            <div className="flex items-center gap-3">
              <img 
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=80&q=80" 
                alt="Director Davis" 
                className="w-10 h-10 rounded-full border border-brand-secondary" 
              />
              <div>
                <h4 className="text-xs font-bold text-white">Director Davis</h4>
                <p className="text-[10px] text-gray-400">Aegis Public Works Department</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-12 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-gray-500">
        <div>
          <span className="font-display font-semibold text-white">COMMUNITY HERO AI</span> © 2026. Made with Google GenAI.
        </div>
        <div className="flex gap-4">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Developer API</a>
          <a href="#" className="hover:text-white transition-colors">Municipal Dashboard</a>
        </div>
      </footer>
    </div>
  );
}
