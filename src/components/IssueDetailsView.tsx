/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldAlert, ArrowLeft, ArrowUp, Calendar, MapPin, User, CheckCircle2, MessageSquare, Sparkles, Send, Clock, RefreshCw, Mic, Volume2 } from 'lucide-react';
import { CivicIssue, Comment, IssueStatus } from '../types';

interface IssueDetailsViewProps {
  issueId: string;
  issues: CivicIssue[];
  userRole: 'citizen' | 'authority';
  onUpvote: (id: string) => void;
  onAddComment: (id: string, text: string, isAuthority: boolean) => void;
  onUpdateStatus: (id: string, status: IssueStatus, department?: string) => void;
  setCurrentTab: (tab: string) => void;
  currentLanguage?: any;
  t?: any;
}

export default function IssueDetailsView({
  issueId,
  issues,
  userRole,
  onUpvote,
  onAddComment,
  onUpdateStatus,
  setCurrentTab,
  currentLanguage = 'en',
  t = (k: string) => k
}: IssueDetailsViewProps) {
  const [commentText, setCommentText] = useState('');
  const [assignedDept, setAssignedDept] = useState('');

  // Audio read-aloud state for lower-literacy/uneducated users
  const [isPlayingDetails, setIsPlayingDetails] = useState(false);

  const handlePlayVoiceDetails = () => {
    if ('speechSynthesis' in window) {
      if (isPlayingDetails) {
        window.speechSynthesis.cancel();
        setIsPlayingDetails(false);
      } else {
        const issue = issues.find((i) => i.id === issueId);
        if (!issue) return;

        const statusText = t(`filter_${issue.status.toLowerCase().replace(' ', '')}`);
        const textToSpeak = t('speech_detail_intro', {
          status: statusText,
          author: issue.reportedBy,
          location: issue.locationName
        }) + ". " + issue.description;

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        
        const voices = window.speechSynthesis.getVoices();
        let matchingVoice = voices.find(v => v.lang.startsWith(currentLanguage));
        if (!matchingVoice && currentLanguage === 'hi') matchingVoice = voices.find(v => v.lang.includes('IN'));
        if (matchingVoice) {
          utterance.voice = matchingVoice;
        }
        utterance.lang = currentLanguage === 'hi' ? 'hi-IN' : currentLanguage === 'ta' ? 'ta-IN' : currentLanguage === 'kn' ? 'kn-IN' : currentLanguage === 'te' ? 'te-IN' : 'en-US';
        utterance.rate = 0.92;
        
        utterance.onend = () => {
          setIsPlayingDetails(false);
        };
        utterance.onerror = () => {
          setIsPlayingDetails(false);
        };
        
        setIsPlayingDetails(true);
        window.speechSynthesis.speak(utterance);
      }
    } else {
      alert('Text-to-speech is not supported in this browser.');
    }
  };

  React.useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const issue = issues.find((i) => i.id === issueId);

  if (!issue) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-12 text-center space-y-4">
        <h3 className="text-xl font-bold text-white">Incident Audit Not Found</h3>
        <p className="text-gray-400">The requested report record does not exist or was purged.</p>
        <button onClick={() => setCurrentTab('citizen-dashboard')} className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded-xl">
          Return to Dashboard
        </button>
      </div>
    );
  }

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    onAddComment(issue.id, commentText, userRole === 'authority');
    setCommentText('');
  };

  const handleUpdateStatus = (status: IssueStatus) => {
    onUpdateStatus(issue.id, status, assignedDept || undefined);
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

  const getStatusConfig = (status: IssueStatus) => {
    switch (status) {
      case 'Reported':
        return {
          icon: <ShieldAlert className="w-4 h-4 text-rose-400" />,
          bgColor: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
          borderColor: 'border-l-rose-500',
          dotColor: 'bg-rose-500',
        };
      case 'Verified':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
          bgColor: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
          borderColor: 'border-l-emerald-500',
          dotColor: 'bg-emerald-500',
        };
      case 'Assigned':
        return {
          icon: <User className="w-4 h-4 text-indigo-400" />,
          bgColor: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
          borderColor: 'border-l-indigo-500',
          dotColor: 'bg-indigo-500',
        };
      case 'In Progress':
        return {
          icon: <RefreshCw className="w-4 h-4 text-amber-400" />,
          bgColor: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
          borderColor: 'border-l-amber-500',
          dotColor: 'bg-amber-500',
        };
      case 'Resolved':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-cyan-400" />,
          bgColor: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
          borderColor: 'border-l-cyan-500',
          dotColor: 'bg-cyan-500',
        };
      default:
        return {
          icon: <Clock className="w-4 h-4 text-gray-400" />,
          bgColor: 'bg-gray-500/10 border-gray-500/20 text-gray-400',
          borderColor: 'border-l-gray-500',
          dotColor: 'bg-gray-500',
        };
    }
  };

  // Check progress step index for timeline
  const getStatusStep = (status: IssueStatus) => {
    const steps: IssueStatus[] = ['Reported', 'Verified', 'Assigned', 'In Progress', 'Resolved'];
    return steps.indexOf(status);
  };

  const currentStepIdx = getStatusStep(issue.status);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Back Button and Core Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setCurrentTab(userRole === 'citizen' ? 'citizen-dashboard' : 'authority-dashboard')}
            className="w-9 h-9 bg-slate-900 border border-white/10 rounded-xl flex items-center justify-center hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-gray-300" />
          </button>
          <div>
            <span className="text-[10px] text-gray-400 font-mono">INCIDENT METADATA: AUDIT #{issue.id}</span>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-white leading-tight">{issue.title}</h2>
          </div>
        </div>

        {/* Audio Read Aloud Assistance for issue description & comments */}
        <button
          type="button"
          onClick={handlePlayVoiceDetails}
          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl border font-bold text-xs transition-all cursor-pointer shadow-md shrink-0 ${
            isPlayingDetails
              ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 animate-pulse'
              : 'bg-indigo-600/20 border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/30'
          }`}
        >
          <Volume2 className="w-4 h-4 animate-bounce" />
          <span>{isPlayingDetails ? t('stop_audio') : t('button_details')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Image, Details, Timeline, Commenting */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Visual Photo Block */}
          {issue.imageUrl && (
            <div className="glass rounded-2xl overflow-hidden border border-white/5 bg-slate-950 flex items-center justify-center max-h-96">
              <img src={issue.imageUrl} alt={issue.title} className="max-h-96 object-contain" />
            </div>
          )}

          {/* Description Card */}
          <div className="glass p-6 rounded-2xl border border-white/5 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getCategoryColor(issue.category)}`}>
                {issue.category.toUpperCase()}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-gray-400 border border-white/5 uppercase">
                {issue.severity} Severity
              </span>
              <div className="flex items-center gap-1 text-[10px] text-gray-400 ml-auto font-mono">
                <Calendar className="w-3.5 h-3.5" />
                <span>{new Date(issue.reportedAt).toLocaleDateString()}</span>
              </div>
            </div>

            <p className="text-gray-300 text-sm leading-relaxed">{issue.description}</p>

            {issue.voiceUrl && (
              <div className="p-3.5 bg-slate-950/80 border border-white/5 rounded-2xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0 animate-pulse">
                  <Mic className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">Voice Report Message Attachment</p>
                  <audio controls src={issue.voiceUrl} className="w-full h-8 mt-1.5 focus:outline-none" />
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-3 border-t border-white/5">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <MapPin className="w-4 h-4 text-brand-primary" />
                <span>{issue.locationName}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400 sm:ml-auto">
                <User className="w-4 h-4 text-brand-secondary" />
                <span>Reporter: <strong className="text-white font-medium">{issue.reportedBy}</strong></span>
              </div>
            </div>
          </div>

          {/* Service Delivery Timeline Progression */}
          <div className="glass p-6 rounded-2xl border border-white/5 space-y-6">
            <h3 className="font-display font-bold text-sm text-white border-b border-white/5 pb-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-primary" />
              Status Timeline Progression
            </h3>
            
            {/* Horizontal timeline bar */}
            <div className="relative flex justify-between items-center max-w-xl mx-auto py-4">
              <div className="absolute left-2.5 right-2.5 top-[23px] h-1 bg-slate-800 -z-10" />
              <div 
                className="absolute left-2.5 top-[23px] h-1 bg-brand-primary -z-10 transition-all duration-300" 
                style={{ width: `${(currentStepIdx / 4) * 100}%` }}
              />

              {['Reported', 'Verified', 'Assigned', 'In Progress', 'Resolved'].map((step, idx) => {
                const isPassed = idx <= currentStepIdx;
                const isCurrent = idx === currentStepIdx;

                return (
                  <div key={step} className="flex flex-col items-center space-y-1.5 relative">
                    <div 
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        isCurrent 
                          ? 'bg-slate-950 border-brand-primary text-brand-primary font-bold scale-110 glow-primary' 
                          : isPassed 
                            ? 'bg-brand-primary border-brand-primary text-white' 
                            : 'bg-slate-950 border-slate-800 text-gray-600'
                      }`}
                    >
                      {isPassed ? '✓' : idx + 1}
                    </div>
                    <span className={`text-[9px] font-mono uppercase font-bold ${
                      isCurrent ? 'text-brand-primary' : isPassed ? 'text-white' : 'text-gray-500'
                    }`}>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Detailed Status History List with Clear Visual Separators */}
            <div className="space-y-6 relative pl-6 border-l border-white/10 ml-3">
              {issue.timeline.map((event) => {
                const config = getStatusConfig(event.status || 'Reported');
                return (
                  <div key={event.id} className="relative group transition-all duration-200">
                    
                    {/* Animated timeline connection node */}
                    <div className="absolute -left-[31px] top-4 flex items-center justify-center">
                      <div className={`w-3.5 h-3.5 rounded-full border border-slate-950 flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-125 ${config.dotColor}`}>
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      </div>
                    </div>

                    {/* Timeline card with colored left accent border */}
                    <div className={`bg-slate-900/40 hover:bg-slate-900/60 transition-colors border border-white/5 border-l-4 ${config.borderColor} rounded-xl p-4 space-y-3 shadow-md`}>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="p-1 bg-slate-950/80 rounded-lg border border-white/5">
                            {config.icon}
                          </span>
                          <span className="font-bold text-white text-sm sm:text-base">{event.title}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-black uppercase tracking-wider ${config.bgColor}`}>
                            {event.status || 'Reported'}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1 bg-slate-950/60 px-2 py-0.5 rounded-md border border-white/5">
                            <Clock className="w-3 h-3 text-gray-500" />
                            {new Date(event.timestamp).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </span>
                        </div>
                      </div>

                      <p className="text-gray-300 text-xs leading-relaxed font-sans">{event.description}</p>
                      
                      <div className="flex items-center gap-1.5 pt-2 border-t border-white/5 text-[10px] text-gray-500 font-mono">
                        <span>Initiated By:</span>
                        <span className="text-gray-300 font-medium px-1.5 py-0.5 bg-slate-950/80 border border-white/5 rounded-md">{event.by}</span>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Citizen Comment Feed Section */}
          <div className="glass p-6 rounded-2xl border border-white/5 space-y-6">
            <h3 className="font-display font-bold text-sm text-white flex items-center gap-1.5 border-b border-white/5 pb-2">
              <MessageSquare className="w-4 h-4 text-brand-secondary" />
              Community Discussion ({issue.comments.length})
            </h3>

            <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
              {issue.comments.map((comment) => (
                <div key={comment.id} className="p-3 bg-slate-900/50 border border-white/5 rounded-xl text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img src={comment.avatar} alt={comment.author} className="w-5 h-5 rounded-full" />
                      <span className="font-bold text-white">{comment.author}</span>
                      {comment.isAuthority && (
                        <span className="text-[8px] bg-brand-secondary/20 text-brand-secondary border border-brand-secondary/30 px-1.5 py-0.5 rounded-full font-bold">
                          AUTHORITY
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] text-gray-500 font-mono">{new Date(comment.timestamp).toLocaleDateString()}</span>
                  </div>
                  <p className="text-gray-300 leading-relaxed font-sans">{comment.text}</p>
                </div>
              ))}
              {issue.comments.length === 0 && (
                <p className="text-xs text-gray-500 text-center py-6">No discussions yet. Start the conversation!</p>
              )}
            </div>

            <form onSubmit={handleSendComment} className="flex gap-2">
              <input 
                type="text" 
                placeholder="Share a status update, community notice, or repair feedback..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 bg-slate-950 border border-white/5 focus:border-brand-primary/30 rounded-xl p-3 text-xs text-white focus:outline-none"
              />
              <button 
                type="submit"
                className="px-4 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl flex items-center justify-center transition-colors shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: AI Audit & Authority Admin Actions */}
        <div className="space-y-6">
          {/* AI agent verification overview */}
          <div className="glass p-5 rounded-2xl border border-white/5 space-y-4">
            <div className="flex items-center gap-1.5 border-b border-white/5 pb-2">
              <Sparkles className="w-4 h-4 text-brand-primary glow-primary" />
              <h3 className="font-display font-semibold text-xs text-white uppercase font-mono tracking-wide">AI Multi-Agent Diagnostic</h3>
            </div>

            {issue.aiAnalysis ? (
              <div className="space-y-4 text-xs">
                <div className="space-y-1">
                  <div className="text-gray-400">Classified Problem Type</div>
                  <div className="font-bold text-white text-sm">{issue.aiAnalysis.issueType}</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-900 rounded-xl border border-white/5 space-y-0.5">
                    <span className="text-[9px] text-gray-500 font-mono uppercase">CONFIDENCE</span>
                    <div className="text-sm font-bold text-white font-mono">{issue.aiAnalysis.confidenceScore}%</div>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-white/5 space-y-0.5">
                    <span className="text-[9px] text-gray-500 font-mono uppercase">PRIORITY INDEX</span>
                    <div className="text-sm font-bold text-brand-primary font-mono">{issue.aiAnalysis.priorityScore}/100</div>
                  </div>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-white/5 space-y-1">
                  <span className="text-[9px] text-gray-400 font-mono uppercase">ENVIRONMENTAL IMPACT REPORT</span>
                  <p className="text-[11px] text-gray-300 leading-relaxed font-sans">{issue.aiAnalysis.environmentalImpact}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-0.5">
                    <span className="text-gray-400">SLA Resolution Estimate</span>
                    <div className="font-bold text-white">{issue.aiAnalysis.resolutionTimeEstimate}</div>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-gray-400">Trust Factor</span>
                    <div className="font-bold text-brand-success">{issue.trustScore}%</div>
                  </div>
                </div>

                <div className="space-y-1 border-t border-white/5 pt-3">
                  <div className="text-gray-500">Suggested Dept Routing</div>
                  <div className="font-bold text-brand-secondary">{issue.aiAnalysis.suggestedDepartment}</div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500 py-4">No AI diagnosis telemetry logged for this record.</p>
            )}
          </div>

          {/* Verification Call to action (Upvoting) */}
          <div className="glass p-5 rounded-2xl border border-white/5 space-y-3 text-center">
            <h4 className="text-xs font-semibold text-white">Help verify this reported hazard</h4>
            <p className="text-[10px] text-gray-400 leading-snug">
              Has this incident impacted you or do you see it at the location? Press Verify to elevate municipal attention.
            </p>
            <button
              onClick={() => onUpvote(issue.id)}
              className={`w-full py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                issue.userUpvoted 
                  ? 'bg-brand-primary/20 text-white border-brand-primary/30 glow-primary' 
                  : 'bg-slate-950 text-gray-300 border-white/5 hover:text-white hover:bg-slate-900'
              }`}
            >
              <ArrowUp className="w-4 h-4" />
              <span>{issue.upvotes} Citizens Have Verified</span>
            </button>
          </div>

          {/* AUTHORITY ADMINISTRATIVE ACTIONS */}
          {userRole === 'authority' && (
            <div className="glass p-5 rounded-2xl border border-brand-secondary/30 bg-gradient-to-br from-brand-secondary/5 to-transparent space-y-4">
              <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                <CheckCircle2 className="w-4 h-4 text-brand-secondary" />
                <h3 className="font-display font-semibold text-xs text-white uppercase font-mono tracking-wide">Authority Action Desk</h3>
              </div>

              <div className="space-y-4">
                {/* Department Assignment */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-gray-300 font-mono">RE-ASSIGN AGENCY</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Aegis Public Works"
                    value={assignedDept}
                    onChange={(e) => setAssignedDept(e.target.value)}
                    className="w-full bg-slate-950 border border-white/5 focus:border-brand-secondary/30 rounded-xl p-2.5 text-xs text-white focus:outline-none"
                  />
                </div>

                {/* Status buttons */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-gray-300 font-mono font-bold">TRANSITION WORK ORDER STATE</label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {(['Reported', 'Verified', 'Assigned', 'In Progress', 'Resolved'] as IssueStatus[]).map((st) => (
                      <button
                        key={st}
                        onClick={() => handleUpdateStatus(st)}
                        className={`py-2 px-1 rounded-lg font-semibold border text-[11px] transition-all ${
                          issue.status === st
                            ? 'bg-brand-secondary/20 text-white border-brand-secondary/40 font-bold shadow-md'
                            : 'bg-slate-950 text-gray-400 border-white/5 hover:bg-slate-900 hover:text-white'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5 text-[10px] text-gray-400 leading-snug">
                  Changing status triggers automated alerts to reporters, and logs the action on the audited civic timeline.
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
