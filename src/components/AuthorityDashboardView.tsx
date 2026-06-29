/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldAlert, CheckCircle2, Award, Clock, ArrowUpRight, AlertCircle, Sparkles, Filter, Settings, Hammer, Info } from 'lucide-react';
import { CivicIssue, IssueStatus, IssueCategory } from '../types';

interface AuthorityDashboardViewProps {
  issues: CivicIssue[];
  kpiStats: any;
  onUpdateStatus: (id: string, status: IssueStatus, department?: string) => void;
  setCurrentTab: (tab: string) => void;
  setSelectedIssueId: (id: string) => void;
}

export default function AuthorityDashboardView({
  issues,
  kpiStats,
  onUpdateStatus,
  setCurrentTab,
  setSelectedIssueId
}: AuthorityDashboardViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<IssueCategory | 'All'>('All');
  const [selectedStatus, setSelectedStatus] = useState<IssueStatus | 'All'>('All');

  // Filter issues based on criteria
  const managedIssues = issues.filter((issue) => {
    if (selectedCategory !== 'All' && issue.category !== selectedCategory) return false;
    if (selectedStatus !== 'All' && issue.status !== selectedStatus) return false;
    return true;
  });

  // AI Priority Queue: Sorted by priorityScore descending
  const priorityQueue = [...issues]
    .filter(i => i.status !== 'Resolved')
    .sort((a, b) => b.priorityScore - a.priorityScore);

  // Escalation agent simulation (Agent 5)
  // Let's grab issues that are 'Reported' or 'Verified' and have priority > 80, represent them as "Escalated SLA Danger"
  const escalatedIssues = issues.filter(i => i.status !== 'Resolved' && i.priorityScore >= 80);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Roads': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'Water': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'Waste': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Lighting': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default: return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Reported': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      case 'Verified': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Assigned': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'In Progress': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Resolved': return 'bg-brand-success/10 text-brand-success border-brand-success/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const handleAuditIssue = (id: string) => {
    setSelectedIssueId(id);
    setCurrentTab('issue-details');
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-display font-bold text-3xl text-white">Authority Administration Board</h2>
          <p className="text-xs text-gray-400 font-mono tracking-wide">MUNICIPAL GOVERNANCE & SLA PERFORMANCE DESK</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setCurrentTab('analytics')}
            className="px-4 py-2 bg-slate-900 border border-white/10 hover:border-brand-primary/30 text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
          >
            <ArrowUpRight className="w-4 h-4 text-brand-secondary" />
            Performance Analytics
          </button>
          <button 
            onClick={() => setCurrentTab('impact')}
            className="px-4 py-2 bg-brand-primary hover:bg-brand-primary/95 text-white text-xs font-semibold rounded-xl transition-all glow-primary flex items-center gap-1.5"
          >
            <ArrowUpRight className="w-4 h-4" />
            Impact Dashboard
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass p-5 rounded-2xl border border-white/5 space-y-1.5">
          <span className="text-[10px] text-gray-400 font-mono uppercase">Open Municipal Cases</span>
          <div className="text-3xl font-bold font-mono text-white flex items-center justify-between">
            {kpiStats.activeReports}
            <ShieldAlert className="w-5 h-5 text-brand-warning" />
          </div>
          <p className="text-[10px] text-gray-500">Scheduled for physical dispatch</p>
        </div>

        <div className="glass p-5 rounded-2xl border border-white/5 space-y-1.5">
          <span className="text-[10px] text-gray-400 font-mono uppercase">Resolved Complaints</span>
          <div className="text-3xl font-bold font-mono text-brand-success flex items-center justify-between">
            {kpiStats.resolvedIssues}
            <CheckCircle2 className="w-5 h-5 text-brand-success" />
          </div>
          <p className="text-[10px] text-gray-500">SLA closed in past 30 days</p>
        </div>

        <div className="glass p-5 rounded-2xl border border-white/5 space-y-1.5">
          <span className="text-[10px] text-gray-400 font-mono uppercase">Avg Turnaround Time</span>
          <div className="text-3xl font-bold font-mono text-cyan-400 flex items-center justify-between">
            {kpiStats.avgResolutionTime}
            <Clock className="w-5 h-5 text-cyan-400" />
          </div>
          <p className="text-[10px] text-gray-500">SLA margin target: &lt; 24 Hrs</p>
        </div>

        <div className="glass p-5 rounded-2xl border border-white/5 space-y-1.5">
          <span className="text-[10px] text-gray-400 font-mono uppercase">Active AI Escalations</span>
          <div className="text-3xl font-bold font-mono text-brand-danger flex items-center justify-between">
            {escalatedIssues.length}
            <AlertCircle className="w-5 h-5 text-brand-danger animate-pulse" />
          </div>
          <p className="text-[10px] text-gray-500">Auto-flagged by Escalation Agent</p>
        </div>
      </div>

      {/* Grid: AI Priority Queue & Escalation agent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Priority Queue (Agent 3) */}
        <div className="lg:col-span-2 glass p-6 rounded-2xl border border-white/5 space-y-4">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-brand-primary glow-primary" />
              <h3 className="font-display font-bold text-sm text-white uppercase font-mono tracking-wide">AI Priority Queue (Agent 3)</h3>
            </div>
            <span className="text-[9px] text-gray-500 font-mono">PRIORITY SORTED GRID FEED</span>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {priorityQueue.map((issue) => (
              <div 
                key={issue.id} 
                className="p-3 bg-slate-950/60 border border-white/5 hover:border-brand-primary/20 rounded-xl flex items-center justify-between gap-4 text-xs transition-all cursor-pointer"
                onClick={() => handleAuditIssue(issue.id)}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white leading-none">{issue.title}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border ${getCategoryColor(issue.category)}`}>
                      {issue.category}
                    </span>
                  </div>
                  <p className="text-gray-400 truncate max-w-sm">{issue.locationName}</p>
                </div>

                <div className="text-right flex items-center gap-3">
                  <div>
                    <span className="text-[9px] text-gray-500 font-mono">PRIORITY RATIO:</span>
                    <div className="text-sm font-bold text-brand-primary font-mono">{issue.priorityScore}/100</div>
                  </div>
                  <div className="w-2 h-8 bg-slate-900 rounded-full overflow-hidden">
                    <div className="bg-brand-primary rounded-full" style={{ height: `${issue.priorityScore}%` }} />
                  </div>
                </div>
              </div>
            ))}
            {priorityQueue.length === 0 && (
              <p className="text-xs text-gray-500 text-center py-6">All active municipal tickets have been resolved.</p>
            )}
          </div>
        </div>

        {/* Escalation Agent Monitor (Agent 5) */}
        <div className="glass p-6 rounded-2xl border border-brand-danger/25 bg-gradient-to-br from-brand-danger/5 to-transparent space-y-4">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-brand-danger animate-pulse" />
              <h3 className="font-display font-semibold text-xs text-white uppercase font-mono tracking-wide">Agent 5: Escalation Desk</h3>
            </div>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {escalatedIssues.map((issue) => (
              <div key={issue.id} className="p-3 bg-slate-950/80 rounded-xl border border-white/5 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white truncate max-w-[150px]">{issue.title}</span>
                  <span className="text-[9px] text-brand-danger font-mono font-bold uppercase">SLA Breach Warning</span>
                </div>
                <p className="text-[10px] text-gray-400">Assigned Department: <strong className="text-white">{issue.assignedDepartment}</strong></p>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => onUpdateStatus(issue.id, 'In Progress')}
                    className="flex-1 py-1 bg-brand-warning/20 border border-brand-warning/35 text-brand-warning rounded-lg text-[10px] font-bold flex items-center justify-center gap-1"
                  >
                    <Hammer className="w-3 h-3" />
                    Expedite State
                  </button>
                  <button
                    onClick={() => handleAuditIssue(issue.id)}
                    className="flex-1 py-1 bg-slate-900 border border-white/5 text-gray-300 hover:text-white rounded-lg text-[10px]"
                  >
                    Examine Audit
                  </button>
                </div>
              </div>
            ))}
            {escalatedIssues.length === 0 && (
              <div className="py-8 text-center text-gray-500 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-brand-success mx-auto" />
                <p className="text-xs">No active SLA breach alarms logged today.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Main Administrative Incident Table */}
      <div className="glass p-6 rounded-3xl border border-white/5 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-3">
          <div>
            <h3 className="font-display font-bold text-base text-white">Incident Audit Matrix</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">ADMINISTRATIVE STATUS OVERRIDES AND ROUTING</p>
          </div>

          {/* Filtering */}
          <div className="flex flex-wrap gap-2 text-xs">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="bg-slate-950 border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none"
            >
              <option value="All">All Categories</option>
              <option value="Roads">Roads</option>
              <option value="Water">Water</option>
              <option value="Waste">Waste</option>
              <option value="Lighting">Lighting</option>
              <option value="Safety">Safety</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="bg-slate-950 border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Reported">Reported</option>
              <option value="Verified">Verified</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/5 text-gray-500 font-mono whitespace-nowrap">
                <th className="py-2.5 font-semibold pr-4">TICKET ID</th>
                <th className="py-2.5 font-semibold pr-4">INCIDENT HEADING</th>
                <th className="py-2.5 font-semibold pr-4">SECTOR CATEGORY</th>
                <th className="py-2.5 font-semibold pr-4">WORK STATE</th>
                <th className="py-2.5 font-semibold pr-4">ASSIGNED AGENCY</th>
                <th className="py-2.5 font-semibold pr-4">PRIORITY INDEX</th>
                <th className="py-2.5 font-semibold pr-4">VERIFICATION FACTORS</th>
                <th className="py-2.5 font-semibold">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 whitespace-nowrap">
              {managedIssues.map((issue) => (
                <tr key={issue.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3.5 text-gray-400 font-mono pr-4">{issue.id}</td>
                  <td className="py-3.5 font-bold text-white font-display max-w-[200px] truncate pr-4">{issue.title}</td>
                  <td className="py-3.5 pr-4">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase ${getCategoryColor(issue.category)}`}>
                      {issue.category}
                    </span>
                  </td>
                  <td className="py-3.5 pr-4">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase ${getStatusColor(issue.status)}`}>
                      {issue.status}
                    </span>
                  </td>
                  <td className="py-3.5 text-gray-300 font-sans pr-4">{issue.assignedDepartment}</td>
                  <td className="py-3.5 font-bold text-white font-mono pr-4">{issue.priorityScore} / 100</td>
                  <td className="py-3.5 text-brand-success font-mono font-semibold pr-4">{issue.trustScore}% Trust</td>
                  <td className="py-3.5">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAuditIssue(issue.id)}
                        className="px-2.5 py-1 bg-slate-900 border border-white/10 text-white rounded-lg hover:bg-slate-800"
                      >
                        Audit Case
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {managedIssues.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500">No tickets match active category and status filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
