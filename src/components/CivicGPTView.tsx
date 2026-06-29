/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Cpu, Sparkles, MessageSquare, AlertTriangle, 
  HelpCircle, Loader2, Compass, BrainCircuit, MapPin, 
  CheckCircle2, Flame, RefreshCw, ExternalLink, MessageCircle,
  SlidersHorizontal
} from 'lucide-react';
import { CivicMessage } from '../types';

export default function CivicGPTView() {
  const [messages, setMessages] = useState<CivicMessage[]>([
    {
      id: 'm-init',
      sender: 'bot',
      text: `Greetings! I am **CivicGPT**, your live Civic Intelligence AI companion.

I have full real-time access to Aegis City's reported complaints, digital twin telemetry, and forecast models.

Here are a few quick scenarios I can calculate or prepare for you:
* **"Summarize today's complaints"** – Synthesize high-priority active hazards.
* **"Predict infrastructure failures"** – Map early warning predictions.
* **"Show issues near me"** – Scan local reports around Ward 2.
* **"Generate weekly civic report"** – Compile an executive municipal health audit.

How can I assist your civic intelligence objectives today?`,
      timestamp: new Date().toLocaleTimeString(),
      data: {
        modelUsed: 'gemini-3.5-flash',
        roleUsed: 'general'
      }
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Custom intelligence controls
  const [selectedModel, setSelectedModel] = useState<'gemini-3.5-flash' | 'gemini-3.1-pro-preview' | 'gemini-3.1-flash-lite'>('gemini-3.5-flash');
  const [selectedRole, setSelectedRole] = useState<'general' | 'complex' | 'fast'>('general');
  const [enableThinking, setEnableThinking] = useState(false);
  const [useMapsGrounding, setUseMapsGrounding] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showSettings, setShowSettings] = useState(true);

  useEffect(() => {
    if (window.innerWidth < 768) {
      setShowSettings(false);
    }
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    'Predict infrastructure failures',
    'Summarize today\'s complaints',
    'Generate weekly civic report',
    'Show issues near me'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle Geolocation for Maps Grounding
  useEffect(() => {
    if (useMapsGrounding) {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (error) => {
            console.warn("Could not retrieve precise GPS coordinates, using default Aegis city ward:", error);
            // Default to central Bangalore / Aegis coordinates
            setUserLocation({ latitude: 12.9716, longitude: 77.5946 });
          }
        );
      } else {
        setUserLocation({ latitude: 12.9716, longitude: 77.5946 });
      }
    } else {
      setUserLocation(null);
    }
  }, [useMapsGrounding]);

  // Adjust thinking mode support based on model
  useEffect(() => {
    if (selectedModel !== 'gemini-3.1-pro-preview') {
      setEnableThinking(false);
    }
  }, [selectedModel]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: CivicMessage = {
      id: `m-u-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/civic-gpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({
            sender: m.sender,
            text: m.text
          })),
          model: selectedModel,
          role: selectedRole,
          enableThinking: enableThinking,
          useMapsGrounding: useMapsGrounding,
          latitude: userLocation?.latitude,
          longitude: userLocation?.longitude
        })
      });

      if (response.ok) {
        const data = await response.json();
        const botMsg: CivicMessage = {
          id: `m-b-${Date.now()}`,
          sender: 'bot',
          text: data.text,
          timestamp: new Date().toLocaleTimeString(),
          data: {
            groundingChunks: data.groundingChunks,
            modelUsed: data.modelUsed,
            roleUsed: data.roleUsed,
            thinkingEnabled: data.thinkingEnabled
          }
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        const errorMsg: CivicMessage = {
          id: `m-err-${Date.now()}`,
          sender: 'bot',
          text: '⚠️ **System Notice**: I encountered an issue connecting to the Gemini backend. Please verify your Gemini API key in the Settings or try again.',
          timestamp: new Date().toLocaleTimeString()
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (err) {
      console.error('CivicGPT error:', err);
      const errorMsg: CivicMessage = {
        id: `m-err-${Date.now()}`,
        sender: 'bot',
        text: '⚠️ **Fallback Alert**: The server is currently offline or unreachable. Rendering simulated offline context.',
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Safe markdown and tag parser
  const parseMarkdown = (text: string) => {
    return text.split('\n').map((line, idx) => {
      let trimmed = line.trim();
      
      // Headers
      if (trimmed.startsWith('### ')) {
        return <h4 key={idx} className="font-display font-bold text-sm text-white mt-3 mb-1.5 uppercase font-mono tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-1">{trimmed.replace('### ', '')}</h4>;
      }
      if (trimmed.startsWith('#### ')) {
        return <h5 key={idx} className="font-display font-bold text-xs text-brand-primary mt-2 mb-1 uppercase font-mono tracking-wide">{trimmed.replace('#### ', '')}</h5>;
      }
      
      // Bullets
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        let content = trimmed.substring(2);
        const boldParts = content.split(/\*\*(.*?)\*\*/g);
        return (
          <li key={idx} className="list-disc pl-1 ml-4 text-xs text-slate-300 leading-relaxed font-sans mb-1">
            {boldParts.map((part, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="text-white font-semibold">{part}</strong> : part)}
          </li>
        );
      }

      // Ordered list
      if (/^\d+\.\s/.test(trimmed)) {
        let content = trimmed.replace(/^\d+\.\s/, '');
        const boldParts = content.split(/\*\*(.*?)\*\*/g);
        return (
          <li key={idx} className="list-decimal pl-1 ml-4 text-xs text-slate-300 leading-relaxed font-sans mb-1">
            {boldParts.map((part, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="text-white font-semibold">{part}</strong> : part)}
          </li>
        );
      }

      // Plain lines with optional Bold parsing
      if (trimmed === '') return <div key={idx} className="h-1.5" />;

      const boldParts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <p key={idx} className="text-xs text-slate-300 leading-relaxed font-sans mb-1">
          {boldParts.map((part, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="text-white font-semibold">{part}</strong> : part)}
        </p>
      );
    });
  };

  // Render Google Maps Grounding links and information as cards
  const renderGroundingSources = (msg: CivicMessage) => {
    const chunks = msg.data?.groundingChunks;
    if (!chunks || !Array.isArray(chunks) || chunks.length === 0) return null;

    // Filter out chunks containing maps information
    const mapChunks = chunks.filter((chunk: any) => chunk?.maps !== undefined || chunk?.web !== undefined);
    if (mapChunks.length === 0) return null;

    return (
      <div className="mt-3.5 pt-3.5 border-t border-white/5 space-y-2">
        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-mono font-bold uppercase tracking-wider">
          <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
          Google Maps Grounding Sources ({mapChunks.length})
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {mapChunks.map((chunk: any, cIdx: number) => {
            const isMap = !!chunk.maps;
            const source = isMap ? chunk.maps : chunk.web;
            const uri = source?.uri;
            const title = source?.title || (isMap ? "Google Maps Place" : "Web Resource");
            const reviews = source?.placeAnswerSources?.reviewSnippets || [];

            return (
              <a 
                key={cIdx}
                href={uri}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col p-2.5 bg-slate-950/80 hover:bg-slate-900 border border-white/5 hover:border-cyan-500/30 rounded-xl transition-all group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-cyan-400 transition-colors line-clamp-1">{title}</span>
                  </div>
                  <ExternalLink className="w-3 h-3 text-gray-500 group-hover:text-cyan-400 transition-colors shrink-0 mt-0.5" />
                </div>
                {reviews.length > 0 && (
                  <p className="mt-1.5 text-[10px] text-gray-400 italic leading-relaxed line-clamp-2 pl-1 border-l border-white/5">
                    "{reviews[0].text}"
                  </p>
                )}
                <span className="mt-1 text-[9px] text-gray-500 font-mono truncate">{uri}</span>
              </a>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-4 h-[calc(100vh-100px)] md:h-[calc(100vh-90px)] flex flex-col gap-3">
      
      {/* Title & Stats HUD */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/5 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center glow-primary">
            <Cpu className="w-4.5 h-4.5 text-brand-primary animate-pulse" />
          </div>
          <div>
            <h2 className="font-display font-bold text-base text-white">CivicGPT Agent Desk</h2>
            <p className="text-[10px] text-gray-400 font-mono">LAZY CHAT ENGINE • MULTI-TURN AI DECISION MAKER</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10 hover:border-white/20 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer transition-all"
          >
            <SlidersHorizontal className="w-3 h-3 text-brand-primary" />
            <span>{showSettings ? 'Hide AI Settings' : 'Configure AI'}</span>
          </button>
          {enableThinking && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-violet-500/10 text-violet-400 border border-violet-500/25 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider animate-pulse">
              <BrainCircuit className="w-3.5 h-3.5" />
              HIGH THINKING
            </span>
          )}
          {useMapsGrounding && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider animate-pulse">
              <Compass className="w-3.5 h-3.5" />
              MAPS GROUNDING
            </span>
          )}
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-brand-success/15 text-brand-success border border-brand-success/25 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            AI SECURE
          </span>
        </div>
      </div>

      {/* Advanced AI Settings Control Board */}
      {showSettings && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-900/60 border border-white/5 rounded-2xl p-4 animate-in fade-in duration-200">
        {/* Model Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Gemini Engine</label>
          <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-white/5">
            <button
              type="button"
              onClick={() => setSelectedModel('gemini-3.5-flash')}
              className={`py-1 text-[10px] font-semibold rounded-lg font-mono transition-all ${
                selectedModel === 'gemini-3.5-flash' 
                  ? 'bg-brand-primary text-white shadow-md' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              3.5-FLASH
            </button>
            <button
              type="button"
              onClick={() => setSelectedModel('gemini-3.1-pro-preview')}
              className={`py-1 text-[10px] font-semibold rounded-lg font-mono transition-all ${
                selectedModel === 'gemini-3.1-pro-preview' 
                  ? 'bg-brand-primary text-white shadow-md' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              3.1-PRO
            </button>
            <button
              type="button"
              onClick={() => setSelectedModel('gemini-3.1-flash-lite')}
              className={`py-1 text-[10px] font-semibold rounded-lg font-mono transition-all ${
                selectedModel === 'gemini-3.1-flash-lite' 
                  ? 'bg-brand-primary text-white shadow-md' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              LITE
            </button>
          </div>
          <span className="text-[9px] text-gray-500 font-sans italic">
            {selectedModel === 'gemini-3.1-pro-preview' && "💡 Complex/analytical reasoning enabled."}
            {selectedModel === 'gemini-3.5-flash' && "💡 Default choice for robust smart tasks."}
            {selectedModel === 'gemini-3.1-flash-lite' && "💡 Extremely responsive, fast completions."}
          </span>
        </div>

        {/* Persona Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Assistant Role</label>
          <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-white/5">
            <button
              type="button"
              onClick={() => setSelectedRole('general')}
              className={`py-1 text-[10px] font-semibold rounded-lg font-mono transition-all ${
                selectedRole === 'general' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              PLANNER
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('complex')}
              className={`py-1 text-[10px] font-semibold rounded-lg font-mono transition-all ${
                selectedRole === 'complex' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              INSPECTOR
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('fast')}
              className={`py-1 text-[10px] font-semibold rounded-lg font-mono transition-all ${
                selectedRole === 'fast' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              DISPATCH
            </button>
          </div>
          <span className="text-[9px] text-gray-500 font-sans italic">
            {selectedRole === 'general' && "💡 Planner: Analytical, friendly & comprehensive."}
            {selectedRole === 'complex' && "💡 Inspector: Deep diagnostics, hazard analysis."}
            {selectedRole === 'fast' && "💡 Dispatch: Concise instructions & actions."}
          </span>
        </div>

        {/* High Thinking Mode Toggle */}
        <div className="flex flex-col justify-between p-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <BrainCircuit className={`w-4 h-4 ${selectedModel === 'gemini-3.1-pro-preview' ? 'text-violet-400' : 'text-gray-600'}`} />
              <div className="flex flex-col">
                <span className={`text-[10px] font-bold uppercase tracking-wider font-mono ${selectedModel === 'gemini-3.1-pro-preview' ? 'text-slate-300' : 'text-gray-600'}`}>High Thinking</span>
                <span className="text-[9px] text-gray-500">Enable advanced logic</span>
              </div>
            </div>
            <button
              type="button"
              disabled={selectedModel !== 'gemini-3.1-pro-preview'}
              onClick={() => setEnableThinking(!enableThinking)}
              className={`w-9 h-5 rounded-full transition-all relative ${
                selectedModel !== 'gemini-3.1-pro-preview' 
                  ? 'bg-slate-950/20 opacity-30 cursor-not-allowed' 
                  : enableThinking 
                    ? 'bg-violet-600' 
                    : 'bg-slate-800'
              }`}
            >
              <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all ${
                enableThinking ? 'left-4.5' : 'left-0.5'
              }`} />
            </button>
          </div>
          <span className="text-[8px] text-gray-500 font-mono mt-1">
            {selectedModel !== 'gemini-3.1-pro-preview' 
              ? "⚠️ Requires Gemini 3.1-Pro" 
              : "✓ ThinkingLevel set to HIGH"}
          </span>
        </div>

        {/* Google Maps Grounding Toggle */}
        <div className="flex flex-col justify-between p-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Compass className={`w-4 h-4 ${useMapsGrounding ? 'text-cyan-400' : 'text-gray-600'}`} />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono">Maps Grounding</span>
                <span className="text-[9px] text-gray-500">Fetch live locations</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setUseMapsGrounding(!useMapsGrounding)}
              className={`w-9 h-5 rounded-full transition-all relative ${
                useMapsGrounding ? 'bg-cyan-600' : 'bg-slate-800'
              }`}
            >
              <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all ${
                useMapsGrounding ? 'left-4.5' : 'left-0.5'
              }`} />
            </button>
          </div>
          <span className="text-[8px] text-gray-500 font-mono mt-1">
            {useMapsGrounding 
              ? `✓ GPS Lat: ${userLocation?.latitude?.toFixed(4) || "..."} Lon: ${userLocation?.longitude?.toFixed(4) || "..."}` 
              : "✓ Local database only"}
          </span>
        </div>
      </div>
      )}

      {/* Main Messages Stage */}
      <div className="flex-1 bg-slate-950/60 border border-white/5 rounded-2xl p-4 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div 
            key={msg.id}
            className={`flex gap-3 max-w-3.5xl ${
              msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
            }`}
          >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-mono font-bold border shrink-0 ${
              msg.sender === 'user' 
                ? 'bg-slate-900 border-white/10 text-slate-300' 
                : 'bg-gradient-to-br from-brand-primary to-brand-secondary border-transparent text-white shadow-lg shadow-brand-primary/10'
            }`}>
              {msg.sender === 'user' ? 'USR' : 'AI'}
            </div>

            {/* Bubble */}
            <div className={`rounded-2xl p-4 border text-left space-y-2.5 relative shadow-md w-full ${
              msg.sender === 'user'
                ? 'bg-brand-primary/10 border-brand-primary/20 text-white rounded-tr-none'
                : 'bg-slate-900/90 border-white/5 text-slate-100 rounded-tl-none'
            }`}>
              <div className="flex items-center justify-between gap-6 mb-1 border-b border-white/5 pb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-gray-400 font-mono tracking-wider font-bold">
                    {msg.sender === 'user' ? 'CIVIC OPERATOR' : 'CIVICGPT'}
                  </span>
                  {!msg.sender || msg.sender === 'bot' && msg.data && (
                    <span className="text-[8px] bg-slate-950 border border-white/10 text-gray-400 font-mono px-1.5 py-0.5 rounded">
                      ENGINE: {msg.data.modelUsed?.toUpperCase() || '3.5-FLASH'} • ROLE: {msg.data.roleUsed?.toUpperCase() || 'PLANNER'}
                      {msg.data.thinkingEnabled && " [THINKING]"}
                    </span>
                  )}
                </div>
                <span className="text-[9px] text-gray-500 font-mono">{msg.timestamp}</span>
              </div>
              <div className="space-y-1">
                {parseMarkdown(msg.text)}
              </div>
              {msg.sender === 'bot' && renderGroundingSources(msg)}
            </div>
          </div>
        ))}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex gap-3 max-w-3xl">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-white shrink-0">
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            </div>
            <div className="rounded-2xl p-4 bg-slate-900/95 border border-white/5 text-slate-300 rounded-tl-none flex flex-col gap-2 shadow-lg">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-cyan-400 animate-pulse font-bold">
                  {selectedRole === 'complex' && "Forensic analysis engine loading..."}
                  {selectedRole === 'fast' && "Immediate dispatcher syncing field telemetry..."}
                  {selectedRole === 'general' && "Querying civic planner database..."}
                </span>
              </div>
              <div className="text-[10px] text-gray-500 font-mono flex flex-wrap gap-1">
                <span>Model: {selectedModel}</span>
                <span>•</span>
                <span>Role: {selectedRole}</span>
                {enableThinking && (
                  <>
                    <span>•</span>
                    <span className="text-violet-400 animate-pulse">Thinking Level: HIGH</span>
                  </>
                )}
                {useMapsGrounding && (
                  <>
                    <span>•</span>
                    <span className="text-cyan-400 animate-pulse">Maps Grounding: Active</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Triggers */}
      <div className="flex flex-row md:flex-wrap gap-1.5 overflow-x-auto md:justify-center pb-2 md:pb-0 px-1 scrollbar-thin scrollbar-thumb-slate-800 max-w-full shrink-0">
        {suggestions.map((sug) => (
          <button
            key={sug}
            type="button"
            disabled={isLoading}
            onClick={() => handleSendMessage(sug)}
            className="px-3 py-1.5 bg-slate-900/80 border border-white/5 hover:border-brand-primary/30 rounded-xl text-[10px] text-gray-400 hover:text-white transition-all font-medium disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
          >
            <MessageCircle className="w-3 h-3 text-brand-primary" />
            {sug}
          </button>
        ))}
      </div>

      {/* Input Field */}
      <form 
        onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputText); }}
        className="flex gap-2 bg-slate-900 p-1.5 border border-white/10 rounded-2xl"
      >
        <input 
          type="text" 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            selectedRole === 'complex' 
              ? "E.g. Analyze critical threats near Ward 2" 
              : selectedRole === 'fast' 
                ? "E.g. Clear instruction for storm drain blockage" 
                : "E.g. Which ward is doing the best in road health?"
          }
          disabled={isLoading}
          className="flex-1 bg-transparent p-3 text-xs text-white focus:outline-none placeholder-gray-500 disabled:opacity-50"
        />
        <button 
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="px-5 bg-brand-primary hover:bg-brand-primary/95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md disabled:opacity-50 glow-primary cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
}

