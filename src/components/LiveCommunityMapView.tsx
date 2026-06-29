/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  MapPin, 
  Eye, 
  ArrowUp, 
  ToggleLeft, 
  ToggleRight, 
  CheckCircle2, 
  SlidersHorizontal,
  Globe,
  Compass,
  Loader2
} from 'lucide-react';
import { CivicIssue, IssueCategory } from '../types';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  'AIzaSyAlrsvxrtsa9qs6uUhHbIod2Bd89EEJWC4';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

interface LiveCommunityMapViewProps {
  issues: CivicIssue[];
  onUpvote: (id: string) => void;
  setCurrentTab: (tab: string) => void;
  setSelectedIssueId: (id: string) => void;
}

export default function LiveCommunityMapView({ 
  issues, 
  onUpvote, 
  setCurrentTab, 
  setSelectedIssueId 
}: LiveCommunityMapViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<IssueCategory | 'All'>('All');
  const [highRiskOnly, setHighRiskOnly] = useState<boolean>(false);
  const [isHeatmapMode, setIsHeatmapMode] = useState(false);
  const [isClusterMode, setIsClusterMode] = useState(false);
  const [activeIssue, setActiveIssue] = useState<CivicIssue | null>(null);

  // Map view styling: 'holographic' vector mapping vs 'google' live iframe
  const [mapMode, setMapMode] = useState<'holographic' | 'google'>('google');
  const [isLocating, setIsLocating] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState<string>('Bengaluru, Karnataka, India');
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 12.9716, lng: 77.5946 });

  // Auto detect location on component load
  useEffect(() => {
    detectLiveLocation();
  }, []);

  const detectLiveLocation = () => {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported by this browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const coords = { lat: latitude, lng: longitude };
        setUserLocation(coords);
        setMapCenter(coords);
        setIsLocating(false);

        // Fetch user neighborhood using Nominatim OpenStreetMap API
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          if (res.ok) {
            const data = await res.json();
            setLocationName(data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          }
        } catch (err) {
          console.error('Error reverse geocoding:', err);
          setLocationName(`Latitude: ${latitude.toFixed(4)}, Longitude: ${longitude.toFixed(4)}`);
        }
      },
      (error) => {
        console.error('Error detecting geolocation:', error);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  // Map coordinates mapping: latitude (12.91 - 12.99), longitude (77.55 - 77.65)
  // Translate to percentage offset on 100x100 relative box for the beautiful Vector View
  const getMapPosition = (lat: number, lng: number) => {
    const latMin = 12.91;
    const latMax = 12.99;
    const lngMin = 77.55;
    const lngMax = 77.65;

    // Y matches latitude (inverted since SVG Y goes top to bottom)
    const yPct = 100 - ((lat - latMin) / (latMax - latMin)) * 100;
    // X matches longitude
    const xPct = ((lng - lngMin) / (lngMax - lngMin)) * 100;

    return {
      x: Math.max(10, Math.min(90, xPct)),
      y: Math.max(10, Math.min(90, yPct))
    };
  };

  const filteredIssues = issues.filter((issue) => {
    if (selectedCategory !== 'All' && issue.category !== selectedCategory) return false;
    if (highRiskOnly && issue.severity !== 'High' && issue.severity !== 'Critical') return false;
    return true;
  });

  const getCategoryMarkerColor = (category: string) => {
    switch (category) {
      case 'Roads': return '#6366F1';
      case 'Water': return '#22D3EE';
      case 'Waste': return '#10B981';
      case 'Lighting': return '#F59E0B';
      default: return '#EF4444';
    }
  };

  const handleMarkerClick = (issue: CivicIssue) => {
    setActiveIssue(issue);
    // When clicking an issue card or pin, center the live google map onto it!
    setMapCenter({ lat: issue.latitude, lng: issue.longitude });
    setLocationName(issue.locationName);
  };

  const handleOpenDetails = (id: string) => {
    setSelectedIssueId(id);
    setCurrentTab('issue-details');
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-display font-bold text-3xl text-white">Live Community Incident Map</h2>
          <p className="text-xs text-gray-400 font-mono tracking-wide">INDIAN CIVIC COORDINATES & REAL-TIME GEO-TRACKER</p>
        </div>
        
        {/* Toggle Controls */}
        <div className="flex flex-wrap gap-4 items-center bg-slate-900/50 p-2.5 border border-white/5 rounded-xl text-xs">
          {/* Map style selection switcher */}
          <div className="flex items-center gap-2 pr-4 border-r border-white/10">
            <span className="text-gray-400 font-mono uppercase text-[10px]">Style Mode:</span>
            <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-white/5">
              <button
                onClick={() => setMapMode('google')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all ${mapMode === 'google' ? 'bg-brand-primary text-white' : 'text-gray-500'}`}
              >
                Google Map
              </button>
              <button
                onClick={() => setMapMode('holographic')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all ${mapMode === 'holographic' ? 'bg-indigo-500 text-white' : 'text-gray-500'}`}
              >
                Vector Hologram
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-400 font-mono">HEATMAP OVERLAY:</span>
            <button 
              onClick={() => setIsHeatmapMode(!isHeatmapMode)}
              className="text-white hover:scale-105 transition-transform"
            >
              {isHeatmapMode ? <ToggleRight className="w-7 h-7 text-brand-primary" /> : <ToggleLeft className="w-7 h-7 text-gray-500" />}
            </button>
          </div>

          <div className="flex items-center gap-2 border-l border-white/10 pl-4">
            <span className="text-gray-400 font-mono">CLUSTER MODE:</span>
            <button 
              onClick={() => setIsClusterMode(!isClusterMode)}
              className="text-white hover:scale-105 transition-transform"
            >
              {isClusterMode ? <ToggleRight className="w-7 h-7 text-brand-secondary" /> : <ToggleLeft className="w-7 h-7 text-gray-500" />}
            </button>
          </div>

          <button
            onClick={detectLiveLocation}
            disabled={isLocating}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-950 border border-white/10 hover:border-white/25 rounded-lg text-[10px] font-mono text-cyan-400 font-bold tracking-tight cursor-pointer disabled:opacity-50 transition-all"
          >
            {isLocating ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Compass className="w-3 h-3 text-cyan-400" />
            )}
            <span>{isLocating ? 'Geo-Locking...' : 'AUTO-TRACK LIVE LOCATION'}</span>
          </button>
        </div>
      </div>

      {/* Category filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center pb-2 border-b border-white/5">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
              selectedCategory === 'All' 
                ? 'bg-white/10 text-white border-white/20' 
                : 'bg-slate-900 text-gray-400 border-white/5 hover:text-white'
            }`}
          >
            ALL CATEGORIES
          </button>
          {(['Roads', 'Water', 'Waste', 'Lighting', 'Safety'] as IssueCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                selectedCategory === cat 
                  ? 'bg-brand-primary/20 text-white border-brand-primary/30' 
                  : 'bg-slate-900 text-gray-400 border-white/5 hover:text-white'
              }`}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>

        {/* High Risk Toggle Button */}
        <button
          onClick={() => setHighRiskOnly(!highRiskOnly)}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-mono uppercase border transition-all flex items-center gap-1.5 cursor-pointer ${
            highRiskOnly
              ? 'bg-red-500/20 text-red-300 border-red-500/35'
              : 'bg-slate-900 text-red-400/80 border-white/5 hover:bg-slate-850'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-brand-danger animate-pulse" />
          <span>🚨 High Risk Only</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Map Stage */}
        <div className="lg:col-span-3 relative bg-brand-bg border border-white/10 rounded-3xl overflow-hidden h-[500px] glow-primary">
          {mapMode === 'google' ? (
            <div className="absolute inset-0 w-full h-full">
              {hasValidKey ? (
                <APIProvider apiKey={API_KEY} version="weekly">
                  <Map
                    center={mapCenter}
                    zoom={14}
                    gestureHandling={'cooperative'}
                    disableDefaultUI={false}
                    mapId="DEMO_MAP_ID"
                    internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                    style={{ width: '100%', height: '100%' }}
                    onClick={(e) => {
                      if (e.detail.latLng) {
                        const lat = e.detail.latLng.lat;
                        const lng = e.detail.latLng.lng;
                        setMapCenter({ lat, lng });
                        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
                          .then(res => res.json())
                          .then(data => {
                            setLocationName(data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
                          })
                          .catch(err => {
                            console.error('Error reverse geocoding map click:', err);
                            setLocationName(`Latitude: ${lat.toFixed(5)}, Longitude: ${lng.toFixed(5)}`);
                          });
                      }
                    }}
                  >
                    {filteredIssues.map((issue) => {
                      const isSelected = activeIssue?.id === issue.id;
                      return (
                        <AdvancedMarker
                          key={issue.id}
                          position={{ lat: issue.latitude, lng: issue.longitude }}
                          onClick={() => handleMarkerClick(issue)}
                        >
                          <Pin 
                            background={getCategoryMarkerColor(issue.category)} 
                            glyphColor="#fff"
                            borderColor={isSelected ? "#FFF" : undefined}
                          />
                        </AdvancedMarker>
                      );
                    })}
                  </Map>
                </APIProvider>
              ) : (
                <iframe
                  title="Google Map Live Viewer"
                  width="100%"
                  height="100%"
                  style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) contrast(120%)' }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  src={`https://maps.google.com/maps?q=${mapCenter.lat},${mapCenter.lng}&z=14&output=embed`}
                />
              )}
              {/* Target Location Metadata Badge Overlay */}
              <div className="absolute top-4 right-4 bg-slate-950/90 border border-white/10 p-3 rounded-xl text-[10px] font-mono shadow-xl space-y-1.5 z-30 max-w-xs">
                <div className="text-cyan-400 font-bold tracking-wider flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
                  <span>GOOGLE MAP CALIBRATED</span>
                </div>
                <div className="text-gray-300 font-semibold line-clamp-2 leading-relaxed">📍 {locationName}</div>
                <div className="text-gray-500 text-[8px] border-t border-white/5 pt-1">
                  Lat: {mapCenter.lat.toFixed(5)} • Lng: {mapCenter.lng.toFixed(5)}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Grid Background */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:30px_30px]" />
              
              {/* Aesthetic Cyber City Elements */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                {/* Indian River representation */}
                <path d="M-50,250 C150,200 250,350 450,250 C650,150 750,300 1100,280" fill="none" stroke="#22D3EE" strokeWidth="8" strokeLinecap="round" />
                <text x="20" y="220" fill="#22D3EE" fontSize="10" fontFamily="monospace" letterSpacing="2">MUNICIPAL CANAL LINE</text>

                {/* Primary Expressways */}
                <line x1="0" y1="100" x2="1000" y2="400" stroke="#374151" strokeWidth="2" strokeDasharray="5,5" />
                <line x1="200" y1="0" x2="600" y2="600" stroke="#374151" strokeWidth="2" strokeDasharray="5,5" />

                {/* Wards grid markings */}
                <rect x="50" y="50" width="300" height="150" fill="none" stroke="#1f2937" strokeWidth="1" />
                <text x="60" y="70" fill="#6b7280" fontSize="9" fontFamily="monospace">WARD 1 (NORTHERN METRO ZONE)</text>

                <rect x="500" y="60" width="250" height="200" fill="none" stroke="#1f2937" strokeWidth="1" />
                <text x="510" y="80" fill="#6b7280" fontSize="9" fontFamily="monospace">WARD 4 (M.G. ROAD DIVISION)</text>

                <rect x="150" y="320" width="400" height="150" fill="none" stroke="#1f2937" strokeWidth="1" />
                <text x="160" y="340" fill="#6b7280" fontSize="9" fontFamily="monospace">WARD 2 (NEHRU NAGAR DISTRICT)</text>
              </svg>

              {/* Hologram Compass & Legend */}
              <div className="absolute bottom-4 left-4 p-3 bg-slate-950/80 border border-white/10 rounded-xl space-y-1.5 text-[9px] font-mono pointer-events-none">
                <div className="text-white font-bold mb-1">MUNICIPAL HOLO-MAP V2.5</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-500" /> Roads (DoT Repair Team)</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-cyan-400" /> Water Supply Pipeline</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Environmental Waste</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500" /> Electric / Grid Lines</div>
              </div>

              {/* Interactive Marker Plots */}
              {filteredIssues.map((issue) => {
                const pos = getMapPosition(issue.latitude, issue.longitude);
                const color = getCategoryMarkerColor(issue.category);
                const isSelected = activeIssue?.id === issue.id;

                return (
                  <div
                    key={issue.id}
                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                    onClick={() => handleMarkerClick(issue)}
                  >
                    {/* Heatmap Danger Halo */}
                    {isHeatmapMode && (
                      <div 
                        className="absolute w-20 h-20 -translate-x-1/2 -translate-y-1/2 rounded-full -z-10 animate-pulse"
                        style={{
                          background: `radial-gradient(circle, ${color}33 0%, transparent 70%)`
                        }}
                      />
                    )}

                    {/* Main Pointer Marker */}
                    <div 
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        isSelected 
                          ? 'scale-125 bg-white border-2 text-slate-950 shadow-lg border-brand-primary' 
                          : 'bg-slate-950 border-2 hover:scale-110 shadow-sm'
                      }`}
                      style={{ 
                        borderColor: color,
                        color: isSelected ? undefined : color
                      }}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                    </div>

                    {/* Marker Hover Label */}
                    <div className="absolute left-7 top-1/2 -translate-y-1/2 hidden group-hover:block bg-slate-950 border border-white/10 px-2 py-1 rounded-md text-[10px] text-white whitespace-nowrap shadow-md z-30 font-display font-medium">
                      {issue.title}
                    </div>
                  </div>
                );
              })}

              {/* Mock Cluster Marker Simulation if Cluster Mode Active */}
              {isClusterMode && (
                <div className="absolute top-[25%] left-[35%] -translate-x-1/2 -translate-y-1/2 bg-indigo-500/30 border border-indigo-400 text-white font-mono font-bold text-xs px-3 py-1 rounded-full glow-primary animate-pulse z-30">
                  🛡️ 12 Roads Cluster
                </div>
              )}

              {/* Quick Informational Tip */}
              <div className="absolute top-4 right-4 text-[10px] text-gray-400 bg-slate-950/80 border border-white/10 p-2.5 rounded-xl flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-brand-primary" />
                <span>Hologram View. Select standard Google Map at top for live accuracy.</span>
              </div>
            </>
          )}

          {/* Interactive Map Slide-Over Drawer */}
          {activeIssue && (
            <div className="absolute bottom-4 right-4 left-4 sm:left-auto sm:w-80 bg-slate-950/95 border border-white/10 p-4 rounded-2xl shadow-2xl z-40 animate-in slide-in-from-bottom-4 duration-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-mono font-bold text-brand-primary bg-brand-primary/10 border border-brand-primary/20 px-2 py-0.5 rounded-full">
                  {activeIssue.category.toUpperCase()}
                </span>
                <button 
                  onClick={() => setActiveIssue(null)}
                  className="text-gray-400 hover:text-white font-bold text-xs"
                >
                  ✕
                </button>
              </div>

              <h4 className="font-display font-bold text-sm text-white mb-1.5 leading-snug">{activeIssue.title}</h4>
              <p className="text-[11px] text-gray-400 line-clamp-2 mb-3 leading-relaxed">{activeIssue.description}</p>
              
              <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mb-4">
                <MapPin className="w-3.5 h-3.5 animate-pulse text-rose-500" />
                <span className="truncate">{activeIssue.locationName}</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => onUpvote(activeIssue.id)}
                  className={`flex-1 py-1.5 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
                    activeIssue.userUpvoted
                      ? 'bg-brand-primary/20 text-white border-brand-primary/30'
                      : 'bg-transparent text-gray-300 border-white/5 hover:bg-slate-900'
                  }`}
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                  <span>{activeIssue.upvotes} Verify</span>
                </button>

                <button
                  onClick={() => handleOpenDetails(activeIssue.id)}
                  className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-white border border-white/5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5 text-brand-secondary" />
                  Full Audit
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: Incident List Grid */}
        <div className="space-y-4">
          <div className="p-4 bg-slate-900/50 border border-white/5 rounded-2xl">
            <h3 className="font-display font-bold text-sm text-white mb-2">Filtered Incidents ({filteredIssues.length})</h3>
            <div className="flex flex-col gap-2.5 max-h-[410px] overflow-y-auto pr-1">
              {filteredIssues.map((issue) => (
                <div 
                  key={issue.id}
                  onClick={() => handleMarkerClick(issue)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    activeIssue?.id === issue.id 
                      ? 'bg-brand-primary/10 border-brand-primary/40' 
                      : 'bg-slate-950/70 border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span 
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: getCategoryMarkerColor(issue.category) }}
                    />
                    <span className="text-[9px] text-gray-500 font-mono">{issue.id}</span>
                  </div>
                  <h4 className="text-xs font-bold text-white truncate">{issue.title}</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5 truncate">{issue.locationName}</p>
                </div>
              ))}
              {filteredIssues.length === 0 && (
                <p className="text-xs text-gray-500 text-center py-6">No complaints match this category filter.</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
