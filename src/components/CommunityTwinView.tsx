/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Cpu, Heart, CheckCircle2, TrendingUp, Sparkles, HelpCircle, Activity } from 'lucide-react';

interface CommunityTwinViewProps {
  kpiStats: any;
}

export default function CommunityTwinView({ kpiStats }: CommunityTwinViewProps) {
  // Sectoral scores
  const sectors = [
    { name: 'Roads & Asphalt Grid', score: kpiStats.infrastructureScores.roads, trend: '+2.1%', color: 'from-indigo-500 to-indigo-600', text: 'text-indigo-400' },
    { name: 'Water Leakage & Flow Valving', score: kpiStats.infrastructureScores.water, trend: '-0.8%', color: 'from-cyan-400 to-cyan-500', text: 'text-cyan-400' },
    { name: 'Waste Clearances & Sanitation', score: kpiStats.infrastructureScores.waste, trend: '+4.5%', color: 'from-emerald-400 to-emerald-500', text: 'text-emerald-400' },
    { name: 'Electric Grid & Public Lighting', score: kpiStats.infrastructureScores.lighting, trend: '+0.5%', color: 'from-amber-400 to-amber-500', text: 'text-amber-400' },
    { name: 'Pedestrian Crossing Safety', score: kpiStats.infrastructureScores.safety, trend: '+1.8%', color: 'from-rose-500 to-rose-600', text: 'text-rose-400' }
  ];

  // Ward analytical telemetry
  const wardGrid = [
    { id: 'W1', name: 'Ward 1 (Northern Suburbs)', active: 4, score: 92, risk: 'Low', response: '14.2 Hrs', density: 'Low' },
    { id: 'W2', name: 'Ward 2 (Hospital District)', active: 8, score: 85, risk: 'High', response: '19.5 Hrs', density: 'High' },
    { id: 'W3', name: 'Ward 3 (Central Business)', active: 3, score: 89, risk: 'Medium', response: '12.8 Hrs', density: 'Critical' },
    { id: 'W4', name: 'Ward 4 (Primary School Area)', active: 9, score: 81, risk: 'Critical', response: '22.4 Hrs', density: 'High' },
    { id: 'W5', name: 'Ward 5 (Market Street Sector)', active: 4, score: 79, risk: 'High', response: '24.8 Hrs', density: 'Critical' }
  ];

  // Past 6 months health tracking
  const healthHistory = [
    { month: 'Jan', Roads: 75, Water: 82, Waste: 70, Lighting: 88, HealthIndex: 78 },
    { month: 'Feb', Roads: 78, Water: 80, Waste: 72, Lighting: 89, HealthIndex: 80 },
    { month: 'Mar', Roads: 79, Water: 83, Waste: 74, Lighting: 91, HealthIndex: 81 },
    { month: 'Apr', Roads: 82, Water: 85, Waste: 75, Lighting: 90, HealthIndex: 83 },
    { month: 'May', Roads: 80, Water: 87, Waste: 78, Lighting: 92, HealthIndex: 85 },
    { month: 'Jun', Roads: 81, Water: 89, Waste: 79, Lighting: 92, HealthIndex: 88 }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-display font-bold text-3xl text-white">Community Digital Twin</h2>
          <p className="text-xs text-gray-400 font-mono tracking-wide">DIGITAL REPRESENTATION OF LOCAL SURFACES & STRUCTURES</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-white/5 rounded-xl text-xs font-mono">
          <Activity className="w-4 h-4 text-brand-primary animate-pulse" />
          <span className="text-gray-300">UPDATE RATE: 3.5 SECONDS</span>
        </div>
      </div>

      {/* Hero Index Gauge & Sectoral Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Core Composite Health Index Gauge */}
        <div className="glass p-6 rounded-3xl border border-white/5 bg-gradient-to-br from-brand-primary/5 to-transparent flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden h-full">
          <div className="absolute top-4 left-4 flex items-center gap-1.5 text-[10px] text-gray-400 font-mono">
            <Cpu className="w-3.5 h-3.5" />
            <span>AI ESTIMATED HEALTH INDEX</span>
          </div>

          <div className="relative w-48 h-48 flex items-center justify-center">
            {/* Outer animated halo rings */}
            <div className="absolute inset-0 rounded-full border-4 border-dashed border-brand-primary/20 animate-spin" style={{ animationDuration: '40s' }} />
            <div className="absolute inset-2 rounded-full border border-dashed border-brand-secondary/35 animate-spin" style={{ animationDuration: '20s', animationDirection: 'reverse' }} />
            
            {/* Inner display core */}
            <div className="w-36 h-36 bg-slate-950 rounded-full border border-white/10 flex flex-col items-center justify-center space-y-1 z-10 glow-primary">
              <span className="text-[10px] text-gray-500 font-mono">OVERALL STATUS</span>
              <div className="text-5xl font-black font-mono text-white tracking-tighter text-glow">
                {kpiStats.communityHealthScore}
              </div>
              <span className="text-[10px] text-brand-success font-mono font-bold tracking-widest uppercase">STEADY PROGRESS</span>
            </div>
          </div>

          <div className="space-y-1 max-w-xs">
            <h3 className="font-display font-semibold text-white">Combined Community Health</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Consolidated index compiling repair speed, safety risks, leakages, litter volumes, and public satisfaction factors.
            </p>
          </div>
        </div>

        {/* Sectoral Asset Health Bars */}
        <div className="lg:col-span-2 glass p-6 rounded-3xl border border-white/5 space-y-6 flex flex-col justify-between">
          <div className="border-b border-white/5 pb-2">
            <h3 className="font-display font-bold text-base text-white">Area & Surface Health</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">HEALTH SCORES BY COMMUNITY SECTION</p>
          </div>

          <div className="space-y-4">
            {sectors.map((sec) => (
              <div key={sec.name} className="space-y-1.5 text-xs">
                <div className="flex justify-between font-mono font-medium">
                  <span className="text-gray-300">{sec.name}</span>
                  <div className="flex gap-2">
                    <span className="text-gray-500">{sec.trend}</span>
                    <span className={`font-bold ${sec.text}`}>{sec.score}%</span>
                  </div>
                </div>
                <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className={`bg-gradient-to-r ${sec.color} h-full rounded-full`}
                    style={{ width: `${sec.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Ward Detail View Grid Comparisons */}
      <div className="glass p-6 rounded-3xl border border-white/5 space-y-4">
        <div className="border-b border-white/5 pb-2">
          <h3 className="font-display font-bold text-base text-white">Ward Level Detail View</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">SUMMARY OF HEALTH SCORES BY COMMUNITY SECTION</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/5 text-gray-500 font-mono whitespace-nowrap">
                <th className="py-2.5 font-semibold pr-4">COMMUNITY SECTION (WARD)</th>
                <th className="py-2.5 font-semibold pr-4">ACTIVE COMPLAINTS</th>
                <th className="py-2.5 font-semibold pr-4">SURFACE HEALTH INDEX</th>
                <th className="py-2.5 font-semibold pr-4">PREDICTED RISK LEVEL</th>
                <th className="py-2.5 font-semibold pr-4">AVG REPAIR TIME</th>
                <th className="py-2.5 font-semibold">POPULATION DENSITY</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 whitespace-nowrap">
              {wardGrid.map((ward) => (
                <tr key={ward.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3.5 font-bold text-white font-display pr-4">{ward.name}</td>
                  <td className="py-3.5 text-white font-mono pr-4">{ward.active} incidents</td>
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white font-mono">{ward.score}%</span>
                      <div className="w-16 bg-slate-950 h-1.5 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className="bg-brand-primary h-full" 
                          style={{ width: `${ward.score}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 pr-4">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                      ward.risk === 'Critical' 
                        ? 'bg-brand-danger/10 text-brand-danger border-brand-danger/25' 
                        : ward.risk === 'High' 
                          ? 'bg-brand-warning/10 text-brand-warning border-brand-warning/25' 
                          : 'bg-brand-success/10 text-brand-success border-brand-success/25'
                    }`}>
                      {ward.risk.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3.5 text-gray-400 font-mono pr-4">{ward.response}</td>
                  <td className="py-3.5 text-gray-400 font-mono">{ward.density}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical Recovery Trend (Recharts Area Chart) */}
      <div className="glass p-6 rounded-3xl border border-white/5 space-y-4">
        <div className="border-b border-white/5 pb-2 flex justify-between items-center">
          <div>
            <h3 className="font-display font-bold text-base text-white">Historical Recovery Trend</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">OVERALL PROGRESS OVER PAST 6 MONTHS</p>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-cyan-400 font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI PROGRESS TRACKING</span>
          </div>
        </div>

        {/* Chart stage */}
        <div className="h-60 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={healthHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={10} fontFamily="monospace" />
              <YAxis domain={[60, 100]} stroke="rgba(255,255,255,0.3)" fontSize={10} fontFamily="monospace" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#050816', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                labelStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                itemStyle={{ fontSize: '11px', color: '#ccc' }}
              />
              <Area type="monotone" dataKey="HealthIndex" stroke="#6366F1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorHealth)" name="Overall Health Index" />
              <Area type="monotone" dataKey="Water" stroke="#22D3EE" strokeWidth={1.5} fill="none" name="Water Network" />
              <Area type="monotone" dataKey="Roads" stroke="#8B5CF6" strokeWidth={1.5} fill="none" name="Asphalt Safety" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
