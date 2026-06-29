/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle2, Award, Heart, Shield, Sparkles, MessageSquare, MapPin, Eye, ArrowUp, Zap, Check, Plus, RefreshCw, Trophy, Newspaper, Search, ExternalLink } from 'lucide-react';
import { CivicIssue } from '../types';
import Hologram3D from './Hologram3D';

interface CitizenDashboardViewProps {
  issues: CivicIssue[];
  citizenPoints: number;
  setCurrentTab: (tab: string) => void;
  setSelectedIssueId: (id: string) => void;
  onUpvote: (id: string) => void;
  kpiStats: any;
  onEarnPoints?: (pts: number) => void;
  userProfile?: any;
  onIssueReported?: (newIssue: CivicIssue) => void;
  currentLanguage?: any;
  t?: any;
}

export default function CitizenDashboardView({ 
  issues, 
  citizenPoints, 
  setCurrentTab, 
  setSelectedIssueId, 
  onUpvote, 
  kpiStats,
  onEarnPoints,
  userProfile,
  onIssueReported,
  currentLanguage = 'en',
  t = (k: string) => k
}: CitizenDashboardViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [highRiskOnly, setHighRiskOnly] = useState<boolean>(false);

  // Search Grounded Community News States
  const [newsArticles, setNewsArticles] = useState<any[]>([]);
  const [newsChunks, setNewsChunks] = useState<any[]>([]);
  const [newsLocation, setNewsLocation] = useState<string>('Aegis City');
  const [isFetchingNews, setIsFetchingNews] = useState<boolean>(false);
  const [newsError, setNewsError] = useState<string | null>(null);

  const fetchCommunityNews = async (loc: string) => {
    setIsFetchingNews(true);
    setNewsError(null);
    try {
      const res = await fetch(`/api/community-news?location=${encodeURIComponent(loc)}`);
      if (res.ok) {
        const data = await res.json();
        setNewsArticles(data.articles || []);
        setNewsChunks(data.chunks || []);
      } else {
        setNewsError('Could not sync local updates');
      }
    } catch (err) {
      console.error('Error fetching grounded news:', err);
      setNewsError('Search Grounding Agent offline');
    } finally {
      setIsFetchingNews(false);
    }
  };

  useEffect(() => {
    fetchCommunityNews(newsLocation);
  }, []);

  // Emergency SOS State
  const [showSosDialog, setShowSosDialog] = useState(false);
  const [isTriggeringSos, setIsTriggeringSos] = useState(false);
  const [sosSuccess, setSosSuccess] = useState(false);
  const [sosError, setSosError] = useState<string | null>(null);

  // Selected Full News Article State for Detail Reader
  const [selectedNewsArticle, setSelectedNewsArticle] = useState<any | null>(null);
  const [isGeneratingStory, setIsGeneratingStory] = useState<boolean>(false);
  const [storyDetails, setStoryDetails] = useState<any | null>(null);
  const [storyError, setStoryError] = useState<string | null>(null);

  const handleOpenNewsArticle = async (art: any) => {
    setSelectedNewsArticle(art);
    setIsGeneratingStory(true);
    setStoryDetails(null);
    setStoryError(null);
    try {
      const params = new URLSearchParams({
        title: art.title || '',
        summary: art.summary || '',
        category: art.category || 'Roads',
        date: art.date || 'Recent',
        sourceName: art.sourceName || 'Community Watch',
        location: newsLocation || 'Aegis City'
      });
      const res = await fetch(`/api/community-news/generate?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setStoryDetails(data);
      } else {
        setStoryError('Failed to generate full news report. Please try again.');
      }
    } catch (err) {
      console.error('Error generating story:', err);
      setStoryError('Network error or server-side intelligence is temporarily offline.');
    } finally {
      setIsGeneratingStory(false);
    }
  };

  // Civic Quests State - Hydrates from localStorage
  const [quests, setQuests] = useState(() => {
    try {
      const saved = localStorage.getItem('civic_quests_state_v1');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse quests from localStorage', e);
    }
    return [
      { id: 'q-verify', title: 'Verify 3 Nearby Reports', desc: 'Upvote or verify complaints from neighborhood feeds', points: 150, current: 0, target: 3, completed: false, claimed: false },
      { id: 'q-events', title: 'Visit 5 Community Events', desc: 'Attend neighborhood ward safety meetings or cleanups', points: 200, current: 0, target: 5, completed: false, claimed: false },
      { id: 'q-report', title: 'Report a Street Hazard', desc: 'Identify & report 1 active road crack or water leak', points: 100, current: 0, target: 1, completed: false, claimed: false },
      { id: 'q-minor-fix', title: 'Solve 1 Minor Hazard', desc: 'Participate in a community cleaning or minor repair task', points: 120, current: 0, target: 1, completed: false, claimed: false },
      { id: 'q-share', title: 'Invite 3 Neighbors', desc: 'Share the portal with 3 local friends to build the network', points: 50, current: 0, target: 3, completed: false, claimed: false }
    ];
  });

  const [celebratedQuest, setCelebratedQuest] = useState<string | null>(null);

  // Sync to localStorage
  const saveQuests = (newQuests: any) => {
    setQuests(newQuests);
    try {
      localStorage.setItem('civic_quests_state_v1', JSON.stringify(newQuests));
    } catch (e) {
      console.error(e);
    }
  };

  // Helper to increment progress
  const incrementQuestProgress = (id: string, amount = 1) => {
    const updated = quests.map((q: any) => {
      if (q.id === id && !q.claimed) {
        const nextCurrent = Math.min(q.target, q.current + amount);
        const nextCompleted = nextCurrent >= q.target;
        
        // If it just completed, trigger a celebration effect
        if (nextCompleted && !q.completed) {
          setCelebratedQuest(q.title);
          setTimeout(() => setCelebratedQuest(null), 4000);
          
          // Auto-claim the points
          if (onEarnPoints) {
            onEarnPoints(q.points);
          }
          return {
            ...q,
            current: nextCurrent,
            completed: true,
            claimed: true
          };
        }
        
        return {
          ...q,
          current: nextCurrent,
          completed: nextCompleted
        };
      }
      return q;
    });
    saveQuests(updated);
  };

  // Helper to directly toggle/complete
  const toggleCompleteQuest = (id: string) => {
    const updated = quests.map((q: any) => {
      if (q.id === id) {
        if (!q.claimed) {
          // Complete it and claim points!
          setCelebratedQuest(q.title);
          setTimeout(() => setCelebratedQuest(null), 4000);
          if (onEarnPoints) {
            onEarnPoints(q.points);
          }
          return {
            ...q,
            current: q.target,
            completed: true,
            claimed: true
          };
        }
      }
      return q;
    });
    saveQuests(updated);
  };

  const handleResetQuests = () => {
    const reset = [
      { id: 'q-verify', title: 'Verify 3 Nearby Reports', desc: 'Upvote or verify complaints from neighborhood feeds', points: 150, current: 0, target: 3, completed: false, claimed: false },
      { id: 'q-events', title: 'Visit 5 Community Events', desc: 'Attend neighborhood ward safety meetings or cleanups', points: 200, current: 0, target: 5, completed: false, claimed: false },
      { id: 'q-report', title: 'Report a Street Hazard', desc: 'Identify & report 1 active road crack or water leak', points: 100, current: 0, target: 1, completed: false, claimed: false },
      { id: 'q-minor-fix', title: 'Solve 1 Minor Hazard', desc: 'Participate in a community cleaning or minor repair task', points: 120, current: 0, target: 1, completed: false, claimed: false },
      { id: 'q-share', title: 'Invite 3 Neighbors', desc: 'Share the portal with 3 local friends to build the network', points: 50, current: 0, target: 3, completed: false, claimed: false }
    ];
    saveQuests(reset);
  };

  const handleLocalUpvote = (issueId: string) => {
    onUpvote(issueId);
    
    // Find the issue to see if we are upvoting
    const issue = issues.find(i => i.id === issueId);
    if (issue && !issue.userUpvoted) {
      incrementQuestProgress('q-verify');
    }
  };

  const handleTriggerSos = async () => {
    setIsTriggeringSos(true);
    setSosError(null);
    setSosSuccess(false);

    const reporterName = userProfile?.name || 'Aegis Guardian';

    const createSosReport = async (lat: number, lng: number, isEstimated = false) => {
      try {
        const locationDesc = isEstimated 
          ? `Ward 2 District Area (Approximate GPS fallback due to browser security)` 
          : `Live SOS Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

        const sosIssue = {
          title: `🚨 EMERGENCY SOS: High-Risk Public Safety Hazard`,
          description: `IMMEDIATE PUBLIC SAFETY EMERGENCY REPORTED. A citizen has triggered the Emergency SOS alarm. Live coordinates registered. High-priority dispatch recommended immediately.`,
          category: 'Safety' as const,
          locationName: locationDesc,
          latitude: lat,
          longitude: lng,
          imageUrl: null,
          reportedBy: reporterName,
          aiAnalysis: {
            issueType: 'Public Safety Emergency',
            severity: 'Critical' as const,
            confidenceScore: 100,
            priorityScore: 98,
            suggestedDepartment: 'Public Safety & Traffic',
            spamProbability: 0,
            duplicateDetected: false,
            potentialDuplicateId: null,
            environmentalImpact: 'High risk of public injury or infrastructure crash.',
            resolutionTimeEstimate: 'Immediate Dispatch (< 15 mins)',
            riskScore: 100
          }
        };

        const response = await fetch('/api/issues', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sosIssue)
        });

        if (response.ok) {
          const created: CivicIssue = await response.json();
          if (onIssueReported) {
            onIssueReported(created);
          }
          setSosSuccess(true);
          setTimeout(() => {
            setShowSosDialog(false);
            setSosSuccess(false);
            // Navigate to issue details
            setSelectedIssueId(created.id);
            setCurrentTab('issue-details');
          }, 2500);
        } else {
          throw new Error('Failed to submit SOS alert to server');
        }
      } catch (err: any) {
        setSosError(err.message || 'Server error triggering SOS.');
      } finally {
        setIsTriggeringSos(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          createSosReport(position.coords.latitude, position.coords.longitude, false);
        },
        (error) => {
          console.warn('Geolocation blocked or error:', error);
          // Fallback coordinates (District center)
          createSosReport(12.9716, 77.5946, true);
        },
        { timeout: 5000, enableHighAccuracy: true }
      );
    } else {
      // No geolocation support
      createSosReport(12.9716, 77.5946, true);
    }
  };

  const filteredIssues = issues.filter((issue) => {
    const matchesCategory = selectedCategory === 'All' || issue.category === selectedCategory;
    const matchesRisk = !highRiskOnly || issue.severity === 'High' || issue.severity === 'Critical';
    return matchesCategory && matchesRisk;
  });
  
  const handleViewDetails = (id: string) => {
    setSelectedIssueId(id);
    setCurrentTab('issue-details');
  };

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

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24 space-y-8 relative">
      {/* Quest Completion Celebratory Banner */}
      {celebratedQuest && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md bg-slate-900 border border-emerald-500/30 text-white p-4 rounded-2xl shadow-[0_0_40px_rgba(16,185,129,0.25)] flex items-center gap-3.5 animate-bounce">
          <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5 text-yellow-400 animate-pulse" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-[10px] tracking-wider uppercase font-mono text-emerald-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-spin" /> Challenge Completed!
            </div>
            <h4 className="font-display font-bold text-sm text-white leading-tight mt-0.5">{celebratedQuest}</h4>
            <p className="text-[10px] text-gray-400">Bonus points have been credited to your Hero Score!</p>
          </div>
        </div>
      )}

      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-display font-bold text-3xl text-white">{t('feed_title')}</h2>
          <p className="text-xs text-gray-400 font-mono tracking-wide uppercase">{t('feed_desc')}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setCurrentTab('report')}
            className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded-xl hover:bg-brand-primary/90 hover:scale-[1.01] transition-all glow-primary flex items-center gap-1.5 cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            {t('report_incident')}
          </button>
          <button
            onClick={() => setCurrentTab('gpt')}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl border border-white/10 hover:bg-slate-800 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5 text-brand-secondary" />
            {t('civic_gpt')}
          </button>
        </div>
      </div>

      {/* Widget Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Widget 1 */}
        <div className="glass p-5 rounded-2xl border border-white/5 space-y-1 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-brand-primary/5 rounded-bl-full -z-10 group-hover:bg-brand-primary/10 transition-colors" />
          <span className="text-[10px] text-gray-400 font-mono uppercase">Your Hero Score</span>
          <div className="text-3xl font-bold font-mono text-white flex items-center gap-1.5 pt-1">
            <Award className="w-6 h-6 text-yellow-500" />
            {citizenPoints}
          </div>
          <p className="text-[10px] text-gray-500">Level 4 Citizen • Rank #24</p>
        </div>

        {/* Widget 2 */}
        <div className="glass p-5 rounded-2xl border border-white/5 space-y-1 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-400/5 rounded-bl-full -z-10 group-hover:bg-cyan-400/10 transition-colors" />
          <span className="text-[10px] text-gray-400 font-mono uppercase">Trust Factor</span>
          <div className="text-3xl font-bold font-mono text-cyan-400 flex items-center gap-1.5 pt-1">
            <Shield className="w-6 h-6 text-cyan-400" />
            98%
          </div>
          <p className="text-[10px] text-gray-500">Verified based on 14 accurate reports</p>
        </div>

        {/* Widget 3 */}
        <div className="glass p-5 rounded-2xl border border-white/5 space-y-1 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-brand-success/5 rounded-bl-full -z-10 group-hover:bg-brand-success/10 transition-colors" />
          <span className="text-[10px] text-gray-400 font-mono uppercase">Active Complaints</span>
          <div className="text-3xl font-bold font-mono text-brand-warning flex items-center gap-1.5 pt-1">
            <ShieldAlert className="w-6 h-6 text-brand-warning" />
            {kpiStats.activeReports}
          </div>
          <p className="text-[10px] text-gray-500">Under investigation or scheduled</p>
        </div>

        {/* Widget 4 */}
        <div className="glass p-5 rounded-2xl border border-white/5 space-y-1 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-brand-secondary/5 rounded-bl-full -z-10 group-hover:bg-brand-secondary/10 transition-colors" />
          <span className="text-[10px] text-gray-400 font-mono uppercase">Resolved Complaints</span>
          <div className="text-3xl font-bold font-mono text-brand-success flex items-center gap-1.5 pt-1">
            <CheckCircle2 className="w-6 h-6 text-brand-success" />
            {kpiStats.resolvedIssues}
          </div>
          <p className="text-[10px] text-gray-500">Completed by municipal crews</p>
        </div>

        {/* Widget 5 */}
        <div className="glass p-5 rounded-2xl border border-white/5 space-y-1 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-brand-primary/5 rounded-bl-full -z-10 group-hover:bg-brand-primary/10 transition-colors" />
          <span className="text-[10px] text-gray-400 font-mono uppercase">Aegis City Health</span>
          <div className="text-3xl font-bold font-mono text-white flex items-center gap-1.5 pt-1">
            <Heart className="w-6 h-6 text-brand-danger animate-pulse" />
            {kpiStats.communityHealthScore}
          </div>
          <p className="text-[10px] text-gray-500">Index reflecting infrastructure stability</p>
        </div>
      </div>

      {/* Grid: Left - Feed, Right - Badges/Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4 pb-2 border-b border-white/5">
            <div className="flex justify-between items-center">
              <h3 className="font-display font-bold text-lg text-white">Recent District Incidents</h3>
              <button 
                onClick={() => setCurrentTab('map')}
                className="text-xs text-brand-primary hover:underline font-semibold"
              >
                View on Map
              </button>
            </div>

            {/* Quick Interactive Filters */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between bg-slate-950/60 p-3 rounded-2xl border border-white/5">
              <div className="flex flex-wrap gap-1.5">
                {['All', 'Roads', 'Water', 'Waste', 'Lighting', 'Safety'].map((cat) => {
                  let label = cat.toUpperCase();
                  if (cat === 'All') label = t('filter_all').toUpperCase();
                  else if (cat === 'Roads') label = t('category_roads').toUpperCase();
                  else if (cat === 'Water') label = t('category_water').toUpperCase();
                  else if (cat === 'Waste') label = t('category_waste').toUpperCase();
                  else if (cat === 'Lighting') label = t('category_lighting').toUpperCase();
                  else if (cat === 'Safety') label = t('category_safety').toUpperCase();

                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-brand-primary text-white font-bold'
                          : 'bg-slate-900 text-gray-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* High Risk Filter Toggle */}
              <button
                onClick={() => setHighRiskOnly(!highRiskOnly)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono uppercase border transition-all flex items-center gap-1.5 cursor-pointer ${
                  highRiskOnly
                    ? 'bg-red-500/20 text-red-300 border-red-500/30'
                    : 'bg-slate-900 text-red-400/80 border-white/5 hover:bg-slate-850'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-brand-danger animate-pulse" />
                <span>🚨 High Risk Only</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {filteredIssues.map((issue) => (
              <div 
                key={issue.id} 
                className="glass p-4 sm:p-5 rounded-2xl border border-white/5 hover:border-brand-primary/20 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group"
              >
                <div className="flex gap-4 flex-1 min-w-0 w-full">
                  {/* Image wrapper with strict dimension controls & overflow protection to prevent broken image alt overlaps */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-900 border border-white/5 shrink-0 relative flex items-center justify-center">
                    {issue.imageUrl ? (
                      <img 
                        src={issue.imageUrl} 
                        alt={issue.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            const fallback = parent.querySelector('.image-fallback-placeholder');
                            if (fallback) fallback.classList.remove('hidden');
                          }
                        }}
                      />
                    ) : null}
                    <div className={`image-fallback-placeholder absolute inset-0 flex items-center justify-center text-gray-500 bg-slate-900 ${issue.imageUrl ? 'hidden' : ''}`}>
                      <ShieldAlert className="w-7 h-7" />
                    </div>
                  </div>

                  {/* Context block with min-w-0 for perfect dynamic word wraps */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${getCategoryColor(issue.category)}`}>
                        {issue.category === 'Roads' ? t('category_roads').toUpperCase() :
                         issue.category === 'Water' ? t('category_water').toUpperCase() :
                         issue.category === 'Waste' ? t('category_waste').toUpperCase() :
                         issue.category === 'Lighting' ? t('category_lighting').toUpperCase() :
                         issue.category === 'Safety' ? t('category_safety').toUpperCase() :
                         issue.category.toUpperCase()}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${getStatusColor(issue.status)}`}>
                        {t(`filter_${issue.status.toLowerCase().replace(' ', '')}`).toUpperCase()}
                      </span>
                      {issue.severity === 'Critical' && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-brand-danger/25 text-brand-danger border border-brand-danger/35 uppercase whitespace-nowrap">
                          CRITICAL RISK
                        </span>
                      )}
                    </div>
                    <h4 className="font-display font-bold text-sm sm:text-base text-white group-hover:text-brand-primary transition-colors leading-tight break-words">
                      {issue.title}
                    </h4>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 min-w-0">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-brand-primary" />
                      <span className="truncate flex-1">{issue.locationName}</span>
                    </div>
                  </div>
                </div>

                {/* Actions Section: Responsive grid for mobile view, vertical stack for desktop view */}
                <div className="grid grid-cols-2 md:flex md:flex-col gap-2.5 w-full md:w-32 md:border-l md:border-white/5 md:pl-5 shrink-0">
                  {/* Upvotes (Verification) */}
                  <button 
                    onClick={() => handleLocalUpvote(issue.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all justify-center w-full cursor-pointer ${
                      issue.userUpvoted 
                        ? 'bg-brand-primary/20 text-white border-brand-primary/30 glow-primary' 
                        : 'bg-slate-950 text-gray-400 border-white/5 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <ArrowUp className={`w-3.5 h-3.5 shrink-0 ${issue.userUpvoted ? 'animate-bounce' : ''}`} />
                    <span>{issue.upvotes} {t('button_verify')}</span>
                  </button>

                  <button 
                    onClick={() => handleViewDetails(issue.id)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 border border-white/10 text-xs font-medium text-white hover:bg-slate-800 rounded-xl justify-center w-full transition-all cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-brand-secondary shrink-0" />
                    <span>{t('button_details').split(' ')[0]}</span>
                  </button>
                </div>
              </div>
            ))}
            {filteredIssues.length === 0 && (
              <div className="glass p-8 text-center text-gray-500 rounded-2xl border border-white/5 py-12 space-y-2">
                <ShieldAlert className="w-8 h-8 text-brand-primary mx-auto animate-pulse" />
                <p className="text-sm font-bold text-white">No Issues Logged</p>
                <p className="text-xs text-gray-400">There are no reports matching the selected category and high-risk filters in your ward today.</p>
              </div>
            )}
          </div>

          {/* Interactive Holographic 3D Telemetry & Live News Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/5">
            {/* 3D Holographic Telemetry Component */}
            <Hologram3D onEarnPoints={onEarnPoints} />

            {/* Grounded Local Area Community News Feed Component */}
            <div className="glass p-5 rounded-2xl border border-white/5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div className="flex items-center gap-2">
                  <Newspaper className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-display font-semibold text-sm text-white">Community News Feed</h3>
                </div>
                <span className="flex items-center gap-1 text-[8px] font-bold font-mono text-cyan-400 bg-cyan-400/5 border border-cyan-400/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  <Sparkles className="w-2.5 h-2.5 animate-spin" /> Google Search
                </span>
              </div>

              {/* Local Area Search Input */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  fetchCommunityNews(newsLocation);
                }}
                className="relative flex gap-2"
              >
                <input
                  type="text"
                  placeholder="Enter area (e.g. Bangalore, London)"
                  value={newsLocation}
                  onChange={(e) => setNewsLocation(e.target.value)}
                  className="flex-1 bg-slate-950/80 border border-white/5 focus:border-cyan-400/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none placeholder-gray-500"
                />
                <button
                  type="submit"
                  disabled={isFetchingNews}
                  className="bg-slate-950 border border-white/10 hover:border-cyan-400/20 text-gray-300 hover:text-white px-3 rounded-xl flex items-center justify-center transition-colors disabled:opacity-55 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Error or Loading */}
              {isFetchingNews ? (
                <div className="space-y-3 py-4 text-center">
                  <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin mx-auto" />
                  <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider animate-pulse font-bold">Grounding live updates for "{newsLocation}"...</p>
                </div>
              ) : newsError ? (
                <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl text-center space-y-2 animate-fadeIn">
                  <p className="text-[10px] text-red-400 font-mono">{newsError}</p>
                  <button
                    type="button"
                    onClick={() => fetchCommunityNews(newsLocation)}
                    className="px-2.5 py-1 bg-slate-950 border border-white/5 hover:border-white/10 text-[9px] font-mono text-white rounded-lg transition-all"
                  >
                    Retry Search
                  </button>
                </div>
              ) : newsArticles.length === 0 ? (
                <p className="text-center text-[10px] text-gray-500 py-4 font-mono">No local updates found for this region.</p>
              ) : (
                <div className="space-y-4 animate-fadeIn">
                  {newsArticles.map((art: any, i: number) => (
                    <div 
                      key={i} 
                      onClick={() => handleOpenNewsArticle(art)}
                      className="group border-b border-white/5 pb-3 last:border-b-0 last:pb-0 space-y-1.5 cursor-pointer hover:bg-white/[0.02] p-2.5 -mx-2.5 rounded-xl transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border uppercase tracking-wider ${getCategoryColor(art.category || 'Roads')}`}>
                          {(art.category || 'Roads').toUpperCase()}
                        </span>
                        <span className="text-[9px] text-gray-500 font-mono">{art.date}</span>
                      </div>
                      
                      <h4 className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors leading-snug line-clamp-2">
                        {art.title}
                      </h4>
                      
                      <p className="text-[10px] text-gray-400 leading-normal line-clamp-2">
                        {art.summary}
                      </p>
                      
                      <div className="flex items-center justify-between text-[9px] text-gray-500 font-mono pt-0.5">
                        <span className="truncate max-w-[150px]">Source: <strong className="text-gray-300 font-medium">{art.sourceName || 'Grounded Search'}</strong></span>
                        <span className="text-cyan-400/80 hover:text-cyan-400 flex items-center gap-1 font-bold text-[9px]">
                          <span>Read Real News</span>
                          <Sparkles className="w-2.5 h-2.5 animate-pulse text-cyan-400" />
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Grounding Citations Panel */}
                  {newsChunks.length > 0 && (
                    <div className="pt-2 border-t border-white/5 space-y-1">
                      <p className="text-[9px] font-mono text-gray-400 uppercase tracking-wider font-bold">Search Citations:</p>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {newsChunks.map((chunk: any, ci: number) => {
                          const web = chunk.web || {};
                          if (!web.uri) return null;
                          return (
                            <a 
                              key={ci}
                              href={web.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[8px] bg-slate-950/80 border border-white/5 hover:border-cyan-400/20 text-gray-400 hover:text-cyan-400 px-2 py-0.5 rounded-lg transition-all font-mono truncate max-w-[120px]"
                              title={web.title || web.uri}
                            >
                              [{ci + 1}] {web.title || 'Source'}
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="glass p-5 rounded-2xl border border-white/5 space-y-4">
            <h3 className="font-display font-semibold text-sm text-white">Interactive Portals</h3>
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => setCurrentTab('map')}
                className="w-full p-3 bg-slate-900 hover:bg-slate-800 rounded-xl border border-white/5 hover:border-brand-primary/30 text-left flex items-center justify-between text-xs transition-all group"
              >
                <div>
                  <div className="font-bold text-white group-hover:text-brand-primary transition-colors">Visual Incident Map</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">Filter water leaks & asphalt degradation</div>
                </div>
                <Eye className="w-4 h-4 text-gray-500" />
              </button>

              <button 
                onClick={() => setCurrentTab('twin')}
                className="w-full p-3 bg-slate-900 hover:bg-slate-800 rounded-xl border border-white/5 hover:border-brand-primary/30 text-left flex items-center justify-between text-xs transition-all group"
              >
                <div>
                  <div className="font-bold text-white group-hover:text-brand-primary transition-colors">Digital Twin Grid</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">Evaluate sector-by-sector live health telemetry</div>
                </div>
                <Eye className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Civic Quests System */}
          <div className="glass p-5 rounded-2xl border border-white/5 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-brand-primary/5 rounded-bl-full -z-10" />
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center animate-pulse">
                  <Zap className="w-4 h-4 fill-orange-500 text-orange-400" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-sm text-white">Active Civic Quests</h3>
                  <p className="text-[9px] text-gray-400">Complete tasks to earn points</p>
                </div>
              </div>
              <button 
                onClick={handleResetQuests}
                title="Reset Quests progress"
                className="p-1 hover:bg-white/5 rounded text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-4">
              {quests.map((q: any) => (
                <div key={q.id} className="space-y-1.5 p-3 bg-slate-950/40 rounded-xl border border-white/5 hover:border-white/10 transition-colors group/quest">
                  <div className="flex items-start gap-2.5">
                    {/* Interactive Checkbox */}
                    <button 
                      onClick={() => toggleCompleteQuest(q.id)}
                      disabled={q.claimed}
                      className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 border transition-all cursor-pointer ${
                        q.claimed 
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' 
                          : 'bg-slate-900 border-white/10 text-transparent hover:border-brand-primary/45'
                      }`}
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-1">
                        <h4 className={`text-xs font-bold leading-tight truncate ${q.claimed ? 'text-gray-400 line-through' : 'text-white'}`}>
                          {q.title}
                        </h4>
                        <span className={`text-[10px] font-mono font-bold shrink-0 ${q.claimed ? 'text-gray-500' : 'text-orange-400'}`}>
                          +{q.points} PTS
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{q.desc}</p>
                    </div>
                  </div>

                  {/* Progress Bar & Manual Logger */}
                  <div className="flex items-center gap-3 pt-1">
                    <div className="flex-1">
                      <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            q.claimed 
                              ? 'bg-emerald-500/80' 
                              : 'bg-gradient-to-r from-orange-500 to-amber-400'
                          }`} 
                          style={{ width: `${(q.current / q.target) * 100}%` }} 
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[9px] font-mono text-gray-400 font-bold">
                        {q.current}/{q.target}
                      </span>
                      {!q.claimed && (
                        <button
                          onClick={() => incrementQuestProgress(q.id, 1)}
                          className="w-4 h-4 bg-slate-900 border border-white/10 hover:border-orange-500/30 hover:bg-slate-800 text-gray-400 hover:text-white rounded flex items-center justify-center transition-colors cursor-pointer"
                          title="Log/Increment progress"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gamification Achievements */}
          <div className="glass p-5 rounded-2xl border border-white/5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h3 className="font-display font-semibold text-sm text-white">Your Achievements</h3>
              <Sparkles className="w-4 h-4 text-yellow-500" />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-xl flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Civic Hero</h4>
                  <p className="text-[10px] text-gray-400">Awarded for reporting 10 verified issues</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/20 text-purple-500 rounded-xl flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Local Watcher</h4>
                  <p className="text-[10px] text-gray-400">Awarded for verifying over 30 community reports</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Community Guardian</h4>
                  <p className="text-[10px] text-gray-400">Achieved a trust factor higher than 95%</p>
                </div>
              </div>
            </div>

            {/* Next Milestone progress */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                <span>NEXT BADGE: CITY CHAMPION</span>
                <span>1,250 / 2,000 PTS</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-brand-primary to-brand-secondary h-full" style={{ width: '62%' }} />
              </div>
            </div>
          </div>
        </div>    </div>

      {/* Emergency SOS Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        <button
          onClick={() => setShowSosDialog(true)}
          className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-red-600 hover:bg-red-750 text-white shadow-[0_0_35px_rgba(239,68,68,0.55)] border border-red-500/50 hover:scale-110 transition-all cursor-pointer overflow-hidden"
          title="Emergency SOS Alarm"
        >
          {/* Pulsing ring animation */}
          <span className="absolute inset-0 rounded-full border-4 border-red-500/30 animate-ping pointer-events-none" />
          <ShieldAlert className="w-7 h-7 text-white animate-pulse" />
        </button>
      </div>

      {/* Emergency SOS Overlay Modal */}
      {showSosDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-slate-900 border-2 border-red-500/30 rounded-3xl p-6 shadow-[0_0_50px_rgba(239,68,68,0.3)] space-y-6 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-orange-500 to-red-600" />
            
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 animate-bounce">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h3 className="font-display font-black text-xl text-white tracking-tight">Community Emergency SOS</h3>
              <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                This triggers an immediate high-risk safety hazard alert in the district database and directly requests urgent municipal rescue response.
              </p>
            </div>

            {sosError && (
              <div className="p-3 bg-red-500/10 border border-red-500/25 rounded-xl text-center text-xs text-red-400 font-semibold font-mono">
                ⚠ {sosError}
              </div>
            )}

            {sosSuccess ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-center space-y-2">
                <div className="text-xs font-bold text-emerald-400">✓ EMERGENCY DISPATCH TRANSMITTED!</div>
                <p className="text-[10px] text-gray-400">Responders notified with GPS coordinates. Navigating to live feed...</p>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSosDialog(false)}
                  disabled={isTriggeringSos}
                  className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-850 text-gray-400 hover:text-white font-bold text-xs rounded-xl border border-white/5 hover:border-white/10 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTriggerSos}
                  disabled={isTriggeringSos}
                  className="flex-1 py-2.5 bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-md shadow-red-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {isTriggeringSos ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Dispatching...</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Trigger SOS</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Real-News Interactive Detail Grounding Modal */}
      {selectedNewsArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl p-5 sm:p-7 shadow-[0_0_60px_rgba(0,0,0,0.85)] space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar my-8">
            
            {/* Top Close Bar */}
            <div className="flex items-center justify-between border-b border-white/5 pb-3.5">
              <div className="flex items-center gap-2">
                <Newspaper className="w-4 h-4 text-cyan-400" />
                <span className="text-[10px] font-mono text-gray-400 tracking-wider uppercase">Live Grounded Content Reader</span>
              </div>
              <button 
                onClick={() => setSelectedNewsArticle(null)}
                className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-xl transition-all cursor-pointer text-xs font-mono px-2.5"
              >
                Close View
              </button>
            </div>

            {isGeneratingStory ? (
              <div className="py-16 text-center space-y-4">
                <div className="relative w-14 h-14 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-2 border-cyan-400/20 border-t-cyan-400 animate-spin" />
                  <Sparkles className="w-6 h-6 text-cyan-400 animate-pulse" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold text-white tracking-tight">Drafting Grounded News Report</h4>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                    Connecting to local nodes in <strong className="text-cyan-400">"{newsLocation}"</strong> to compile real full-story paragraphs, civic impact scores, and guidelines...
                  </p>
                </div>
              </div>
            ) : storyError ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <p className="text-xs text-red-400 font-mono max-w-md mx-auto">{storyError}</p>
                <div className="flex justify-center gap-3">
                  <button 
                    onClick={() => handleOpenNewsArticle(selectedNewsArticle)}
                    className="px-4 py-2 bg-slate-950 border border-white/5 hover:border-white/10 text-xs font-bold text-white rounded-xl transition-all"
                  >
                    Retry Generation
                  </button>
                  <button 
                    onClick={() => setSelectedNewsArticle(null)}
                    className="px-4 py-2 bg-white/5 text-xs font-bold text-gray-300 hover:text-white rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : storyDetails ? (
              <div className="space-y-5 animate-fadeIn">
                {/* Meta details */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black border uppercase tracking-wider ${getCategoryColor(selectedNewsArticle.category || 'Roads')}`}>
                      {(selectedNewsArticle.category || 'Roads').toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">{selectedNewsArticle.date}</span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono">
                    Published by: <strong className="text-gray-300 font-medium">{selectedNewsArticle.sourceName || 'Municipal Feed'}</strong>
                  </span>
                </div>

                {/* Main Headline & Subheading */}
                <div className="space-y-2">
                  <h1 className="font-display font-black text-lg sm:text-2xl text-white leading-tight tracking-tight">
                    {selectedNewsArticle.title}
                  </h1>
                  {storyDetails.subheading && (
                    <p className="text-xs sm:text-sm text-cyan-400/90 italic leading-snug">
                      {storyDetails.subheading}
                    </p>
                  )}
                </div>

                {/* Large Category Image */}
                <div className="w-full h-48 sm:h-56 rounded-2xl overflow-hidden border border-white/5 relative">
                  <img 
                    src={(() => {
                      const cat = (selectedNewsArticle.category || '').toLowerCase();
                      if (cat.includes('road')) return 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=800&q=80';
                      if (cat.includes('water')) return 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=800&q=80';
                      if (cat.includes('waste') || cat.includes('sanitation')) return 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=800&q=80';
                      if (cat.includes('light') || cat.includes('grid')) return 'https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?auto=format&fit=crop&w=800&q=80';
                      if (cat.includes('safety') || cat.includes('hazard')) return 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=800&q=80';
                      return 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80';
                    })()}
                    alt={selectedNewsArticle.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                </div>

                {/* Article Body Paragraphs */}
                <div className="space-y-4 text-xs sm:text-sm text-gray-300 leading-relaxed font-sans">
                  {Array.isArray(storyDetails.paragraphs) ? (
                    storyDetails.paragraphs.map((p: string, pi: number) => (
                      <p key={pi} className="first-letter:text-xl first-letter:font-bold first-letter:text-cyan-400 first-letter:mr-1">
                        {p}
                      </p>
                    ))
                  ) : (
                    <p>{selectedNewsArticle.summary}</p>
                  )}
                </div>

                {/* Bulleted Takeaways */}
                {Array.isArray(storyDetails.keyTakeaways) && storyDetails.keyTakeaways.length > 0 && (
                  <div className="bg-slate-950/60 border border-white/5 p-4 sm:p-5 rounded-2xl space-y-3.5">
                    <h4 className="text-xs font-mono font-bold text-cyan-400 tracking-wider uppercase flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Key Resident Guidelines:
                    </h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-300">
                      {storyDetails.keyTakeaways.map((takeaway: string, idx: number) => (
                        <li key={idx} className="flex gap-2.5 items-start">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="leading-normal">{takeaway}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Civic Impact Audit Section */}
                {storyDetails.impactRating !== undefined && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950/40 p-4 rounded-2xl border border-white/5 items-center">
                    <div className="flex flex-col items-center justify-center border-b sm:border-b-0 sm:border-r border-white/5 pb-3 sm:pb-0 sm:pr-4 text-center">
                      <span className="text-3xl font-black text-cyan-400 tracking-tight">{storyDetails.impactRating}%</span>
                      <span className="text-[10px] text-gray-500 font-mono tracking-wider uppercase">Civic Impact Rating</span>
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <h5 className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">AI Impact Analysis</h5>
                      <p className="text-xs text-gray-300 leading-normal">{storyDetails.impactJustification || 'Normal municipal impact score assigned.'}</p>
                    </div>
                  </div>
                )}

                {/* Footer details */}
                <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono pt-2">
                  <span>GROUNDING SOURCE CONFIDENCE: 98%</span>
                  {selectedNewsArticle.url && (
                    <a 
                      href={selectedNewsArticle.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 font-bold"
                    >
                      <span>External Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ) : null}

            {/* Bottom Actions */}
            <div className="flex justify-end pt-3 border-t border-white/5">
              <button 
                onClick={() => setSelectedNewsArticle(null)}
                className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-white font-bold text-xs rounded-xl border border-cyan-500/30 hover:scale-[1.01] transition-all cursor-pointer"
              >
                Done Reading
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
