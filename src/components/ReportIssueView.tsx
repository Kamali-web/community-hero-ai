/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldAlert, Image, Mic, MapPin, Sparkles, AlertCircle, Loader2, UploadCloud, Info } from 'lucide-react';
import { CivicIssue, IssueCategory } from '../types';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  'AIzaSyAlrsvxrtsa9qs6uUhHbIod2Bd89EEJWC4';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

interface ReportIssueViewProps {
  onIssueReported: (issue: CivicIssue) => void;
  onSaveOfflineDraft?: (issue: CivicIssue) => void;
  isOnline?: boolean;
  setCurrentTab: (tab: string) => void;
  setSelectedIssueId: (id: string) => void;
  userProfile?: any;
  prefilledData?: {
    title: string;
    description: string;
    category: IssueCategory;
    imageUrl: string;
    aiAnalysis?: any;
  } | null;
  onClearPrefilledData?: () => void;
}

export default function ReportIssueView({ 
  onIssueReported, 
  onSaveOfflineDraft,
  isOnline,
  setCurrentTab,
  setSelectedIssueId,
  userProfile,
  prefilledData,
  onClearPrefilledData
}: ReportIssueViewProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IssueCategory>('Roads');
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState('12.9716');
  const [longitude, setLongitude] = useState('77.5946');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [reportedBy, setReportedBy] = useState(userProfile?.name || 'Civic Hero');

  // Handle cross-view prefilled reporting data
  React.useEffect(() => {
    if (prefilledData) {
      setTitle(prefilledData.title || '');
      setDescription(prefilledData.description || '');
      setCategory(prefilledData.category || 'Roads');
      setImageUrl(prefilledData.imageUrl || null);
      if (prefilledData.aiAnalysis) {
        setAiPreview(prefilledData.aiAnalysis);
      }
      if (onClearPrefilledData) {
        onClearPrefilledData();
      }
    }
  }, [prefilledData, onClearPrefilledData]);

  // Keep reportedBy in sync with profile
  React.useEffect(() => {
    if (userProfile?.name) {
      setReportedBy(userProfile.name);
    }
  }, [userProfile]);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiPreview, setAiPreview] = useState<any | null>(null);

  const [voiceRecording, setVoiceRecording] = useState(false);
  const [voiceUrl, setVoiceUrl] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recognition, setRecognition] = useState<any | null>(null);

  // Initialize SpeechRecognition on load if available
  React.useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';
      
      rec.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          setDescription((prev) => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${finalTranscript}` : finalTranscript;
          });
        }
      };
      
      rec.onerror = (err: any) => {
        console.warn('Speech recognition error:', err);
      };
      
      setRecognition(rec);
    }
  }, []);

  // Preset Sample Issues for quick testing (very friendly UX!)
  const samplePresets = [
    {
      title: 'Deep road fissure splitting lane',
      desc: 'A major structural asphalt crack has opened on M.G. Road. It stretches across almost the entire lane, making vehicles bounce aggressively.',
      cat: 'Roads' as IssueCategory,
      loc: '788 Mahatma Gandhi Road, Ward 4',
      lat: '12.9756',
      lng: '77.5964',
      img: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=400&q=80'
    },
    {
      title: 'Major underground pipe burst flooding avenue',
      desc: 'Water is gushing out under pressure from the pavement, creating a huge lake on the street. It has been flowing for over an hour now.',
      cat: 'Water' as IssueCategory,
      loc: '244 Nehru Nagar Ring Road, Ward 2',
      lat: '12.9692',
      lng: '77.5898',
      img: 'https://images.unsplash.com/photo-1542013936693-8848e5740a7a?auto=format&fit=crop&w=400&q=80'
    },
    {
      title: 'Hazardous chemicals and battery piles in park',
      desc: 'Discovered several discarded car batteries and blue industrial canisters in the public reserve area behind Koramangala 3rd Block. Acid might leak into soil.',
      cat: 'Waste' as IssueCategory,
      loc: 'Koramangala 3rd Block Greenbelt, Ward 5',
      lat: '12.9348',
      lng: '77.6189',
      img: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=400&q=80'
    }
  ];

  const handleApplyPreset = (preset: typeof samplePresets[0]) => {
    setTitle(preset.title);
    setDescription(preset.desc);
    setCategory(preset.cat);
    setLocationName(preset.loc);
    setLatitude(preset.lat);
    setLongitude(preset.lng);
    setImageUrl(preset.img);
    setAiPreview(null);
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      if (res.ok) {
        const data = await res.json();
        const address = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        setLocationName(address);
      } else {
        setLocationName(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      }
    } catch (err) {
      console.error('Error reverse geocoding:', err);
      setLocationName(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    }
  };

  const handleLocalDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        setLatitude(lat.toFixed(5));
        setLongitude(lng.toFixed(5));
        await reverseGeocode(lat, lng);
      },
      (error) => {
        console.error('Error detecting geolocation:', error);
        // Fallback to random offset around Bengaluru (which is the app's standard city setting)
        const randomOffsetLat = (Math.random() - 0.5) * 0.02;
        const randomOffsetLng = (Math.random() - 0.5) * 0.02;
        const detectedLat = 12.9716 + randomOffsetLat;
        const detectedLng = 77.5946 + randomOffsetLng;
        setLatitude(detectedLat.toFixed(5));
        setLongitude(detectedLng.toFixed(5));
        reverseGeocode(detectedLat, detectedLng);
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  const handleMapClick = async (event: any) => {
    if (!event.detail.latLng) return;
    const lat = event.detail.latLng.lat;
    const lng = event.detail.latLng.lng;
    setLatitude(lat.toFixed(5));
    setLongitude(lng.toFixed(5));
    await reverseGeocode(lat, lng);
  };

  const handleSimulateVoiceInput = () => {
    setVoiceRecording(true);
    setTimeout(() => {
      setVoiceRecording(false);
      setTitle('Pothole and broken streetlight on Residency Road');
      setDescription('Report filed via Voice: I am walking down Residency Road and there is a massive pothole in the bike lane. Also, the nearest streetlight is blinking uncontrollably.');
      setCategory('Roads');
      setLocationName('Residency Road Corridor, Ward 4');
      setLatitude('12.9723');
      setLongitude('77.5989');
    }, 2000);
  };

  const handleToggleVoiceRecording = async () => {
    if (voiceRecording) {
      // Stop voice recording
      setVoiceRecording(false);
      
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
      
      if (recognition) {
        recognition.stop();
      }
    } else {
      // Start recording
      setVoiceRecording(true);
      setVoiceUrl(null);
      const chunks: Blob[] = [];
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            chunks.push(e.data);
          }
        };
        
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);
          setVoiceUrl(url);
          
          // Stop all mic tracks
          stream.getTracks().forEach(track => track.stop());
        };
        
        recorder.start();
        setMediaRecorder(recorder);
        
        if (recognition) {
          try {
            recognition.start();
          } catch (recErr) {
            console.warn('Speech recognition start error:', recErr);
          }
        } else {
          setDescription((prev) => {
            const base = prev.trim();
            return base ? `${base}\n[Audio Recording Active]` : 'Reporting live via Voice...';
          });
        }
      } catch (err) {
        console.error('Failed to access microphone for recording:', err);
        alert('Microphone access is required for real voice report recording.');
        setVoiceRecording(false);
      }
    }
  };

  const handleRunAIAnalysis = async () => {
    if (!title || !description) {
      alert('Please fill out Title and Description to run the AI Agents.');
      return;
    }
    setIsAnalyzing(true);
    
    try {
      // Simulate real server call or query
      const response = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          locationName,
          latitude,
          longitude,
          imageUrl,
          reportedBy,
          justAnalyzeOnly: true // custom flag or just run actual submission
        })
      });

      if (response.ok) {
        const data: CivicIssue = await response.json();
        if (data.aiAnalysis) {
          setAiPreview(data.aiAnalysis);
        }
      }
    } catch (err) {
      console.error('AI Pre-Analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !locationName) {
      alert('Please fill in all required fields.');
      return;
    }
    setIsSubmitting(true);

    const offlineMode = isOnline === false || !navigator.onLine || localStorage.getItem('simulated_offline') === 'true';

    if (offlineMode) {
      try {
        const id = `draft-${Date.now()}`;
        const reportedAt = new Date().toISOString();
        const aiAnalysis: any = aiPreview || {
          issueType: `${category} Infrastructure Issue`,
          severity: 'Medium',
          confidenceScore: 85,
          priorityScore: 60,
          suggestedDepartment: 'Municipal Utilities',
          spamProbability: 5,
          duplicateDetected: false,
          potentialDuplicateId: null,
          environmentalImpact: 'Evaluation pending online connectivity.',
          resolutionTimeEstimate: 'Pending Sync',
          riskScore: 60
        };

        const offlineIssue: CivicIssue = {
          id,
          title,
          description,
          category,
          status: 'Reported',
          severity: aiAnalysis.severity,
          priorityScore: aiAnalysis.priorityScore,
          confidenceScore: aiAnalysis.confidenceScore,
          trustScore: 90,
          locationName,
          latitude: parseFloat(latitude as any) || 37.7749,
          longitude: parseFloat(longitude as any) || -122.4194,
          imageUrl: imageUrl || null,
          voiceUrl: voiceUrl || null,
          reportedBy: reportedBy || 'Sarah Jenkins',
          reportedAt,
          assignedDepartment: aiAnalysis.suggestedDepartment,
          upvotes: 1,
          userUpvoted: true,
          comments: [],
          timeline: [
            {
              id: `t-${Date.now()}-1`,
              status: 'Reported',
              title: 'Offline Draft Saved',
              description: 'Created while offline. Automatically queued for syncing.',
              timestamp: reportedAt,
              by: 'System AI'
            }
          ],
          aiAnalysis
        };

        // Save to localStorage drafts
        const existingDraftsJson = localStorage.getItem('aegis_report_drafts');
        const existingDrafts = existingDraftsJson ? JSON.parse(existingDraftsJson) : [];
        existingDrafts.unshift(offlineIssue);
        localStorage.setItem('aegis_report_drafts', JSON.stringify(existingDrafts));

        if (onSaveOfflineDraft) {
          onSaveOfflineDraft(offlineIssue);
        }

        alert('📴 Saved as Offline Draft! Your report has been stored locally on your device. Aegis will automatically sync it to the cloud ledger once connectivity is restored.');
        
        setSelectedIssueId(offlineIssue.id);
        setCurrentTab('issue-details');
      } catch (err) {
        console.error('Error saving offline draft:', err);
        alert('Failed to save draft locally.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    try {
      const response = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          locationName,
          latitude,
          longitude,
          imageUrl,
          reportedBy,
          voiceUrl,
          aiAnalysis: aiPreview // reuse the pre-calculated AI analysis to make submission instant!
        })
      });

      if (response.ok) {
        const createdIssue: CivicIssue = await response.json();
        onIssueReported(createdIssue);
        setSelectedIssueId(createdIssue.id);
        setCurrentTab('issue-details');
      } else {
        alert('Could not submit. Ensure server is active.');
      }
    } catch (err) {
      console.error('Error submitting complaint:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new window.Image();
        img.onload = () => {
          const maxDim = 800;
          let width = img.width;
          let height = img.height;
          
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Compress as JPEG to make transmission and Gemini processing extremely fast
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            setImageUrl(compressedBase64);
          } else {
            setImageUrl(reader.result as string);
          }
          setAiPreview(null);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h2 className="font-display font-bold text-3xl text-white">File Incident Report</h2>
          <p className="text-xs text-gray-400 font-mono tracking-wide">AI-POWERED ANALYSIS & AUTOMATED DEPT ROUTING</p>
        </div>

        {/* Preset Testing helper */}
        <div className="glass p-5 rounded-2xl border border-brand-primary/20 space-y-3 bg-gradient-to-r from-brand-primary/5 to-transparent">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <Sparkles className="w-4 h-4 text-brand-primary animate-pulse" />
            <span>Developer Sandbox Quick Presets</span>
          </div>
          <p className="text-xs text-gray-400">
            Click any incident preset below to immediately pre-fill uploader context and verify Gemini Agent classifications:
          </p>
          <div className="flex flex-wrap gap-2">
            {samplePresets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className="px-3 py-1.5 bg-slate-900 border border-white/5 hover:border-brand-primary/30 rounded-xl text-xs text-gray-300 hover:text-white transition-all flex items-center gap-1.5"
              >
                <div className="w-2 h-2 rounded-full bg-brand-primary" />
                {preset.cat}: {preset.title.substring(0, 20)}...
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Content */}
          <form onSubmit={handleSubmitReport} className="lg:col-span-2 space-y-6">
            <div className="glass p-6 rounded-2xl border border-white/5 space-y-4">
              
              {/* Category Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300 font-mono">INCIDENT CLASSIFICATION</label>
                <div className="flex flex-wrap gap-2">
                  {(['Roads', 'Water', 'Waste', 'Lighting', 'Safety'] as IssueCategory[]).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center flex-1 sm:flex-initial min-w-[75px] ${
                        category === cat 
                          ? 'bg-brand-primary/20 text-white border-brand-primary/40' 
                          : 'bg-slate-950 text-gray-400 border-white/5 hover:bg-slate-900'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300 font-mono">INCIDENT HEADING *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Major water mains rupture flooding Oakwood entrance"
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); setAiPreview(null); }}
                  className="w-full bg-slate-950 border border-white/5 focus:border-brand-primary/30 rounded-xl p-3 text-sm text-white focus:outline-none"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-gray-300 font-mono">DESCRIPTION & IMPACT DETAILS *</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleToggleVoiceRecording}
                      className={`flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-1 rounded-md border transition-all ${
                        voiceRecording 
                          ? 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse' 
                          : 'bg-brand-primary/5 hover:bg-brand-primary/15 border-brand-primary/20 text-brand-primary'
                      }`}
                    >
                      <Mic className="w-3 h-3 animate-bounce" />
                      {voiceRecording ? '🎙️ STOP & SAVE VOICE' : '🎙️ START VOICE REPORT'}
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleSimulateVoiceInput}
                      className="text-[10px] text-gray-400 hover:text-white font-mono flex items-center gap-1 transition-colors"
                      title="Auto-fills standard sandbox speech values"
                    >
                      <span>🤖 SIMULATE VOICE</span>
                    </button>
                  </div>
                </div>
                {voiceUrl && (
                  <div className="p-2.5 bg-slate-950 border border-brand-primary/20 rounded-xl flex items-center gap-3 mb-2 animate-fadeIn">
                    <div className="w-6 h-6 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0">
                      <Mic className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] text-brand-success font-mono font-bold uppercase tracking-wider">✓ Voice message recorded & attached!</p>
                      <audio src={voiceUrl} controls className="w-full h-7 mt-1" />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setVoiceUrl(null)} 
                      className="text-[10px] text-red-400 hover:underline font-mono"
                    >
                      Remove
                    </button>
                  </div>
                )}
                <textarea 
                  rows={4}
                  required
                  placeholder="Describe the physical state, proximity to schools or hospitals, and how many households are affected..."
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); setAiPreview(null); }}
                  className="w-full bg-slate-950 border border-white/5 focus:border-brand-primary/30 rounded-xl p-3 text-sm text-white focus:outline-none"
                />
              </div>

              {/* Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-gray-300 font-mono">STREET LOCATION *</label>
                    <button
                      type="button"
                      onClick={handleLocalDetectLocation}
                      className="text-[10px] text-brand-primary font-mono hover:underline flex items-center gap-1"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      AUTO-DETECT POSITION
                    </button>
                  </div>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. 102 Oakwood Avenue, Ward 2"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    className="w-full bg-slate-950 border border-white/5 focus:border-brand-primary/30 rounded-xl p-3 text-sm text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300 font-mono">LATITUDE</label>
                  <input 
                    type="text" 
                    placeholder="Latitude"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="w-full bg-slate-950 border border-white/5 focus:border-brand-primary/30 rounded-xl p-3 text-sm text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300 font-mono">LONGITUDE</label>
                  <input 
                    type="text" 
                    placeholder="Longitude"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="w-full bg-slate-950 border border-white/5 focus:border-brand-primary/30 rounded-xl p-3 text-sm text-white focus:outline-none"
                  />
                </div>

                {/* Interactive Map Component Container */}
                <div className="sm:col-span-2 space-y-1.5">
                  <span className="text-xs font-semibold text-gray-300 font-mono block">INTERACTIVE MAP TRACKER</span>
                  <div className="w-full h-64 rounded-xl overflow-hidden border border-white/10 relative bg-slate-950">
                    {hasValidKey ? (
                      <APIProvider apiKey={API_KEY} version="weekly">
                        <Map
                          center={{ lat: parseFloat(latitude) || 12.9716, lng: parseFloat(longitude) || 77.5946 }}
                          zoom={14}
                          gestureHandling={'cooperative'}
                          disableDefaultUI={true}
                          onClick={handleMapClick}
                          mapId="DEMO_MAP_ID"
                          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                          style={{ width: '100%', height: '100%' }}
                        >
                          <AdvancedMarker 
                            position={{ lat: parseFloat(latitude) || 12.9716, lng: parseFloat(longitude) || 77.5946 }}
                          >
                            <Pin background="#EF4444" glyphColor="#fff" borderColor="#B91C1C" />
                          </AdvancedMarker>
                        </Map>
                      </APIProvider>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950">
                        <MapPin className="w-8 h-8 text-indigo-500 animate-bounce mb-2" />
                        <h4 className="text-sm font-bold text-white mb-1">Google Maps API Key Required for Real-Time Map</h4>
                        <p className="text-[10px] text-gray-400 max-w-sm mb-3">
                          Please add your API key in AI Studio secrets with name <strong>GOOGLE_MAPS_PLATFORM_KEY</strong> to unlock interactive tap-to-pin, address auto-filling, and vector rendering.
                        </p>
                        <a 
                          href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded text-[10px] uppercase transition-colors"
                        >
                          Get API Key
                        </a>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500 italic">💡 Tip: Click anywhere on the map to place a pin and instantly auto-fill the address details.</p>
                </div>
              </div>

              {/* Citizen Reporting Name */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-semibold text-gray-400 font-mono">REPORTING AS</label>
                <div className="flex items-center gap-2">
                  {userProfile?.avatar || userProfile?.photoURL ? (
                    <img src={userProfile.avatar || userProfile.photoURL} alt={reportedBy} className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center text-[10px] text-indigo-300 font-black uppercase">
                      {(reportedBy || 'C')[0]}
                    </div>
                  )}
                  <span className="text-xs text-white font-medium">{reportedBy}</span>
                </div>
              </div>

            </div>

            {/* Media Upload Box */}
            <div className="glass p-6 rounded-2xl border border-white/5 space-y-3">
              <label className="text-xs font-semibold text-gray-300 font-mono">ATTACH PROOF (PHOTO / CAMERA / VIDEO)</label>
              
              {imageUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-white/10 max-h-60 bg-slate-950 flex items-center justify-center">
                  <img src={imageUrl} alt="Uploaded Proof" className="max-h-60 object-contain" />
                  <button
                    type="button"
                    onClick={() => { setImageUrl(null); setAiPreview(null); }}
                    className="absolute top-2 right-2 px-2.5 py-1.5 bg-brand-danger/90 hover:bg-brand-danger text-xs font-bold text-white rounded-lg transition-colors"
                  >
                    Remove Photo
                  </button>
                </div>
              ) : (
                <div className="border border-dashed border-white/10 rounded-xl p-8 text-center bg-slate-950/50 hover:bg-slate-950 hover:border-brand-primary/30 transition-all cursor-pointer relative">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <UploadCloud className="w-10 h-10 text-gray-500 mx-auto mb-3" />
                  <h4 className="text-xs font-semibold text-white">Drag & Drop or Click to Upload</h4>
                  <p className="text-[10px] text-gray-500 mt-1">PNG, JPG or MP4 formats accepted up to 10MB</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleRunAIAnalysis}
                disabled={isAnalyzing || !title || !description}
                className="flex-1 py-3 bg-slate-900 border border-white/10 hover:border-brand-primary/30 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-primary" />
                    AI Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-brand-primary" />
                    Run AI Pre-Analysis
                  </>
                )}
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting || !title || !description || !locationName}
                className="flex-1 py-3 bg-brand-primary hover:bg-brand-primary/95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all glow-primary"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'File Official Complaint'
                )}
              </button>
            </div>
          </form>

          {/* AI Analysis Panel Panel */}
          <div className="space-y-6">
            <div className="glass p-5 rounded-2xl border border-white/5 space-y-4">
              <div className="flex items-center gap-1.5 border-b border-white/5 pb-2">
                <Sparkles className="w-4 h-4 text-brand-primary glow-primary" />
                <h3 className="font-display font-semibold text-xs text-white uppercase font-mono tracking-wide">AI Multi-Agent Live Desk</h3>
              </div>

              {aiPreview ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
                  <div className="p-3 bg-slate-900 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[9px] text-gray-500 font-mono uppercase">AGENT 1: CLASSIFICATION</span>
                    <div className="text-sm font-bold text-white">{aiPreview.issueType}</div>
                    <div className="text-[10px] text-gray-400">Classified Category: <strong className="text-white">{category}</strong></div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-900 rounded-xl border border-white/5 space-y-0.5">
                      <span className="text-[9px] text-gray-500 font-mono uppercase">SEVERITY</span>
                      <div className={`text-sm font-black uppercase ${
                        aiPreview.severity === 'Critical' ? 'text-brand-danger' : aiPreview.severity === 'High' ? 'text-brand-warning' : 'text-cyan-400'
                      }`}>{aiPreview.severity}</div>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-xl border border-white/5 space-y-0.5">
                      <span className="text-[9px] text-gray-500 font-mono uppercase">CONFIDENCE</span>
                      <div className="text-sm font-bold text-white font-mono">{aiPreview.confidenceScore}%</div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[9px] text-gray-500 font-mono uppercase">AGENT 2: INTEGRITY SCORE</span>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-brand-success font-semibold">Trust Factor</span>
                      <span className="text-xs font-bold text-white font-mono">{100 - aiPreview.spamProbability}%</span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1">Spam Risk Score: <strong className="text-white font-mono">{aiPreview.spamProbability}%</strong></div>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[9px] text-gray-500 font-mono uppercase">AGENT 3: DYNAMIC PRIORITY INDEX</span>
                    <div className="text-3xl font-bold font-mono text-white text-glow">{aiPreview.priorityScore}<span className="text-xs text-gray-500 font-sans"> / 100</span></div>
                    <p className="text-[10px] text-gray-400 mt-1 leading-snug">
                      Priority index computed relative to schools, hospitals, residential wards, and grid density.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[9px] text-gray-500 font-mono uppercase">ASSIGNED DEPT ROUTE</span>
                    <div className="text-xs font-bold text-brand-secondary">{aiPreview.suggestedDepartment}</div>
                    <div className="text-[10px] text-gray-400">Estimated SLA: <strong className="text-white font-mono">{aiPreview.resolutionTimeEstimate}</strong></div>
                  </div>

                  <div className="p-3 bg-slate-900/40 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[9px] text-gray-500 font-mono uppercase">ENVIRONMENTAL RISK INDEX</span>
                    <p className="text-[11px] text-gray-300 leading-relaxed font-sans">{aiPreview.environmentalImpact}</p>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500 space-y-3">
                  <Info className="w-8 h-8 text-slate-800 mx-auto" />
                  <p className="text-xs">
                    Provide a title and description, then run AI analysis to verify classified severity, spam index, routing department, and priority.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
