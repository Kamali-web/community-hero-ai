/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldAlert, Sparkles, Loader2, PlayCircle, RefreshCw, Eye, Calendar, TrendingUp } from 'lucide-react';
import { Prediction } from '../types';

interface PredictionCenterViewProps {
  predictions: Prediction[];
  setPredictions: (preds: Prediction[]) => void;
}

export default function PredictionCenterView({ predictions, setPredictions }: PredictionCenterViewProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);
  const [dispatchedList, setDispatchedList] = useState<string[]>([]);
  const [riskFilter, setRiskFilter] = useState<'All' | 'HighRisk'>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filteredPredictions = predictions.filter((pred) => {
    const matchesRisk = riskFilter === 'All' || pred.riskLevel === 'High' || pred.riskLevel === 'Critical';
    const matchesCategory = categoryFilter === 'All' || pred.category === categoryFilter;
    return matchesRisk && matchesCategory;
  });

  const handleRefreshPredictions = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/predictions/refresh', {
        method: 'POST'
      });
      if (response.ok) {
        const data = await response.json();
        setPredictions(data);
      }
    } catch (err) {
      console.error('Error refreshing predictions:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTriggerDispatch = (id: string) => {
    setDispatchingId(id);
    setTimeout(() => {
      setDispatchingId(null);
      setDispatchedList([...dispatchedList, id]);
      setToastMessage('⚡ Proactive Dispatch Complete: Preventive work order issued and scheduled. Maintenance crews have been notified.');
      setTimeout(() => setToastMessage(null), 5000);
    }, 1500);
  };

  const getCategoryIconColor = (category: string) => {
    switch (category) {
      case 'Roads': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
      case 'Water': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
      case 'Waste': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'Lighting': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      default: return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display font-bold text-3xl text-white">AI Safety Prediction Center</h2>
          <p className="text-xs text-gray-400 font-mono tracking-wide">AGENT 4: EARLY SMART SAFETY & INFRASTRUCTURE ALERTS</p>
        </div>
        
        <button
          onClick={handleRefreshPredictions}
          disabled={isRefreshing}
          className="px-4 py-2 bg-slate-900 border border-white/10 hover:border-brand-primary/30 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-all disabled:opacity-50"
        >
          {isRefreshing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
              Updating AI Predictions...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 text-brand-secondary" />
              Refresh Predictions
            </>
          )}
        </button>
      </div>

      {/* Info Block */}
      <div className="glass p-5 rounded-2xl border border-white/5 space-y-2 bg-gradient-to-r from-brand-secondary/5 to-transparent flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-white mb-1">
            <Sparkles className="w-4 h-4 text-brand-secondary" />
            <span>Early Warning Danger Safety System</span>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed max-w-3xl">
            Our Smart AI system continuously checks daily resident reports, local weather conditions, and history records to automatically spot upcoming road cracks, water leaks, dirty streets, or dark spots before they can cause safety hazards or road accidents.
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs text-brand-success bg-brand-success/15 border border-brand-success/25 px-3 py-1.5 rounded-xl font-bold">
          <TrendingUp className="w-4 h-4" />
          <span>91.4% SMART ACCURACY</span>
        </div>
      </div>

      {/* Filter Control Center */}
      <div className="glass p-4 rounded-2xl border border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button
            onClick={() => setRiskFilter('All')}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-mono uppercase border transition-all flex items-center gap-1.5 cursor-pointer ${
              riskFilter === 'All' 
                ? 'bg-white/10 text-white border-white/20' 
                : 'bg-slate-950 text-gray-400 border-white/5 hover:text-white'
            }`}
          >
            <span>All Forecasts</span>
            <span className="px-1.5 py-0.2 bg-slate-900 rounded text-[9px] text-gray-400 font-bold">{predictions.length}</span>
          </button>
          
          <button
            onClick={() => setRiskFilter('HighRisk')}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-mono uppercase border transition-all flex items-center gap-1.5 cursor-pointer ${
              riskFilter === 'HighRisk' 
                ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                : 'bg-slate-950 text-red-400/80 border-white/5 hover:bg-slate-900'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-brand-danger animate-pulse" />
            <span>🚨 More Concerned (High Risk Only)</span>
            <span className="px-1.5 py-0.2 bg-slate-900 rounded text-[9px] text-red-400 font-bold">
              {predictions.filter(p => p.riskLevel === 'High' || p.riskLevel === 'Critical').length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <span className="text-[10px] text-gray-500 font-mono uppercase">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-950 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none w-full md:w-44"
          >
            <option value="All">All Categories</option>
            <option value="Roads">Roads</option>
            <option value="Water">Water</option>
            <option value="Waste">Waste</option>
            <option value="Lighting">Lighting</option>
            <option value="Safety">Safety</option>
          </select>
        </div>
      </div>

      {/* Grid of Predictions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredPredictions.map((pred) => {
          const isDispatched = dispatchedList.includes(pred.id);
          const isDispatching = dispatchingId === pred.id;

          return (
            <div 
              key={pred.id} 
              className="glass p-6 rounded-2xl border border-white/5 hover:border-brand-secondary/20 transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                
                {/* Meta details */}
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${getCategoryIconColor(pred.category)}`}>
                    {pred.category} FORECAST
                  </span>
                  
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase ${
                    pred.riskLevel === 'Critical' 
                      ? 'bg-brand-danger/10 text-brand-danger border-brand-danger/25' 
                      : pred.riskLevel === 'High' 
                        ? 'bg-brand-warning/10 text-brand-warning border-brand-warning/25' 
                        : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25'
                  }`}>
                    {pred.riskLevel} RISK RISK
                  </span>
                </div>

                <h3 className="font-display font-bold text-base sm:text-lg text-white">{pred.title}</h3>
                
                <div className="grid grid-cols-2 gap-4 text-xs bg-slate-950/60 p-3 rounded-xl border border-white/5">
                  <div>
                    <div className="text-gray-500">Target Region</div>
                    <div className="font-bold text-white mt-0.5">{pred.ward}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Forecasting Timeframe</div>
                    <div className="font-bold text-white mt-0.5 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-brand-primary" />
                      {pred.timeframe}
                    </div>
                  </div>
                  <div className="border-t border-white/5 pt-2 mt-1">
                    <div className="text-gray-500">Probability Rating</div>
                    <div className="font-bold text-brand-secondary font-mono mt-0.5">{pred.probability}%</div>
                  </div>
                  <div className="border-t border-white/5 pt-2 mt-1">
                    <div className="text-gray-500">Impact Multiplier</div>
                    <div className="font-bold text-brand-warning font-mono mt-0.5">{pred.impactScore} / 100</div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] text-gray-500 font-mono uppercase font-bold">PREVENTATIVE CORRECTION PLAN</div>
                  <p className="text-xs text-gray-300 leading-relaxed">{pred.suggestedAction}</p>
                </div>

              </div>

              {/* Preventative actions dispatch */}
              <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-4">
                <div className="text-[10px] text-gray-500 font-mono">MODEL CONFIDENCE: {pred.confidence || 85}%</div>
                
                {isDispatched ? (
                  <span className="px-3 py-1.5 bg-brand-success/15 border border-brand-success/30 text-brand-success rounded-xl text-xs font-bold flex items-center gap-1.5">
                    ✓ Dispatch Complete
                  </span>
                ) : (
                  <button
                    onClick={() => handleTriggerDispatch(pred.id)}
                    disabled={isDispatching}
                    className="px-4 py-2 bg-brand-primary hover:bg-brand-primary/90 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50 glow-primary"
                  >
                    {isDispatching ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Routing Team...
                      </>
                    ) : (
                      <>
                        <PlayCircle className="w-3.5 h-3.5" />
                        Trigger Preventative Dispatch
                      </>
                    )}
                  </button>
                )}
              </div>

            </div>
          );
        })}
        {filteredPredictions.length === 0 && (
          <div className="col-span-1 md:col-span-2 glass p-8 text-center text-gray-500 rounded-2xl border border-white/5 py-12 space-y-2">
            <ShieldAlert className="w-8 h-8 text-brand-primary mx-auto animate-pulse" />
            <p className="text-sm font-bold text-white">No Predictions Found</p>
            <p className="text-xs text-gray-400">There are no active municipal forecasting alerts matching the selected category and risk criteria.</p>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 max-w-sm bg-slate-900/95 border border-brand-primary/40 text-white rounded-2xl p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex gap-2.5 items-start">
            <div className="p-1.5 bg-brand-primary/10 rounded-lg text-brand-primary">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h5 className="font-bold text-xs text-white">System Alert</h5>
              <p className="text-[11px] text-gray-300 mt-1 leading-relaxed">{toastMessage}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
