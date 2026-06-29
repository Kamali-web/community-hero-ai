/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Droplet, 
  Leaf, 
  HardHat, 
  Bolt, 
  Sparkles, 
  Plus, 
  Heart, 
  Smile, 
  Compass, 
  Trash2, 
  Check, 
  ChevronRight, 
  Info,
  Lock,
  Trophy,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Types for the Sanctuary Game
interface SanctuaryItem {
  id: string;
  category: 'flora' | 'fauna' | 'family';
  name: string;
  emoji: string;
  stage: number; // 0 to 3
  stageName: string;
  description: string;
  dateAdded: string;
  costToGrow: number;
}

interface SanctuaryCatalogItem {
  key: string;
  category: 'flora' | 'fauna' | 'family';
  name: string;
  cost: number;
  initialEmoji: string;
  stages: {
    emoji: string;
    name: string;
    description: string;
    growCost: number;
  }[];
}

interface ImpactDashboardViewProps {
  userPoints: number;
  setUserPoints: React.Dispatch<React.SetStateAction<number>>;
  userId?: string;
}

// 8-Pillar Hardened Error Handling for Firestore
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null, userId?: string) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: userId || null
    },
    operationType,
    path
  };
  console.error('Firestore Error in Sanctuary: ', JSON.stringify(errInfo));
}

// Global Catalog definition for our Sanctuary
const CATALOG: SanctuaryCatalogItem[] = [
  {
    key: 'sunflower',
    category: 'flora',
    name: 'Aegis Sunflower',
    cost: 100,
    initialEmoji: '🌱',
    stages: [
      { emoji: '🌱', name: 'Seedling', description: 'A tiny sunflower seed nestled in fertile municipal soil.', growCost: 50 },
      { emoji: '🌿', name: 'Sprout', description: 'Fresh green leaves pushing up toward clean civic skies.', growCost: 100 },
      { emoji: '🌻', name: 'Blossom', description: 'A tall stem with a bright yellow flower following the sun.', growCost: 150 },
      { emoji: '☀️', name: 'Radiant Beacon', description: 'A giant sunflower filtering pollutants and spreading neighborhood joy.', growCost: 0 }
    ]
  },
  {
    key: 'oak',
    category: 'flora',
    name: 'Ancient Whispering Oak',
    cost: 250,
    initialEmoji: '🌰',
    stages: [
      { emoji: '🌰', name: 'Acorn', description: 'An acorn holding the massive blueprint of a century-old tree.', growCost: 100 },
      { emoji: '🌱', name: 'Sapling', description: 'A young tree establishing its roots firmly in local park grounds.', growCost: 200 },
      { emoji: '🌳', name: 'Sturdy Oak', description: 'A solid canopy offering clean oxygen and deep summer shade.', growCost: 300 },
      { emoji: '🏰', name: 'Mighty Guardian', description: 'A colossal ancient oak hosting woodland fauna and removing tons of CO2.', growCost: 0 }
    ]
  },
  {
    key: 'squirrel',
    category: 'fauna',
    name: 'Eco-Squirrel',
    cost: 150,
    initialEmoji: '🥚',
    stages: [
      { emoji: '🥚', name: 'Newborn Kit', description: 'A tiny, sleeping squirrel pup nested safely in the reserve.', growCost: 60 },
      { emoji: '🐿️', name: 'Acorn Gatherer', description: 'Learning to skip across clean walkways and forage sustainable nuts.', growCost: 120 },
      { emoji: '🌲', name: 'Park Acrobate', description: 'Frequently seen entertaining children in Central Ward parklands.', growCost: 180 },
      { emoji: '👑', name: 'Sanctuary Mascot', description: 'A chubby, legendary local squirrel who welcomes park visitors.', growCost: 0 }
    ]
  },
  {
    key: 'owl',
    category: 'fauna',
    name: 'Wisdom Sanctuary Owl',
    cost: 200,
    initialEmoji: '🐣',
    stages: [
      { emoji: '🐣', name: 'Fuzzy Owlet', description: 'A sleepy baby owl blinking out at clean neighborhood streets.', growCost: 80 },
      { emoji: '🦉', name: 'Night Patroller', description: 'Gliding on silent wings to keep watch over safe smart streetgrids.', growCost: 160 },
      { emoji: '📚', name: 'Library Scholar', description: 'Roosting near the community center, inspiring young students.', growCost: 240 },
      { emoji: '🧙‍♂️', name: 'Midnight Sentinel', description: 'An ancient, revered symbol of environmental wisdom and civic oversight.', growCost: 0 }
    ]
  },
  {
    key: 'advocate',
    category: 'family',
    name: 'Youth Advocate',
    cost: 200,
    initialEmoji: '🎒',
    stages: [
      { emoji: '🎒', name: 'Enthusiast Student', description: 'A school student curious about reporting potholes and pipeline leaks.', growCost: 100 },
      { emoji: '📸', name: 'Active Reporter', description: 'Equipped with the Aegis App, documenting local waste dumping.', growCost: 200 },
      { emoji: '🎤', name: 'Youth Organizer', description: 'Hosting clean-up drives and community awareness seminars.', growCost: 300 },
      { emoji: '🎗️', name: 'Civic Leader', description: 'A highly recognized civic champion influencing real local green policies.', growCost: 0 }
    ]
  },
  {
    key: 'gardener',
    category: 'family',
    name: 'Eco-Gardening Duo',
    cost: 300,
    initialEmoji: '🧑‍🌾',
    stages: [
      { emoji: '🧑‍🌾', name: 'Novice Planters', description: 'Two passionate neighbors creating a modest raised organic flowerbed.', growCost: 120 },
      { emoji: '🧺', name: 'Permaculturists', description: 'Nurturing community organic produce for elderly local citizens.', growCost: 240 },
      { emoji: '🚜', name: 'Orchard Managers', description: 'Establishing beehives and fruit trees on previously littered soils.', growCost: 360 },
      { emoji: '🌍', name: 'Green Wardens', description: 'Leading the Ward to full ecological self-sufficiency and raw visual beauty.', growCost: 0 }
    ]
  }
];

export default function ImpactDashboardView({ userPoints, setUserPoints, userId }: ImpactDashboardViewProps) {
  const [activeTab, setActiveTab] = useState<'ledger' | 'sanctuary'>('sanctuary');
  const [sanctuary, setSanctuary] = useState<SanctuaryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [celebratingItem, setCelebratingItem] = useState<string | null>(null);

  // Load sanctuary inventory from Firestore on mount
  useEffect(() => {
    if (!userId) return;
    
    if (userId === 'demo-citizen-123') {
      const savedProfile = localStorage.getItem('demo_profile');
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        if (parsed.sanctuary) {
          setSanctuary(parsed.sanctuary);
        }
      }
      return;
    }
    
    const fetchSanctuary = async () => {
      setIsLoading(true);
      const userDocRef = doc(db, 'users', userId);
      try {
        const snap = await getDoc(userDocRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.sanctuary) {
            setSanctuary(data.sanctuary);
          }
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${userId}`, userId);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSanctuary();
  }, [userId]);

  // Sync sanctuary & points helper
  const syncWithFirestore = async (nextPoints: number, nextSanctuary: SanctuaryItem[]) => {
    if (!userId) return;

    if (userId === 'demo-citizen-123') {
      const savedProfile = localStorage.getItem('demo_profile');
      const parsedProfile = savedProfile ? JSON.parse(savedProfile) : {};
      const updatedProfile = {
        ...parsedProfile,
        points: nextPoints,
        sanctuary: nextSanctuary
      };
      localStorage.setItem('demo_profile', JSON.stringify(updatedProfile));
      return;
    }

    const userDocRef = doc(db, 'users', userId);
    try {
      await updateDoc(userDocRef, {
        points: nextPoints,
        sanctuary: nextSanctuary
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`, userId);
    }
  };

  // Plant or adopt an item from catalog
  const handleAdopt = async (catItem: SanctuaryCatalogItem) => {
    if (userPoints < catItem.cost) {
      alert(`You need ${catItem.cost} points to adopt this. Report issues or verify reports to earn more!`);
      return;
    }

    const newItem: SanctuaryItem = {
      id: `sanc-${Date.now()}`,
      category: catItem.category,
      name: catItem.name,
      emoji: catItem.initialEmoji,
      stage: 0,
      stageName: catItem.stages[0].name,
      description: catItem.stages[0].description,
      dateAdded: new Date().toLocaleDateString(),
      costToGrow: catItem.stages[0].growCost
    };

    const nextPoints = userPoints - catItem.cost;
    const nextSanctuary = [newItem, ...sanctuary];

    setUserPoints(nextPoints);
    setSanctuary(nextSanctuary);

    await syncWithFirestore(nextPoints, nextSanctuary);
  };

  // Grow / Nurture an existing item
  const handleGrow = async (itemId: string) => {
    const itemIndex = sanctuary.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return;

    const currentItem = sanctuary[itemIndex];
    if (currentItem.stage >= 3) {
      alert("This item has already reached its ultimate, majestic form!");
      return;
    }

    const catalogRef = CATALOG.find(c => c.name === currentItem.name);
    if (!catalogRef) return;

    const nextStage = currentItem.stage + 1;
    const nextStageDetails = catalogRef.stages[nextStage];
    const cost = currentItem.costToGrow;

    if (userPoints < cost) {
      alert(`You need ${cost} points to nurture this organism to the next stage.`);
      return;
    }

    // Trigger visual grow celebration
    setCelebratingItem(itemId);
    setTimeout(() => {
      setCelebratingItem(null);
    }, 1500);

    const updatedItem: SanctuaryItem = {
      ...currentItem,
      stage: nextStage,
      emoji: nextStageDetails.emoji,
      stageName: nextStageDetails.name,
      description: nextStageDetails.description,
      costToGrow: nextStageDetails.growCost
    };

    const nextPoints = userPoints - cost;
    const nextSanctuary = [...sanctuary];
    nextSanctuary[itemIndex] = updatedItem;

    setUserPoints(nextPoints);
    setSanctuary(nextSanctuary);

    await syncWithFirestore(nextPoints, nextSanctuary);
  };

  // Release/Remove item from sanctuary
  const handleRelease = async (itemId: string) => {
    if (!window.confirm("Are you sure you want to release this mature friend back into Aegis City parklands to watch over public health?")) {
      return;
    }

    const nextSanctuary = sanctuary.filter(i => i.id !== itemId);
    setSanctuary(nextSanctuary);
    await syncWithFirestore(userPoints, nextSanctuary);
  };

  // Ledger impactMetrics
  const impactMetrics = [
    {
      title: 'Water Network Conservation',
      value: '2,480,000 Litres',
      desc: 'Estimated volume saved from active pipeline bursting reports across Wards 2 & 4.',
      icon: <Droplet className="w-6 h-6 text-cyan-400" />,
      color: 'from-cyan-500/10 to-transparent border-cyan-500/20'
    },
    {
      title: 'Decarbonized Emissions',
      value: '14.8 Metric Tons CO2',
      desc: 'Prevented from prolonged idling in traffic blockages due to swift pothole repairs.',
      icon: <Leaf className="w-6 h-6 text-emerald-400" />,
      color: 'from-emerald-500/10 to-transparent border-emerald-500/20'
    },
    {
      title: 'Asphalt Rehabilitation',
      value: '420 Square Metres',
      desc: 'Total surface area patched proactively before triggering vehicle chassis accidents.',
      icon: <HardHat className="w-6 h-6 text-indigo-400" />,
      color: 'from-indigo-500/10 to-transparent border-indigo-500/20'
    },
    {
      title: 'Grid Power Restored',
      value: '11,400 kWh Saving',
      desc: 'Economized via AI automated sensor throttling and swift streetlight LED replacement.',
      icon: <Bolt className="w-6 h-6 text-amber-400" />,
      color: 'from-amber-500/10 to-transparent border-amber-500/20'
    }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Title */}
      <div className="text-center space-y-2">
        <h2 className="font-display font-bold text-3xl text-white">Civic Ecosystem & Ledger</h2>
        <p className="text-xs text-gray-400 font-mono tracking-wide uppercase">REDEEM YOUR COMPLAINT REWARDS TO GROW PLANTS, WILDLIFE & HERO FAMILIES</p>
      </div>

      {/* Tab switcher */}
      <div className="flex justify-center">
        <div className="bg-slate-900/80 p-1.5 rounded-2xl border border-white/5 flex gap-2">
          <button
            onClick={() => setActiveTab('sanctuary')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'sanctuary' 
                ? 'bg-brand-primary text-white shadow-lg shadow-indigo-500/20' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Award className="w-4 h-4" />
            Hero Sanctuary Game
            <span className="ml-1 text-[10px] bg-white/20 px-2 py-0.5 rounded-full text-white font-mono font-bold animate-pulse">
              {userPoints} pts
            </span>
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'ledger' 
                ? 'bg-brand-primary text-white shadow-lg shadow-indigo-500/20' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Leaf className="w-4 h-4" />
            Environmental Impact Ledger
          </button>
        </div>
      </div>

      {activeTab === 'sanctuary' ? (
        <div className="space-y-8">
          
          {/* Header Card */}
          <div className="glass p-6 rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/20 via-slate-950 to-slate-950 max-w-5xl mx-auto space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1.5 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-1.5 text-xs font-bold text-indigo-400">
                  <Sparkles className="w-4 h-4 text-brand-primary animate-pulse" />
                  <span>Interactive Civic Eco-Rewards</span>
                </div>
                <h3 className="text-xl font-bold text-white font-display">Your Virtual Hero Sanctuary</h3>
                <p className="text-xs text-gray-400 max-w-2xl leading-relaxed">
                  Every issue report you file and community verification you complete awards you **Civic Hero Points**. Use these points to choose, raise, and upgrade digital representations of a thriving community: **Flora** (plants & trees), **Fauna** (local park wildlife), or **Family** (civic support teams)!
                </p>
              </div>
              
              <div className="bg-slate-900 border border-white/5 rounded-2xl p-4 text-center min-w-[200px] shadow-inner relative overflow-hidden">
                <div className="absolute inset-0 bg-indigo-500/5 -z-10 blur-xl" />
                <span className="text-[10px] text-indigo-400 font-mono uppercase font-semibold">Spendable Points</span>
                <div className="text-3xl font-mono font-black text-white text-glow mt-1">{userPoints}</div>
                <p className="text-[9px] text-gray-500 mt-1 uppercase tracking-wider font-mono">100 points gained per file</p>
              </div>
            </div>
          </div>

          {/* Adoption Catalog */}
          <div className="space-y-4">
            <div className="border-b border-white/5 pb-2">
              <h3 className="font-display font-bold text-sm text-white uppercase font-mono tracking-wide flex items-center gap-2">
                <Compass className="w-4 h-4 text-brand-primary" />
                Adopt & Plant Registry (Spend Points)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {CATALOG.map((catItem) => {
                const isAffordable = userPoints >= catItem.cost;
                const categoryColor = 
                  catItem.category === 'flora' ? 'text-emerald-400 bg-emerald-500/10' :
                  catItem.category === 'fauna' ? 'text-cyan-400 bg-cyan-500/10' :
                  'text-amber-400 bg-amber-500/10';

                return (
                  <div key={catItem.key} className="glass p-5 rounded-2xl border border-white/5 bg-slate-950/60 flex flex-col justify-between hover:border-brand-primary/20 transition-all group">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold uppercase ${categoryColor}`}>
                          {catItem.category}
                        </span>
                        <span className="text-xs font-bold font-mono text-indigo-300 group-hover:scale-110 transition-transform">
                          {catItem.cost} PTS
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-900 rounded-xl border border-white/5 flex items-center justify-center text-2xl shadow-inner shadow-black">
                          {catItem.initialEmoji}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-white">{catItem.name}</h4>
                          <p className="text-[10px] text-gray-400 font-mono uppercase">Starts: Stage 1 ({catItem.stages[0].name})</p>
                        </div>
                      </div>

                      <p className="text-xs text-gray-400 italic">
                        "{catItem.stages[0].description}"
                      </p>
                    </div>

                    <button
                      onClick={() => handleAdopt(catItem)}
                      disabled={!isAffordable}
                      className={`w-full mt-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        isAffordable 
                          ? 'bg-indigo-600/20 hover:bg-indigo-600 text-white border border-indigo-500/30' 
                          : 'bg-slate-900 text-gray-500 border border-white/5 cursor-not-allowed'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {isAffordable ? 'Plant / Adopt' : 'Insufficient Points'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active sanctuary sandbox */}
          <div className="space-y-4 pt-4">
            <div className="border-b border-white/5 pb-2 flex justify-between items-center">
              <h3 className="font-display font-bold text-sm text-white uppercase font-mono tracking-wide flex items-center gap-2">
                <Trophy className="w-4 h-4 text-brand-warning" />
                My Active Sanctuary ({sanctuary.length} Organisms Growing)
              </h3>
              {sanctuary.length > 0 && (
                <span className="text-[10px] text-gray-500 font-mono">CLICK NURTURE TO SPEND POINTS & GROW THEM</span>
              )}
            </div>

            {isLoading ? (
              <div className="py-12 text-center text-gray-500">
                <span className="animate-spin inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full mb-2" />
                <p className="text-xs font-mono uppercase">Retrieving your ecosystem from Aegis servers...</p>
              </div>
            ) : sanctuary.length === 0 ? (
              <div className="border border-dashed border-white/5 rounded-3xl p-12 text-center bg-slate-950/40 max-w-2xl mx-auto space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/5 border border-indigo-500/15 flex items-center justify-center mx-auto text-glow text-3xl">
                  🏡
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Your Sanctuary is Empty</h4>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed max-w-md mx-auto">
                    You haven\'t planted or adopted any rewards yet. File a civic complaint report or verify existing issues to stack points, then adopt flora, fauna, or civic supporters above!
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {sanctuary.map((item) => {
                    const isFullyGrown = item.stage >= 3;
                    const isGrowable = userPoints >= item.costToGrow && !isFullyGrown;
                    const isCelebrating = celebratingItem === item.id;

                    const itemCatColor = 
                      item.category === 'flora' ? 'border-emerald-500/20 shadow-emerald-500/5' :
                      item.category === 'fauna' ? 'border-cyan-500/20 shadow-cyan-500/5' :
                      'border-amber-500/20 shadow-amber-500/5';

                    return (
                      <motion.div
                        layout
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.3 }}
                        className={`glass p-5 rounded-3xl border ${itemCatColor} bg-slate-950/80 flex flex-col justify-between shadow-xl relative overflow-hidden`}
                      >
                        {/* Sparkle background on grow */}
                        {isCelebrating && (
                          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent pointer-events-none animate-pulse" />
                        )}

                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[9px] text-gray-500 font-mono block">ADOPTED {item.dateAdded}</span>
                              <h4 className="font-bold text-sm text-white mt-0.5">{item.name}</h4>
                            </div>

                            {isFullyGrown ? (
                              <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full font-mono font-bold flex items-center gap-1">
                                <Check className="w-3 h-3" /> Fully Grown
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 bg-indigo-500/10 text-indigo-300 rounded-full font-mono font-bold">
                                Stage {item.stage + 1}/4
                              </span>
                            )}
                          </div>

                          {/* Central visual creature */}
                          <div className="py-6 flex flex-col items-center justify-center bg-slate-900/60 rounded-2xl border border-white/5 relative">
                            <AnimatePresence mode="wait">
                              <motion.div
                                key={item.emoji}
                                initial={{ scale: 0.3, rotate: -45, opacity: 0 }}
                                animate={{ scale: isCelebrating ? 1.4 : 1, rotate: 0, opacity: 1 }}
                                exit={{ scale: 0.3, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                                className="text-5xl select-none"
                              >
                                {item.emoji}
                              </motion.div>
                            </AnimatePresence>
                            
                            <div className="mt-3 text-center">
                              <span className="text-xs font-bold text-gray-200">{item.stageName}</span>
                              <p className="text-[10px] text-gray-400 font-mono mt-0.5 uppercase tracking-wider">{item.category}</p>
                            </div>

                            {/* Progress bar */}
                            <div className="w-[80%] bg-slate-950 h-1.5 rounded-full mt-3 overflow-hidden border border-white/5">
                              <div 
                                className="bg-brand-primary h-full rounded-full transition-all duration-500" 
                                style={{ width: `${((item.stage + 1) / 4) * 100}%` }}
                              />
                            </div>
                          </div>

                          <p className="text-xs text-gray-300 leading-relaxed min-h-[40px]">
                            {item.description}
                          </p>
                        </div>

                        <div className="mt-4 flex gap-2">
                          {!isFullyGrown ? (
                            <button
                              onClick={() => handleGrow(item.id)}
                              disabled={!isGrowable}
                              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                                isGrowable 
                                  ? 'bg-brand-primary hover:bg-brand-primary/90 text-white shadow-lg shadow-indigo-500/20' 
                                  : 'bg-slate-900 text-gray-500 border border-white/5 cursor-not-allowed'
                              }`}
                            >
                              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                              Nurture ({item.costToGrow} PTS)
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRelease(item.id)}
                              className="flex-1 py-2.5 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                            >
                              <Smile className="w-3.5 h-3.5" />
                              Release to Ward
                            </button>
                          )}

                          <button
                            onClick={() => handleRelease(item.id)}
                            className="p-2.5 bg-slate-900 border border-white/5 text-gray-500 hover:text-brand-danger hover:border-brand-danger/30 rounded-xl transition-all"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>

        </div>
      ) : (
        /* Original Impact Ledger Tab Content */
        <div className="space-y-8 animate-in fade-in duration-200">
          
          {/* Info Block */}
          <div className="glass p-5 rounded-2xl border border-white/5 space-y-2 bg-gradient-to-r from-brand-primary/5 to-transparent flex flex-col md:flex-row items-center justify-between gap-4 max-w-4xl mx-auto">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-1.5 text-xs font-semibold text-white mb-1">
                <Sparkles className="w-4 h-4 text-brand-primary animate-pulse" />
                <span>Smart Money Savings</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed max-w-xl">
                Reporting street issues early keeps our neighborhood safe and saves public funds. Fixing water pipe leaks or road cracks early cuts down emergency repair costs by an estimated 74%.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/15 border border-emerald-500/25 px-4 py-2 rounded-xl font-bold font-mono">
              <span>₹1,52,88,600 SAVED FOR THE CITY</span>
            </div>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {impactMetrics.map((metric) => (
              <div 
                key={metric.title}
                className={`glass p-6 rounded-3xl border bg-gradient-to-br ${metric.color} space-y-4 hover:scale-[1.01] transition-transform`}
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-display font-bold text-base text-gray-300">{metric.title}</h4>
                  <div className="p-3 bg-slate-950 rounded-2xl border border-white/5 shadow-inner">
                    {metric.icon}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-gray-500 font-mono uppercase block">LEDGER CALCULATION</span>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-white text-glow">{metric.value}</div>
                </div>

                <p className="text-xs text-gray-400 leading-relaxed font-sans">{metric.desc}</p>
              </div>
            ))}
          </div>

          {/* Comparative timeline */}
          <div className="glass p-6 rounded-3xl border border-white/5 max-w-4xl mx-auto space-y-4">
            <div className="border-b border-white/5 pb-2">
              <h3 className="font-display font-bold text-sm text-white uppercase font-mono tracking-wide">Emergency vs Early Fix Cost Comparison</h3>
            </div>
 
            <div className="space-y-4 text-xs pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-900/60 rounded-xl border border-white/5 space-y-1">
                  <span className="text-[9px] text-brand-danger font-bold uppercase font-mono">Emergency Repair Cost (After Major Damage)</span>
                  <div className="text-xl font-bold text-white font-mono">₹4,00,000 avg</div>
                  <p className="text-gray-400 text-[10px]">Includes heavy road digging, utility repair fines, traffic blocks, and massive water loss.</p>
                </div>
                <div className="p-4 bg-slate-900/60 rounded-xl border border-white/5 space-y-1">
                  <span className="text-[9px] text-brand-success font-bold uppercase font-mono">Early Detection & Fix (Minor Repair)</span>
                  <div className="text-xl font-bold text-white font-mono">₹10,000 avg</div>
                  <p className="text-gray-400 text-[10px]">Includes minor scheduled sealing, simple valve tightening, zero power cuts, and zero road blocks.</p>
                </div>
              </div>
            </div>
          </div>
 
        </div>
      )}

    </div>
  );
}
