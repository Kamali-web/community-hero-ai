/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Bell, 
  User, 
  Cpu, 
  Map, 
  Landmark, 
  Award, 
  LogOut, 
  Users, 
  Sparkles, 
  TrendingUp, 
  Leaf, 
  ListTodo, 
  Menu, 
  X,
  Compass,
  FileSpreadsheet,
  Camera,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { LANGUAGES } from '../utils/translations';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  userRole: 'citizen' | 'authority' | 'child';
  setUserRole: (role: 'citizen' | 'authority' | 'child') => void;
  citizenPoints: number;
  user: any;
  userProfile?: any;
  onSignOut: () => void;
  currentLanguage: string;
  setCurrentLanguage: (lang: any) => void;
  t?: any;
}

export default function Navbar({ 
  currentTab, 
  setCurrentTab, 
  userRole, 
  setUserRole, 
  citizenPoints, 
  user, 
  userProfile,
  onSignOut,
  currentLanguage,
  setCurrentLanguage,
  t = (k: string) => k
}: NavbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Water Pipe Resolved',
      body: 'Oakwood Avenue leak has been repaired. +100 Hero Points awarded!',
      time: 'Just now',
      unread: true,
      type: 'success'
    },
    {
      id: 2,
      title: 'New Predictive Hazard',
      body: 'Prediction Agent forecasted a 88% probability of pothole risk on Grand Avenue.',
      time: '15m ago',
      unread: true,
      type: 'warning'
    }
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  // Helper function to sync role change
  const handleRoleChange = async (role: 'citizen' | 'authority' | 'child') => {
    setUserRole(role);
    if (role === 'child') {
      setCurrentTab('kids-dashboard');
    } else if (role === 'authority') {
      setCurrentTab('authority-dashboard');
    } else {
      setCurrentTab('citizen-dashboard');
    }
    setMobileMenuOpen(false);

    if (user) {
      try {
        if (user.isDemo) {
          const savedProfile = localStorage.getItem('demo_profile');
          const parsedProfile = savedProfile ? JSON.parse(savedProfile) : {};
          parsedProfile.role = role;
          localStorage.setItem('demo_profile', JSON.stringify(parsedProfile));
          return;
        }
        await setDoc(doc(db, 'users', user.uid), { role }, { merge: true });
      } catch (err) {
        console.error("Error syncing role to Firestore:", err);
      }
    }
  };

  // Build items based on selected role
  const getNavItems = () => {
    if (userRole === 'child') {
      return [
        { id: 'kids-dashboard', label: t('kids_sanctuary') || 'Junior Sanctuary', icon: Sparkles, color: 'text-yellow-400' },
        { id: 'visual-assessor', label: t('ai_visual_assessor') || 'Ranger Vision AI', icon: Camera, color: 'text-indigo-400' },
        { id: 'map', label: t('district_map') || 'Interactive Map', icon: Map, color: 'text-indigo-400' },
        { id: 'gpt', label: t('civic_gpt') || 'Junior Eco-Bot', icon: Users, color: 'text-emerald-400' },
        { id: 'profile', label: t('my_hero_profile') || 'Ranger Profile', icon: User, color: 'text-pink-400' },
      ];
    }

    if (userRole === 'authority') {
      return [
        { id: 'authority-dashboard', label: 'Authority Desk', icon: Landmark, color: 'text-cyan-400' },
        { id: 'visual-assessor', label: t('ai_visual_assessor') || 'AI Visual Assessor', icon: Camera, color: 'text-indigo-400' },
        { id: 'map', label: t('district_map') || 'District Map', icon: Map, color: 'text-slate-400' },
        { id: 'predictions', label: 'Prediction Grid', icon: ShieldAlert, color: 'text-amber-500' },
        { id: 'twin', label: t('digital_twin') || 'Digital Twin', icon: Cpu, color: 'text-cyan-500' },
        { id: 'analytics', label: 'Triage Stats', icon: TrendingUp, color: 'text-emerald-400' },
        { id: 'gpt', label: t('civic_gpt') || 'Administrative GPT', icon: Users, color: 'text-indigo-400' },
        { id: 'profile', label: t('my_hero_profile') || 'Command Profile', icon: User, color: 'text-pink-400' },
      ];
    }

    // Default: Citizen items
    return [
      { id: 'landing', label: t('home_page') || 'Home Page', icon: Landmark, color: 'text-gray-400' },
      { id: 'citizen-dashboard', label: t('citizen_feed') || 'Citizen Feed', icon: ListTodo, color: 'text-indigo-400' },
      { id: 'visual-assessor', label: t('ai_visual_assessor') || 'AI Visual Assessor', icon: Camera, color: 'text-indigo-400 animate-pulse' },
      { id: 'report', label: t('report_incident') || 'Report Incident', icon: ShieldAlert, color: 'text-rose-400' },
      { id: 'map', label: t('district_map') || 'District Map', icon: Map, color: 'text-cyan-400' },
      { id: 'impact', label: t('eco_sanctuary') || 'Eco Sanctuary & Ledger', icon: Leaf, color: 'text-emerald-400' },
      { id: 'gpt', label: t('civic_gpt') || 'CivicGPT Agent', icon: Users, color: 'text-indigo-400' },
      { id: 'twin', label: t('digital_twin') || 'Digital Twin', icon: Cpu, color: 'text-purple-400' },
      { id: 'leaderboard', label: t('hall_of_heroes') || 'Hall of Heroes', icon: Award, color: 'text-amber-400' },
      { id: 'profile', label: t('my_hero_profile') || 'My Hero Profile', icon: User, color: 'text-pink-400' },
    ];
  };

  const navItems = getNavItems();

  return (
    <>
      {/* ================= DESKTOP SIDEBAR NAVBAR ================= */}
      <aside className="hidden md:flex flex-col justify-between w-64 lg:w-72 h-screen sticky top-0 bg-slate-950 border-r border-white/5 p-5 shrink-0 select-none z-40">
        
        {/* Brand & Logo Section */}
        <div className="space-y-6">
          <div 
            className="flex items-center gap-2.5 cursor-pointer group"
            onClick={() => setCurrentTab(userRole === 'child' ? 'kids-dashboard' : userRole === 'authority' ? 'authority-dashboard' : 'landing')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center glow-primary transition-transform group-hover:scale-105">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display font-black text-sm tracking-widest text-white leading-none">
                AEGIS SHIELD <span className="text-[9px] px-1.5 py-0.5 bg-brand-primary/20 text-brand-primary rounded-full border border-brand-primary/30 font-mono">AI</span>
              </h1>
              <p className="text-[9px] text-gray-500 font-mono tracking-wider uppercase mt-1">Civic Intelligence</p>
            </div>
          </div>

          {/* User Profile Mini Panel */}
          {user && (
            <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-3 flex items-center gap-2.5">
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || "User"} 
                  className="w-9 h-9 rounded-xl border border-brand-primary/20 object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center text-xs text-indigo-300 font-black uppercase">
                  {(user.displayName || user.email || 'C')[0]}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="text-[11px] font-bold text-white truncate">
                  {userRole === 'child' ? '🛡️ Junior ' + (userProfile?.name || user.displayName || user.email?.split('@')[0] || 'Hero') : (userProfile?.name || user.displayName || user.email?.split('@')[0] || 'Civic Hero')}
                </h4>
                <p className="text-[9px] text-gray-500 truncate font-mono">{user.email}</p>
              </div>
            </div>
          )}

          {/* Gamified Points HUD (Only for citizens/kids) */}
          {userRole !== 'authority' && (
            <div className="p-3 bg-gradient-to-br from-yellow-500/5 to-amber-500/5 border border-yellow-500/10 rounded-2xl flex items-center justify-between text-xs">
              <span className="text-[10px] text-gray-400 font-mono uppercase">Redeem Points</span>
              <div className="flex items-center gap-1 font-bold text-amber-400 font-mono">
                <Award className="w-3.5 h-3.5" />
                <span>{citizenPoints} PTS</span>
              </div>
            </div>
          )}

          {/* Notifications Dropdown Container */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-full py-2 px-3.5 bg-slate-900/50 hover:bg-slate-900 border border-white/5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white flex items-center justify-between transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Bell className="w-3.5 h-3.5 text-gray-400" />
                <span>Inbox Notifications</span>
              </span>
              {unreadCount > 0 && (
                <span className="bg-brand-danger text-[9px] text-white px-1.5 py-0.5 rounded-full font-bold">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute left-0 top-10 w-64 bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-2xl z-50 space-y-2.5 max-h-64 overflow-y-auto">
                <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                  <h5 className="text-[10px] uppercase font-mono font-bold text-slate-400">Notifications</h5>
                  <button onClick={handleMarkAllRead} className="text-[9px] text-brand-primary hover:underline">Clear</button>
                </div>
                {notifications.map(n => (
                  <div key={n.id} className="text-[11px] leading-relaxed p-1.5 rounded bg-slate-950/40 border border-white/5">
                    <div className="flex justify-between items-center text-glow mb-0.5">
                      <span className="font-bold text-slate-300">{n.title}</span>
                      <span className="text-[8px] text-gray-500 font-mono">{n.time}</span>
                    </div>
                    <p className="text-gray-400">{n.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Accessibility Multilingual Selector */}
          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-3 space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>App Language / भाषा / மொழி</span>
            </div>
            <select
              value={currentLanguage}
              onChange={(e) => {
                setCurrentLanguage(e.target.value);
                localStorage.setItem('app_lang', e.target.value);
              }}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-slate-950 text-slate-200 text-xs">
                  {lang.nativeName} ({lang.name})
                </option>
              ))}
            </select>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <span className="text-[9px] text-gray-500 font-mono uppercase block pl-1.5 pb-1">Control Hub</span>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-brand-primary/10 text-white border border-brand-primary/20 shadow-md shadow-brand-primary/5' 
                      : 'text-gray-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${item.color}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Role Switcher & Log Out */}
        <div className="space-y-4 pt-4 border-t border-white/5">
          {/* Active Station Persona switcher */}
          {userRole !== 'authority' ? (
            <div className="space-y-1.5">
              <span className="text-[9px] text-gray-500 font-mono uppercase block pl-1.5">Switch profile role</span>
              <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-white/5 text-[9px] font-bold text-center">
                <button
                  onClick={() => handleRoleChange('citizen')}
                  className={`py-1 rounded-md transition-all ${userRole === 'citizen' ? 'bg-brand-primary text-white' : 'text-gray-500 hover:text-white'}`}
                  title="Citizen"
                >
                  Adult
                </button>
                <button
                  onClick={() => handleRoleChange('child')}
                  className={`py-1 rounded-md transition-all ${userRole === 'child' ? 'bg-yellow-500 text-slate-950' : 'text-gray-500 hover:text-white'}`}
                  title="Under 18"
                >
                  Kid
                </button>
              </div>
            </div>
          ) : (
            <div className="px-1.5 py-2 bg-slate-950 rounded-xl border border-white/5 text-center">
              <span className="text-[10px] text-cyan-400 font-mono uppercase font-bold tracking-wider">🛡️ ADMIN COMMAND CENTER</span>
            </div>
          )}

          <button
            onClick={onSignOut}
            className="w-full py-2.5 bg-slate-950 hover:bg-rose-950/20 hover:text-rose-400 border border-white/5 text-gray-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Desk</span>
          </button>
        </div>
      </aside>

      {/* ================= MOBILE HEADER & DRAWER NAVBAR ================= */}
      <header className="md:hidden sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center">
            <ShieldAlert className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-black text-xs text-white uppercase tracking-wider">Aegis AI</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Points for mobile */}
          {userRole !== 'authority' && (
            <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
              {citizenPoints} pts
            </span>
          )}

          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 bg-slate-900 border border-white/5 rounded-lg text-gray-400"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Mobile Slideout menu drawer (Rendered outside the header to bypass stacking limits) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop Overlay to dim the background page and prevent background clicks */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999]"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-slate-950 border-r border-white/10 z-[10000] p-5 flex flex-col justify-between"
            >
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <span className="font-display font-black text-sm text-white">Menu Hub</span>
                  <button 
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 bg-slate-900 border border-white/5 rounded-lg text-gray-500 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setCurrentTab(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isActive 
                            ? 'bg-brand-primary/10 text-white' 
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${item.color}`} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/5">
                {/* Mobile Language Selector */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[9px] text-gray-500 font-mono uppercase">
                    <Globe className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Language / भाषा / மொழி</span>
                  </div>
                  <select
                    value={currentLanguage}
                    onChange={(e) => {
                      setCurrentLanguage(e.target.value);
                      localStorage.setItem('app_lang', e.target.value);
                    }}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code} className="bg-slate-950 text-slate-200 text-xs">
                        {lang.nativeName} ({lang.name})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Station switcher */}
                {userRole !== 'authority' ? (
                  <div className="space-y-1.5">
                    <span className="text-[9px] text-gray-500 font-mono uppercase block">Active Desk Role</span>
                    <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-white/5 text-[9px] font-bold text-center">
                      <button
                        onClick={() => handleRoleChange('citizen')}
                        className={`py-1.5 rounded-md transition-all ${userRole === 'citizen' ? 'bg-brand-primary text-white' : 'text-gray-500'}`}
                      >
                        Adult
                      </button>
                      <button
                        onClick={() => handleRoleChange('child')}
                        className={`py-1.5 rounded-md transition-all ${userRole === 'child' ? 'bg-yellow-500 text-slate-950' : 'text-gray-500'}`}
                      >
                        Kid
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-2 bg-slate-950 rounded-xl border border-white/5 text-center">
                    <span className="text-[10px] text-cyan-400 font-mono uppercase font-bold tracking-wider">🛡️ ADMIN COMMAND CENTER</span>
                  </div>
                )}

                <button
                  onClick={onSignOut}
                  className="w-full py-2.5 bg-slate-950 text-gray-400 hover:text-white border border-white/5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
