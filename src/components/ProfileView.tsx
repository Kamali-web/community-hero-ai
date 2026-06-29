/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Award, 
  Zap, 
  ShieldCheck, 
  Sun, 
  Moon, 
  Palette, 
  Save, 
  Compass, 
  Smile, 
  Activity, 
  MapPin, 
  Sparkles,
  Calendar,
  CheckCircle2,
  Heart,
  Briefcase,
  Upload,
  Camera
} from 'lucide-react';
import { motion } from 'motion/react';

interface ProfileViewProps {
  user: any;
  userProfile: any;
  userRole: 'citizen' | 'authority' | 'child';
  citizenPoints: number;
  onUpdateProfile: (updatedData: any) => Promise<void>;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80', // Active Woman
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80', // Smiling Man
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80', // Professional Woman
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80', // Casual Man
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80', // Young Woman
  'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?auto=format&fit=crop&w=150&h=150&q=80', // Cute Puppy (Kid Favorite)
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80', // Tech Professional
  'https://images.unsplash.com/photo-1607990283143-e81e7a2c93ab?auto=format&fit=crop&w=150&h=150&q=80'  // Happy Student
];

export default function ProfileView({ 
  user, 
  userProfile, 
  userRole, 
  citizenPoints,
  onUpdateProfile 
}: ProfileViewProps) {
  const [name, setName] = useState(userProfile?.name || user?.displayName || 'Aegis Guardian');
  const [avatar, setAvatar] = useState(userProfile?.photoURL || userProfile?.avatar || user?.photoURL || PRESET_AVATARS[0]);
  const [themeMode, setThemeMode] = useState<'default' | 'light' | 'dark'>(userProfile?.themeMode || 'default');
  const [selectedWard, setSelectedWard] = useState(userProfile?.ward || 'Ward 2 (Hospital District)');
  const [gender, setGender] = useState(userProfile?.gender || 'not_specified');
  
  // Child-specific preferences
  const [selectedCompanion, setSelectedCompanion] = useState(userProfile?.selectedCharId || 'bheem');
  const [kidTheme, setKidTheme] = useState(userProfile?.kidTheme || 'avenger');
  const [questTarget, setQuestTarget] = useState(userProfile?.questTarget || 'Trash Clean Up');

  // Authority-specific preferences
  const [clearanceLevel, setClearanceLevel] = useState(userProfile?.clearanceLevel || 'Level 2 Administrator');
  const [assignedDepartment, setAssignedDepartment] = useState(userProfile?.department || 'Sanitation & Roads');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const updatedData: any = {
        name,
        photoURL: avatar,
        avatar,
        themeMode,
        ward: selectedWard,
        gender
      };

      if (userRole === 'child') {
        updatedData.selectedCharId = selectedCompanion;
        updatedData.kidTheme = kidTheme;
        updatedData.questTarget = questTarget;
      } else if (userRole === 'authority') {
        updatedData.clearanceLevel = clearanceLevel;
        updatedData.department = assignedDepartment;
      }

      await onUpdateProfile(updatedData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save profile:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Badges lists with descriptive hover texts
  const badgesList = [
    { name: 'Bronze Aegis', desc: 'Reported your very first ward infrastructure hazard', icon: '🛡️', color: 'from-amber-600 to-amber-800' },
    { name: 'Pioneer', desc: 'Among the first 1,000 citizens registered on Aegis Shield AI', icon: '🚀', color: 'from-indigo-600 to-purple-800' },
    { name: 'Infrastructure Ace', desc: 'At least 5 successful verifications of district reports', icon: '🔧', color: 'from-cyan-600 to-blue-800' },
    { name: 'Eco Heart', desc: 'Successfully grew 3 distinct flora saplings in the Sanctuary', icon: '💚', color: 'from-emerald-600 to-teal-800' },
    { name: 'Laddoo Master', desc: 'Eaten over 50 virtual laddoos with Chhota Bheem', icon: '🟡', color: 'from-yellow-400 to-orange-500' }
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Visual Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-primary/20 via-brand-secondary/10 to-slate-900 border border-white/5 p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6 shadow-xl">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent" />
        
        {/* Avatar Presentation */}
        <div className="relative group">
          <img 
            src={avatar} 
            alt={name} 
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 border-brand-primary/40 object-cover shadow-2xl transition-transform group-hover:scale-105"
          />
          <div className="absolute -bottom-1 -right-1 bg-brand-primary text-white p-1 rounded-lg border border-slate-950">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        {/* Text Area */}
        <div className="flex-1 text-center md:text-left space-y-2">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <h2 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight">{name}</h2>
            <span className={`px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-mono font-bold ${
              userRole === 'child' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
              userRole === 'authority' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
              'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
            }`}>
              {userRole === 'child' ? '🛡️ Junior Ranger' : userRole === 'authority' ? '👑 Admin Commander' : '👤 District Guardian'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-400 font-mono flex items-center justify-center md:justify-start gap-1.5">
            <Mail className="w-3.5 h-3.5 text-gray-500" />
            {user?.email}
          </p>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2 text-xs font-mono text-gray-400">
            <span className="flex items-center gap-1 bg-slate-950/60 px-2.5 py-1 rounded-lg border border-white/5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>{citizenPoints} PTS</span>
            </span>
            <span className="flex items-center gap-1 bg-slate-950/60 px-2.5 py-1 rounded-lg border border-white/5">
              <Award className="w-3.5 h-3.5 text-indigo-400" />
              <span>{userProfile?.badges?.length || 2} Badges</span>
            </span>
            <span className="flex items-center gap-1 bg-slate-950/60 px-2.5 py-1 rounded-lg border border-white/5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Trust Index: {userProfile?.trustScore || 90}%</span>
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Form Settings */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="glass p-6 sm:p-8 rounded-3xl border border-white/5 space-y-6">
            <h3 className="font-display font-black text-lg text-white border-b border-white/5 pb-3">
              Configure Hero Credentials
            </h3>

            {/* Change Name & Ward */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 font-mono uppercase">Full Name / Alias</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 font-mono uppercase">Primary Assigned Ward</label>
                <select 
                  value={selectedWard}
                  onChange={(e) => setSelectedWard(e.target.value)}
                  className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-primary"
                >
                  <option>Ward 1 (Northern Suburbs)</option>
                  <option>Ward 2 (Hospital District)</option>
                  <option>Ward 3 (Downtown Tech Core)</option>
                  <option>Ward 4 (Residential Heights)</option>
                  <option>Ward 5 (Aegis Industrial Hub)</option>
                </select>
              </div>
            </div>

            {/* Gender Select & Role Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 font-mono uppercase">Gender / Persona Pronoun</label>
                <select 
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-primary"
                >
                  <option value="not_specified">Keep Anonymous</option>
                  <option value="male">Male (He / Him)</option>
                  <option value="female">Female (She / Her)</option>
                  <option value="nonbinary">Non-Binary (They / Them)</option>
                </select>
              </div>

              {/* Authority Admin Level clearance */}
              {userRole === 'authority' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] text-cyan-400 font-mono uppercase">Clearance Clearance Level</label>
                  <select 
                    value={clearanceLevel}
                    onChange={(e) => setClearanceLevel(e.target.value)}
                    className="w-full bg-slate-950 border border-cyan-500/20 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option>Level 1 Triage Agent</option>
                    <option>Level 2 Administrator</option>
                    <option>Level 3 District Commander</option>
                    <option>Level 4 Chief Intelligence Officer</option>
                  </select>
                </div>
              )}

              {/* Kid friendly Quest Goal */}
              {userRole === 'child' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] text-yellow-400 font-mono uppercase">Active Junior Quest Goal</label>
                  <select 
                    value={questTarget}
                    onChange={(e) => setQuestTarget(e.target.value)}
                    className="w-full bg-slate-950 border border-yellow-500/20 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-400"
                  >
                    <option>Trash Clean Up</option>
                    <option>Report Loose Paving Blocks</option>
                    <option>Spot Blocked Pathways</option>
                    <option>Water Leak Vigilance</option>
                  </select>
                </div>
              )}
            </div>

            {/* Profile Avatar Selection */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] text-gray-400 font-mono uppercase block">Choose Your Hero Avatar</label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                  {PRESET_AVATARS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatar(url)}
                      className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-transform hover:scale-105 ${
                        avatar === url ? 'border-brand-primary ring-2 ring-brand-primary/20' : 'border-white/5'
                      }`}
                    >
                      <img src={url} alt={`Avatar Preset ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Drag-and-Drop Photo Uploader Option */}
              <div className="space-y-2">
                <label className="text-[10px] text-gray-400 font-mono uppercase block">Or Upload Your Own Photo</label>
                <div 
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('border-brand-primary', 'bg-brand-primary/5');
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-brand-primary', 'bg-brand-primary/5');
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-brand-primary', 'bg-brand-primary/5');
                    const file = e.dataTransfer.files?.[0];
                    if (file && file.type.startsWith('image/')) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        if (typeof reader.result === 'string') {
                          setAvatar(reader.result);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl border border-dashed border-white/10 hover:border-white/20 bg-slate-950/45 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-gray-400">
                      <Camera className="w-5 h-5 text-brand-primary" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Drag & Drop Profile Picture</h4>
                      <p className="text-[10px] text-gray-400">Supports PNG, JPG up to 5MB (stores locally)</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <input
                      id="custom-avatar-file-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            if (typeof reader.result === 'string') {
                              setAvatar(reader.result);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <label
                      htmlFor="custom-avatar-file-upload"
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl border border-white/5 hover:border-white/15 cursor-pointer transition-all flex items-center gap-1.5 shrink-0"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Choose File</span>
                    </label>
                    {avatar.startsWith('data:') && (
                      <span className="text-[10px] text-brand-success font-mono font-bold animate-pulse whitespace-nowrap">
                        ✓ CUSTOM PHOTO ACTIVE
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic Role Specific Customizer Section */}
            {userRole === 'child' && (
              <div className="p-4 bg-yellow-500/5 rounded-2xl border border-yellow-500/10 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  <h4 className="text-xs font-bold text-yellow-400 uppercase tracking-wide">Junior Ranger Sanctuary Station</h4>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-400 font-mono">Special Companion Creature</label>
                    <select
                      value={selectedCompanion}
                      onChange={(e) => setSelectedCompanion(e.target.value)}
                      className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="bheem">Chhota Bheem (Laddoo Smasher 🟡)</option>
                      <option value="vanya">Vanya Ranger (Eco Warrior 🍃)</option>
                      <option value="gopal">Gopal the Squirrel (Speedy Spotter 🐿️)</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-400 font-mono">Visual Play Theme</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setKidTheme('avenger')}
                        className={`flex-1 py-1.5 px-3 rounded-lg border text-[10px] font-bold ${
                          kidTheme === 'avenger' ? 'bg-yellow-500 text-slate-950 border-yellow-400' : 'bg-slate-950 text-gray-400 border-white/5'
                        }`}
                      >
                        Cyber Avenger
                      </button>
                      <button
                        type="button"
                        onClick={() => setKidTheme('forest')}
                        className={`flex-1 py-1.5 px-3 rounded-lg border text-[10px] font-bold ${
                          kidTheme === 'forest' ? 'bg-emerald-500 text-slate-950 border-emerald-400' : 'bg-slate-950 text-gray-400 border-white/5'
                        }`}
                      >
                        Calm Forest
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {userRole === 'authority' && (
              <div className="p-4 bg-cyan-500/5 rounded-2xl border border-cyan-500/10 space-y-4">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wide">Administrative Desk Configuration</h4>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-400 font-mono">Assigned Department</label>
                    <select
                      value={assignedDepartment}
                      onChange={(e) => setAssignedDepartment(e.target.value)}
                      className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option>Sanitation & Roads</option>
                      <option>Water Safety & Infrastructure</option>
                      <option>Electrical Hazards & Lighting</option>
                      <option>Public Safety & Traffic</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-400 font-mono">Incident Notification Level</label>
                    <select className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white">
                      <option>Critical Only</option>
                      <option>High and Critical</option>
                      <option>All Incidents (Ward Scope)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-white/5">
              <p className="text-[10px] text-gray-500 font-mono leading-relaxed">
                Updating your settings automatically synchronizes with your cloud database profile instantly.
              </p>
              
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-50 shadow-md shadow-brand-primary/10 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Synchronizing DB...' : 'Save Settings'}</span>
              </button>
            </div>

            {saveSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-center text-xs font-semibold animate-pulse">
                🎉 Credentials and theme preferences fully synchronized to Firestore Cloud Database!
              </div>
            )}
          </form>
        </div>

        {/* Right Column: Theme & Gamified Badges */}
        <div className="space-y-6">
          
          {/* Theme Switcher Widget */}
          <div className="glass p-6 rounded-3xl border border-white/5 space-y-4">
            <h4 className="font-display font-black text-sm text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
              <Palette className="w-4 h-4 text-brand-primary" />
              Dynamic visual Theme
            </h4>
            <p className="text-[11px] text-gray-400">Choose your preferred visual look. This styling is globally remembered across adult, kid, and administrative dashboards.</p>
            
            <div className="space-y-2">
              {/* Default Theme */}
              <button
                type="button"
                onClick={() => {
                  setThemeMode('default');
                  const nextProfile = { ...userProfile, themeMode: 'default' };
                  onUpdateProfile(nextProfile);
                }}
                className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
                  themeMode === 'default' 
                    ? 'bg-brand-primary/10 border-brand-primary/40 text-white' 
                    : 'bg-slate-950/40 border-white/5 text-gray-400 hover:text-white hover:bg-slate-950/80'
                }`}
              >
                <div className="flex items-center gap-2 text-left">
                  <span className="p-1 bg-brand-primary/20 text-brand-primary rounded-lg">
                    <Palette className="w-3.5 h-3.5" />
                  </span>
                  <div>
                    <div className="text-xs font-bold text-white">Default Cosmic</div>
                    <div className="text-[9px] text-gray-500 font-mono">Midnight Blue with Neon Accents</div>
                  </div>
                </div>
                {themeMode === 'default' && <CheckCircle2 className="w-4 h-4 text-brand-primary" />}
              </button>

              {/* Light Theme */}
              <button
                type="button"
                onClick={() => {
                  setThemeMode('light');
                  const nextProfile = { ...userProfile, themeMode: 'light' };
                  onUpdateProfile(nextProfile);
                }}
                className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
                  themeMode === 'light' 
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-950' 
                    : 'bg-slate-950/40 border-white/5 text-gray-400 hover:text-white hover:bg-slate-950/80'
                }`}
              >
                <div className="flex items-center gap-2 text-left">
                  <span className="p-1 bg-amber-500/20 text-amber-500 rounded-lg">
                    <Sun className="w-3.5 h-3.5" />
                  </span>
                  <div>
                    <div className="text-xs font-bold text-white">Aegis Light Aura</div>
                    <div className="text-[9px] text-gray-500 font-mono">Crisp light grey with clean borders</div>
                  </div>
                </div>
                {themeMode === 'light' && <CheckCircle2 className="w-4 h-4 text-indigo-500" />}
              </button>

              {/* Dark Theme */}
              <button
                type="button"
                onClick={() => {
                  setThemeMode('dark');
                  const nextProfile = { ...userProfile, themeMode: 'dark' };
                  onUpdateProfile(nextProfile);
                }}
                className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
                  themeMode === 'dark' 
                    ? 'bg-zinc-800/40 border-zinc-700 text-zinc-100' 
                    : 'bg-slate-950/40 border-white/5 text-gray-400 hover:text-white hover:bg-slate-950/80'
                }`}
              >
                <div className="flex items-center gap-2 text-left">
                  <span className="p-1 bg-slate-800 text-zinc-400 rounded-lg">
                    <Moon className="w-3.5 h-3.5" />
                  </span>
                  <div>
                    <div className="text-xs font-bold text-white">Onyx Eclipse</div>
                    <div className="text-[9px] text-gray-500 font-mono">Pure black and high-contrast styling</div>
                  </div>
                </div>
                {themeMode === 'dark' && <CheckCircle2 className="w-4 h-4 text-white" />}
              </button>
            </div>
          </div>

          {/* Badges Collection Dashboard */}
          <div className="glass p-6 rounded-3xl border border-white/5 space-y-4">
            <h4 className="font-display font-black text-sm text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
              <Award className="w-4 h-4 text-yellow-400" />
              Citizen Achievements
            </h4>
            
            <div className="space-y-3">
              {badgesList.map((badge, idx) => {
                const ownsBadge = (userProfile?.badges || ['Bronze Aegis', 'Pioneer']).includes(badge.name) || idx < 2;
                return (
                  <div 
                    key={badge.name} 
                    className={`p-3 rounded-xl border flex items-start gap-3 transition-colors ${
                      ownsBadge 
                        ? 'bg-slate-900/60 border-white/5 text-white' 
                        : 'bg-slate-950/20 border-white/5 opacity-40 text-gray-500'
                    }`}
                  >
                    <span className="text-xl p-1.5 bg-slate-950 rounded-xl border border-white/5">{badge.icon}</span>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">{badge.name}</span>
                        {ownsBadge && <span className="text-[8px] font-mono px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">Owned</span>}
                      </div>
                      <p className="text-[10px] text-gray-400 leading-normal">{badge.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
