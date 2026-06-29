/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Award, 
  Shield, 
  Zap, 
  Flame, 
  Crown, 
  Plus, 
  Heart, 
  Compass, 
  CheckCircle2, 
  Camera, 
  Volume2, 
  Send,
  Droplet,
  Trash2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Smile,
  RefreshCw,
  Trophy,
  Lock,
  Unlock,
  MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CivicIssue } from '../types';

interface KidsDashboardViewProps {
  userPoints: number;
  setUserPoints: React.Dispatch<React.SetStateAction<number>>;
  userId?: string;
  onIssueReported: (issue: CivicIssue) => void;
  onSaveOfflineDraft?: (issue: CivicIssue) => void;
  isOnline?: boolean;
  setCurrentTab: (tab: string) => void;
  setSelectedIssueId: (id: string) => void;
  onChangeRole: () => void;
  userProfile?: any;
  issues?: CivicIssue[];
}

// Characters definition for Avenger Theme (Indian Action Heroes)
const AVENGER_CHARACTERS = [
  { id: 'bheem', name: 'Chhota Bheem', hero: 'Laddoo Smasher', icon: '🟡', color: 'from-yellow-500 to-orange-600', description: 'Eats magical laddoos to gain the physical power of 100 elephants, carrying away heavy waste blocks and clearing roads!' },
  { id: 'hanuman', name: 'Junior Hanuman', hero: 'Flying Gada Shield', icon: '🐵', color: 'from-orange-500 to-red-600', description: 'Flies across Ward divisions carrying a magical mace (Gada) to repair broken streetlights with solar spark waves!' },
  { id: 'shaktimaan', name: 'Super Shaktimaan', hero: 'Yogic Spinner', icon: '🌀', color: 'from-red-600 to-yellow-500', description: 'Spins with high-frequency cosmic vibrations to clean polluted air emissions and purify contaminated drains!' },
  { id: 'krishna', name: 'Little Krishna', hero: 'Flute Purifier', icon: '🪈', color: 'from-blue-500 to-teal-400', description: 'Plays a sweet, magical tune on his flute to invite gentle rains, cleaning streets and watering park saplings!' }
];

// Characters definition for Magic Forest Theme (Indian Calm Forest/Floral)
const MAGIC_CHARACTERS = [
  { id: 'vanya', name: 'Van Devi Vanya', hero: 'Forest Sprout Nymph', icon: '🌿', color: 'from-emerald-500 to-teal-500', description: 'Spreads sacred tulsi seeds and neem blossoms to create healing micro-groves in concrete lanes!' },
  { id: 'apsara', name: 'Apsara Ananya', hero: 'Lotus Water Whisperer', icon: '🪷', color: 'from-pink-400 to-rose-500', description: 'Sheds glowing petals from the sacred Indian lotus to instantly purify contaminated river canals and water pipes!' },
  { id: 'mayur', name: 'Himalayan Mayur', hero: 'Peacock Rain Dancer', icon: '🦚', color: 'from-blue-600 to-emerald-600', description: 'Performs an aesthetic rain dance to summon gentle showers and wash away industrial toxic smoke!' },
  { id: 'hiran', name: 'Sona Hiran', hero: 'Saffron Trail Tracer', icon: '🦌', color: 'from-amber-400 to-yellow-300', description: 'Leaps gracefully across residential wards, leaving a trail of glowing saffron dust to illuminate dark street corner paths!' }
];

// Achievements Definition
export const ACHIEVEMENT_BADGES = [
  {
    id: 'first-patrol',
    name: 'First Street Patrol',
    emoji: '🎖️',
    description: 'Report your very first street hazard to Aegis City.',
    requiredCount: 1,
    badgeNameInProfile: 'First Patrol 🎖️',
    category: 'general' as const,
    unlockMsg: 'You have taken your first step to defend Aegis City! Stand proud, Ranger!'
  },
  {
    id: 'double-defender',
    name: 'Double Defender',
    emoji: '🛡️',
    description: 'Submit 2 reports to help make Aegis twice as clean.',
    requiredCount: 2,
    badgeNameInProfile: 'Double Defender 🛡️',
    category: 'general' as const,
    unlockMsg: 'Double trouble for street monsters! You are twice as powerful!'
  },
  {
    id: 'eco-champion',
    name: 'Eco Champion',
    emoji: '🌟',
    description: 'Submit 4 reports. Become a shining beacon of public service.',
    requiredCount: 4,
    badgeNameInProfile: 'Eco Champion 🌟',
    category: 'general' as const,
    unlockMsg: 'Absolute eco champion! Your companion is proud of your dedication!'
  },
  {
    id: 'city-warden',
    name: 'Aegis High Warden',
    emoji: '👑',
    description: 'Submit 7 reports. Recognized as an expert junior warden.',
    requiredCount: 7,
    badgeNameInProfile: 'High Warden 👑',
    category: 'general' as const,
    unlockMsg: 'Outstanding! Your incredible efforts have earned you Aegis High Warden status!'
  },
  {
    id: 'galaxy-savior',
    name: 'Galaxy Savior',
    emoji: '🌌',
    description: 'Submit 10 reports. Reach legendary status of clean streets.',
    requiredCount: 10,
    badgeNameInProfile: 'Galaxy Savior 🌌',
    category: 'general' as const,
    unlockMsg: 'Legendary Galaxy Savior! You are an inspiration to kids all across the cosmos!'
  },
  {
    id: 'road-smasher',
    name: 'Road Smasher',
    emoji: '🕳️',
    description: 'Spot and report a deep pothole hazard to make roads safe.',
    requiredCount: 1,
    badgeNameInProfile: 'Road Smasher 🕳️',
    category: 'pothole' as const,
    unlockMsg: 'Smashed the pothole danger! You saved cars and bikes from bumpy crashes!'
  },
  {
    id: 'aqua-savior',
    name: 'Aqua Savior',
    emoji: '💧',
    description: 'Spot and report a clean water pipeline leak to save water.',
    requiredCount: 1,
    badgeNameInProfile: 'Aqua Savior 💧',
    category: 'pipe' as const,
    unlockMsg: 'Every droplet matters! You saved pure clean water from going to waste!'
  },
  {
    id: 'fauna-guardian',
    name: 'Fauna Guardian',
    emoji: '🐰',
    description: 'Spot and report a dangerous litter pile to protect local animals.',
    requiredCount: 1,
    badgeNameInProfile: 'Fauna Guardian 🐰',
    category: 'trash' as const,
    unlockMsg: 'Litter cleared, animals protected! Little puppies and birds are cheering for you!'
  },
  {
    id: 'lantern-cadet',
    name: 'Lantern Cadet',
    emoji: '💡',
    description: 'Spot and report an unlit street lamp to cure dark alleys.',
    requiredCount: 1,
    badgeNameInProfile: 'Lantern Cadet 💡',
    category: 'lamp' as const,
    unlockMsg: 'You brought celestial light to spooky, pitch-black corners of Aegis City!'
  }
];

export default function KidsDashboardView({ 
  userPoints, 
  setUserPoints, 
  userId, 
  onIssueReported,
  onSaveOfflineDraft,
  isOnline,
  setCurrentTab,
  setSelectedIssueId,
  onChangeRole,
  userProfile,
  issues
}: KidsDashboardViewProps) {
  // Theme state: 'avenger' (boys/action) or 'magic' (girls/calm)
  const [kidTheme, setKidTheme] = useState<'avenger' | 'magic'>('avenger');
  const [selectedCharId, setSelectedCharId] = useState('bheem');
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(120);
  const [showConfetti, setShowConfetti] = useState(false);
  const [kidBadges, setKidBadges] = useState<string[]>(['Super Scout 🎖️', 'Water Helper 💧']);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingType, setReportingType] = useState<string | null>(null);

  // Extra gamification states for badges
  const [kidReportCount, setKidReportCount] = useState(0);
  const [selectedAchievementBadge, setSelectedAchievementBadge] = useState<typeof ACHIEVEMENT_BADGES[0] | null>(null);
  const [newlyUnlockedBadge, setNewlyUnlockedBadge] = useState<typeof ACHIEVEMENT_BADGES[0] | null>(null);

  // Form states for simplified kid reporting
  const [kidDesc, setKidDesc] = useState('');
  const [kidStreet, setKidStreet] = useState('Cherrywood Lane');
  const [kidImage, setKidImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successAnimation, setSuccessAnimation] = useState(false);

  // Live Location states
  const [useLiveLocation, setUseLiveLocation] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [detectedCoords, setDetectedCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Calculate dynamic report counts from live database + local state fallback
  const juniorIssuesCount = issues ? issues.filter(issue => 
    issue.description?.includes('[JUNIOR ECO HERO REPORT]') || 
    issue.reportedBy?.includes('Junior')
  ).length : 0;

  const actualReportCount = Math.max(juniorIssuesCount, kidReportCount);

  // Retrospective milestone sync effect
  useEffect(() => {
    if (actualReportCount > 0) {
      const milestoneBadges = [
        { count: 1, badge: 'First Patrol 🎖️' },
        { count: 2, badge: 'Double Defender 🛡️' },
        { count: 4, badge: 'Eco Champion 🌟' },
        { count: 7, badge: 'High Warden 👑' },
        { count: 10, badge: 'Galaxy Savior 🌌' }
      ];
      let needsUpdate = false;
      const nextBadges = [...kidBadges];
      
      milestoneBadges.forEach(item => {
        if (actualReportCount >= item.count && !nextBadges.includes(item.badge)) {
          nextBadges.push(item.badge);
          needsUpdate = true;
        }
      });
      
      if (needsUpdate) {
        setKidBadges(nextBadges);
        saveKidState(xp, level, nextBadges, kidTheme, selectedCharId, actualReportCount);
      }
    }
  }, [actualReportCount]);

  // Sync state from Firestore on mount
  useEffect(() => {
    if (!userId || userId === 'demo-citizen-123') return;
    const fetchKidsProfile = async () => {
      const docRef = doc(db, 'users', userId);
      try {
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.kidTheme) {
            setKidTheme(data.kidTheme);
            if (data.selectedCharId) {
              setSelectedCharId(data.selectedCharId);
            } else {
              setSelectedCharId(data.kidTheme === 'avenger' ? 'bheem' : 'vanya');
            }
          }
          if (data.level) setLevel(data.level);
          if (data.xp) setXp(data.xp);
          if (data.kidBadges) setKidBadges(data.kidBadges);
          if (data.kidReportCount !== undefined) setKidReportCount(data.kidReportCount);
        }
      } catch (err) {
        console.error("Error fetching kid profile:", err);
      }
    };
    fetchKidsProfile();
  }, [userId]);

  // Synchronize dynamic theme & assets based on userProfile metadata (e.g. boys avenger, girls calm forest)
  useEffect(() => {
    if (userProfile) {
      if (userProfile.kidTheme) {
        setKidTheme(userProfile.kidTheme);
        const defaultCharId = userProfile.kidTheme === 'avenger' ? 'bheem' : 'vanya';
        setSelectedCharId(userProfile.selectedCharId || defaultCharId);
      } else if (userProfile.gender) {
        const lowerGender = userProfile.gender.toLowerCase();
        const guessedTheme = lowerGender === 'female' || lowerGender === 'girl' || lowerGender === 'f' ? 'magic' : 'avenger';
        setKidTheme(guessedTheme);
        setSelectedCharId(guessedTheme === 'avenger' ? 'bheem' : 'vanya');
      }
      if (userProfile.level) setLevel(userProfile.level);
      if (userProfile.xp) setXp(userProfile.xp);
      if (userProfile.kidBadges) setKidBadges(userProfile.kidBadges);
      if (userProfile.kidReportCount !== undefined) setKidReportCount(userProfile.kidReportCount);
    }
  }, [userProfile]);

  // Save changes back to Firestore
  const saveKidState = async (
    nextXp: number, 
    nextLvl: number, 
    nextBadges: string[], 
    nextTheme = kidTheme, 
    nextChar = selectedCharId,
    nextReportCount = actualReportCount
  ) => {
    if (!userId) return;

    if (userId === 'demo-citizen-123') {
      const savedProfile = localStorage.getItem('demo_profile');
      const parsedProfile = savedProfile ? JSON.parse(savedProfile) : {};
      const updatedProfile = {
        ...parsedProfile,
        xp: nextXp,
        level: nextLvl,
        kidBadges: nextBadges,
        kidTheme: nextTheme,
        selectedCharId: nextChar,
        points: userPoints,
        kidReportCount: nextReportCount
      };
      localStorage.setItem('demo_profile', JSON.stringify(updatedProfile));
      return;
    }

    const docRef = doc(db, 'users', userId);
    try {
      await updateDoc(docRef, {
        xp: nextXp,
        level: nextLvl,
        kidBadges: nextBadges,
        kidTheme: nextTheme,
        selectedCharId: nextChar,
        points: userPoints, // keep points synced
        kidReportCount: nextReportCount
      });
    } catch (err) {
      console.error("Error saving kid state:", err);
    }
  };

  const activeChar = kidTheme === 'avenger' 
    ? AVENGER_CHARACTERS.find(c => c.id === selectedCharId) || AVENGER_CHARACTERS[0]
    : MAGIC_CHARACTERS.find(c => c.id === selectedCharId) || MAGIC_CHARACTERS[0];

  const isBadgeUnlocked = (badge: typeof ACHIEVEMENT_BADGES[0]) => {
    return (
      kidBadges.includes(badge.badgeNameInProfile) ||
      (badge.badgeNameInProfile === 'First Patrol 🎖️' && kidBadges.includes('Super Scout 🎖️')) ||
      (badge.badgeNameInProfile === 'Aqua Savior 💧' && kidBadges.includes('Water Helper 💧')) ||
      (badge.category === 'general' && actualReportCount >= badge.requiredCount)
    );
  };

  // Adjust current character if theme changes
  const handleThemeChange = (newTheme: 'avenger' | 'magic') => {
    setKidTheme(newTheme);
    const firstCharOfNewTheme = newTheme === 'avenger' ? 'bheem' : 'vanya';
    setSelectedCharId(firstCharOfNewTheme);
    saveKidState(xp, level, kidBadges, newTheme, firstCharOfNewTheme);
  };

  const handleCharSelect = (charId: string) => {
    setSelectedCharId(charId);
    saveKidState(xp, level, kidBadges, kidTheme, charId);
  };

  // Give some XP / level up logic
  const addXp = (amount: number, optionalBadge?: string, nextReportCount = actualReportCount) => {
    let nextXp = xp + amount;
    let nextLvl = level;
    let nextBadges = [...kidBadges];
    let leveledUp = false;

    if (nextXp >= 300) {
      nextXp -= 300;
      nextLvl += 1;
      leveledUp = true;
    }

    const newlyAdded: string[] = [];

    if (optionalBadge && !nextBadges.includes(optionalBadge)) {
      nextBadges.push(optionalBadge);
      newlyAdded.push(optionalBadge);
    }

    // Check and award milestone badges
    const milestoneBadges = [
      { count: 1, badge: 'First Patrol 🎖️' },
      { count: 2, badge: 'Double Defender 🛡️' },
      { count: 4, badge: 'Eco Champion 🌟' },
      { count: 7, badge: 'High Warden 👑' },
      { count: 10, badge: 'Galaxy Savior 🌌' }
    ];
    milestoneBadges.forEach(item => {
      if (nextReportCount >= item.count && !nextBadges.includes(item.badge)) {
        nextBadges.push(item.badge);
        newlyAdded.push(item.badge);
      }
    });

    setXp(nextXp);
    setLevel(nextLvl);
    setKidBadges(nextBadges);
    setKidReportCount(nextReportCount);

    if (leveledUp) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }

    // Check and trigger celebratory state for any newly unlocked badges
    if (newlyAdded.length > 0) {
      const matchedBadge = ACHIEVEMENT_BADGES.find(b => 
        newlyAdded.includes(b.badgeNameInProfile) ||
        (b.badgeNameInProfile === 'First Patrol 🎖️' && newlyAdded.includes('Super Scout 🎖️')) ||
        (b.badgeNameInProfile === 'Aqua Savior 💧' && newlyAdded.includes('Water Helper 💧'))
      );
      if (matchedBadge) {
        // Trigger a nice double confetti burst
        setShowConfetti(true);
        setTimeout(() => {
          setNewlyUnlockedBadge(matchedBadge);
        }, 600); // Small sweet delay to let the initial submission success settle
      }
    }

    saveKidState(nextXp, nextLvl, nextBadges, kidTheme, selectedCharId, nextReportCount);
  };

  // Plant a tree in the general sanctuary
  const plantTreeInSanctuary = async () => {
    if (!userId) return;
    const userDocRef = doc(db, 'users', userId);
    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data();
        const currentSanctuary = data.sanctuary || [];
        
        // Kid magical seed depending on theme (Indian Flora edition!)
        const seedName = kidTheme === 'avenger' ? 'Vajra Gada Sapling 🟡' : 'Sacred Tulsi Sprout 🌿';
        const seedEmoji = kidTheme === 'avenger' ? '🟡' : '🌿';

        const newTree = {
          id: `sanc-${Date.now()}`,
          category: 'flora',
          name: seedName,
          emoji: seedEmoji,
          stage: 0,
          stageName: 'Magic Seedling',
          description: `Planted automatically by Junior Hero ${data.name || 'Champion'} after reporting a street hazard!`,
          dateAdded: new Date().toLocaleDateString(),
          costToGrow: 50
        };
        
        const nextSanctuary = [newTree, ...currentSanctuary];
        await updateDoc(userDocRef, {
          sanctuary: nextSanctuary
        });
      }
    } catch (err) {
      console.error("Error adding kid tree:", err);
    }
  };

  // Simplified child report submission
  const handleSimplifiedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kidDesc.trim()) {
      alert("Please tell us what you see in the street!");
      return;
    }

    setIsSubmitting(true);
    
    // Choose appropriate title/category based on type
    let title = "Junior Report: Pothole Hazard";
    let category = "Roads" as any;
    let badgesAwarded = "Road Smasher 🕳️";

    if (reportingType === 'pipe') {
      title = "Junior Report: Wasting Leaking Water";
      category = "Water";
      badgesAwarded = "Aqua Savior 💧";
    } else if (reportingType === 'trash') {
      title = "Junior Report: Animal Litter Danger";
      category = "Waste";
      badgesAwarded = "Fauna Guardian 🐰";
    } else if (reportingType === 'lamp') {
      title = "Junior Report: Spooky Unlit Streetlight";
      category = "Lighting";
      badgesAwarded = "Lantern Cadet 💡";
    }

    // Coordinates in Bengaluru, India or Live Location if enabled
    const latitude = useLiveLocation && detectedCoords ? detectedCoords.lat : 12.9716 + (Math.random() - 0.5) * 0.02;
    const longitude = useLiveLocation && detectedCoords ? detectedCoords.lng : 77.5946 + (Math.random() - 0.5) * 0.02;

    try {
      const res = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: `[JUNIOR ECO HERO REPORT] ${kidDesc} (Reported nearby ${kidStreet}).`,
          category,
          locationName: kidStreet,
          latitude,
          longitude,
          imageUrl: kidImage || 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&w=400&q=80',
          reportedBy: userProfile?.name || 'Junior Hero (Under 18)'
        })
      });

      if (res.ok) {
        const created: CivicIssue = await res.json();
        
        // Give rewards
        const bonusPoints = 100;
        setUserPoints(p => p + bonusPoints);
        const nextReportCount = actualReportCount + 1;
        addXp(150, badgesAwarded, nextReportCount);
        
        // Automatically plant a tree in the background!
        await plantTreeInSanctuary();

        // Trigger success view
        setSuccessAnimation(true);
        onIssueReported(created);
      } else {
        alert("Oops! The municipal servers are taking a nap. Please try again!");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Convert uploaded image to JPEG compressed
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 600;
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
            setKidImage(canvas.toDataURL('image/jpeg', 0.6));
          } else {
            setKidImage(reader.result as string);
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDetectLiveLocation = () => {
    if (!navigator.geolocation) {
      alert("Oops! Geolocation is not supported by your browser or device.");
      return;
    }
    
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        setDetectedCoords({ lat, lng });
        
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          if (res.ok) {
            const data = await res.json();
            const road = data.address?.road || data.address?.suburb || data.address?.neighbourhood || data.address?.city;
            const shortAddress = road ? `${road}, ${data.address?.city || ''}`.trim() : data.display_name;
            const finalAddress = shortAddress || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            setKidStreet(finalAddress);
          } else {
            const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
            setKidStreet(fallback);
          }
        } catch (err) {
          console.error("Error reverse geocoding for kid:", err);
          const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          setKidStreet(fallback);
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        console.error("Error detecting live location for kid:", error);
        setIsDetectingLocation(false);
        alert("Could not automatically locate you. We will use a safe simulated hero coordinate!");
        
        const randomOffsetLat = (Math.random() - 0.5) * 0.02;
        const randomOffsetLng = (Math.random() - 0.5) * 0.02;
        const detectedLat = 12.9716 + randomOffsetLat;
        const detectedLng = 77.5946 + randomOffsetLng;
        setDetectedCoords({ lat: detectedLat, lng: detectedLng });
        const fallback = `Safe Sector ${detectedLat.toFixed(3)}, ${detectedLng.toFixed(3)}`;
        setKidStreet(fallback);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Preset report selectors
  const handleQuickReportClick = (type: string) => {
    setReportingType(type);
    setShowReportModal(true);
    setKidDesc('');
    setKidImage(null);
    setKidStreet('Cherrywood Lane');
    setUseLiveLocation(false);
    setDetectedCoords(null);
  };

  // Dynamic Theme Colors
  const bgClass = kidTheme === 'avenger' 
    ? 'bg-slate-950 border-red-500/20' 
    : 'bg-slate-950 border-emerald-500/20';

  const headingText = kidTheme === 'avenger' ? 'text-red-400 font-display' : 'text-emerald-400 font-display';
  const primaryButtonClass = kidTheme === 'avenger' 
    ? 'bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white shadow-red-500/20' 
    : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-emerald-500/20';

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 select-none">
      
      {/* Background Atmosphere Overrides */}
      {kidTheme === 'avenger' ? (
        <div className="fixed inset-0 pointer-events-none -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-950/20 via-slate-950 to-slate-950 transition-all duration-700" />
      ) : (
        <div className="fixed inset-0 pointer-events-none -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/20 via-slate-950 to-slate-950 transition-all duration-700" />
      )}

      {/* Confetti Celebration overlay */}
      {showConfetti && (
        <div className="fixed inset-0 z-50 pointer-events-none bg-black/10 flex items-center justify-center">
          <div className="text-center space-y-2 animate-bounce">
            <span className="text-8xl">🎉🥳🎈</span>
            <h1 className="text-4xl font-black text-yellow-400 font-display uppercase tracking-widest text-glow">LEVEL UP!</h1>
            <p className="text-white text-sm font-semibold font-mono">You are now a Level {level} Hero!</p>
          </div>
        </div>
      )}

      {/* Main Header Card */}
      <div className={`glass p-6 rounded-3xl border ${bgClass} transition-all duration-500 relative overflow-hidden`}>
        {/* Animated ambient nodes */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-full pointer-events-none blur-xl" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-1.5 text-xs font-bold text-yellow-400">
              <Sparkles className="w-4 h-4 text-yellow-400 animate-spin" style={{ animationDuration: '4s' }} />
              <span>Aegis Junior Eco-Sanctuary Portal</span>
            </div>
            <h2 className="text-3xl font-black text-white font-display uppercase tracking-tight">
              Aegis City Needs You!
            </h2>
            <p className="text-xs text-gray-400 max-w-xl">
              Hello, Junior Ranger! Select your favorite theme below, train your special companion creature, and report street issues to plant magical seeds!
            </p>
          </div>

          {/* Theme Selector Switches */}
          <div className="bg-slate-900/80 p-1.5 rounded-2xl border border-white/5 flex gap-2 shrink-0">
            <button
              onClick={() => handleThemeChange('avenger')}
              className={`px-4 py-2 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                kidTheme === 'avenger' 
                  ? 'bg-red-600 text-white shadow-lg shadow-red-500/30' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🚀 Avengers Theme
            </button>
            <button
              onClick={() => handleThemeChange('magic')}
              className={`px-4 py-2 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                kidTheme === 'magic' 
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🌸 Magic Forest
            </button>
          </div>
        </div>
      </div>

      {/* Main Character Showcase Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Character Evolve and Training */}
        <div className={`glass p-6 rounded-3xl border ${bgClass} flex flex-col justify-between space-y-6 relative overflow-hidden`}>
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-mono uppercase">MY ECO COMPANION</span>
            <h3 className="text-lg font-black text-white font-display uppercase tracking-wider flex items-center gap-2">
              <Crown className="w-4 h-4 text-yellow-400" />
              {activeChar.name}
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-white/5 rounded-full text-indigo-300 font-bold">
              Role: {activeChar.hero} Mode
            </span>
          </div>

          {/* Central Active Avatar */}
          <div className="py-8 bg-slate-900/60 rounded-3xl border border-white/5 flex flex-col items-center justify-center relative group">
            {/* Animated background rings */}
            <div className={`absolute w-32 h-32 rounded-full border border-white/5 animate-ping opacity-25`} style={{ animationDuration: '3s' }} />
            
            <motion.div 
              key={activeChar.id + level}
              initial={{ scale: 0.8, rotate: -15 }}
              animate={{ scale: 1.1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="text-7xl select-none relative z-10"
            >
              {activeChar.icon}
            </motion.div>

            <div className="mt-4 text-center z-10">
              <span className="text-xs font-mono text-gray-400 font-semibold uppercase tracking-wider">Level {level} Fighter</span>
              <div className="text-lg font-black text-white mt-1 uppercase font-display">{level >= 4 ? 'Galaxy Warden 👑' : level >= 3 ? 'Aegis Champion 🌟' : 'Recruit 🎖️'}</div>
            </div>

            {/* Custom XP slider */}
            <div className="w-[80%] mt-4 space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-gray-500 uppercase">
                <span>XP Progress</span>
                <span>{xp} / 300 XP</span>
              </div>
              <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  className={`h-full rounded-full bg-gradient-to-r ${activeChar.color}`}
                  style={{ width: `${(xp / 300) * 100}%` }}
                  layout
                />
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-300 italic text-center max-w-sm mx-auto">
            "{activeChar.description}"
          </p>

          <button
            onClick={() => addXp(50)}
            className={`w-full py-3 rounded-2xl text-xs font-bold font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${primaryButtonClass}`}
          >
            <Zap className="w-4 h-4 text-yellow-300 animate-pulse" />
            Feed with eco points (+50 XP)
          </button>
        </div>

        {/* Middle Column: Companion Selector Feed */}
        <div className={`glass p-6 rounded-3xl border ${bgClass} space-y-4`}>
          <div className="border-b border-white/5 pb-2">
            <h3 className="font-display font-black text-sm text-white uppercase tracking-wider">
              Choose Companion Companion
            </h3>
            <p className="text-[10px] text-gray-500">Pick who helps you clean up Aegis City</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {(kidTheme === 'avenger' ? AVENGER_CHARACTERS : MAGIC_CHARACTERS).map((char) => {
              const isSelected = selectedCharId === char.id;
              return (
                <button
                  key={char.id}
                  onClick={() => handleCharSelect(char.id)}
                  className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 group text-center relative overflow-hidden ${
                    isSelected 
                      ? 'bg-indigo-600/10 border-indigo-500/50 scale-[1.02]' 
                      : 'bg-slate-900/40 border-white/5 hover:border-white/10'
                  }`}
                >
                  <span className="text-3xl group-hover:scale-110 transition-transform">{char.icon}</span>
                  <div>
                    <h4 className="font-bold text-xs text-white truncate">{char.name}</h4>
                    <p className="text-[9px] text-gray-500 truncate mt-0.5">{char.hero}</p>
                  </div>
                  {isSelected && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* ================= VISUAL ACHIEVEMENTS HALL ================= */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] text-gray-400 font-mono uppercase block">Aegis Academy Badges</span>
                <h4 className="text-xs font-black text-white font-display uppercase tracking-wider flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                  Achievements Hall
                </h4>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-yellow-400 font-mono bg-yellow-400/10 border border-yellow-400/20 px-2 py-0.5 rounded-full">
                  {ACHIEVEMENT_BADGES.filter(badge => isBadgeUnlocked(badge)).length} / {ACHIEVEMENT_BADGES.length} Unlocked
                </span>
              </div>
            </div>

            {/* Achievements Master Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] font-mono text-gray-500 uppercase">
                <span>Ranger Badges Status</span>
                <span>{Math.round((ACHIEVEMENT_BADGES.filter(badge => isBadgeUnlocked(badge)).length / ACHIEVEMENT_BADGES.length) * 100)}%</span>
              </div>
              <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  className="h-full rounded-full bg-gradient-to-r from-yellow-500 via-amber-400 to-emerald-400 animate-pulse"
                  style={{ width: `${(ACHIEVEMENT_BADGES.filter(badge => isBadgeUnlocked(badge)).length / ACHIEVEMENT_BADGES.length) * 100}%` }}
                  layout
                />
              </div>
            </div>

            {/* Grid of Badges */}
            <div className="grid grid-cols-3 gap-2">
              {ACHIEVEMENT_BADGES.map((badge) => {
                const unlocked = isBadgeUnlocked(badge);
                return (
                  <button
                    key={badge.id}
                    type="button"
                    onClick={() => setSelectedAchievementBadge(badge)}
                    className={`relative p-2.5 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1.5 group select-none cursor-pointer ${
                      unlocked
                        ? 'bg-gradient-to-b from-slate-900/80 to-slate-950 border-yellow-500/30 hover:border-yellow-500/60 shadow-lg shadow-yellow-950/10 scale-100 hover:scale-[1.05]'
                        : 'bg-slate-900/20 border-white/5 opacity-60 hover:opacity-80 scale-100 hover:scale-[1.02]'
                    }`}
                  >
                    {/* Badge Emoji */}
                    <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all ${
                      unlocked
                        ? 'bg-gradient-to-tr from-yellow-500/15 to-orange-500/15 shadow-inner group-hover:scale-110'
                        : 'bg-slate-950/40 grayscale'
                    }`}>
                      {badge.emoji}
                      
                      {/* Lock / Unlock Icon indicator on bottom corner */}
                      <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center border text-[8px] ${
                        unlocked
                          ? 'bg-emerald-500 border-slate-950 text-white'
                          : 'bg-slate-950 border-white/5 text-gray-500'
                      }`}>
                        {unlocked ? <Unlock className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                      </span>
                    </div>

                    {/* Badge Short Name */}
                    <span className="text-[9px] text-gray-300 font-bold truncate max-w-full text-center">
                      {badge.name}
                    </span>

                    {/* Small progress meter for locked milestones */}
                    {!unlocked && badge.category === 'general' && (
                      <span className="text-[8px] font-mono text-gray-500">
                        {actualReportCount}/{badge.requiredCount} reports
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Simple Issue Reporter */}
        <div className={`glass p-6 rounded-3xl border ${bgClass} flex flex-col justify-between space-y-4 relative overflow-hidden`}>
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-mono uppercase">Junior Street Patrol</span>
            <h3 className="font-display font-black text-sm text-white uppercase tracking-wider flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-400" />
              Report Street Monsters!
            </h3>
            <p className="text-[10px] text-gray-500 leading-relaxed">
              Spotted a broken road, water leak, or litter heap? Click on a card below to report it to the city and get points!
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Custom Snap & Upload Card */}
            <button 
              onClick={() => handleQuickReportClick('custom')}
              className="col-span-2 p-4.5 rounded-2xl bg-gradient-to-r from-violet-600/20 to-indigo-600/20 hover:from-violet-600/30 hover:to-indigo-600/30 border border-indigo-500/30 hover:border-indigo-500/50 text-left transition-all group flex items-center justify-between gap-4 h-24 relative overflow-hidden shadow-lg shadow-indigo-950/15 cursor-pointer"
            >
              <div className="flex items-center gap-3.5 z-10">
                <div className="w-12 h-12 bg-indigo-500/20 border border-indigo-500/30 rounded-xl flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                  📸
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white group-hover:text-indigo-300 flex items-center gap-1.5">
                    Snap & Upload Custom Issue
                    <span className="text-[9px] px-1.5 py-0.5 bg-indigo-500/30 text-indigo-300 rounded-full font-mono font-bold">New</span>
                  </h4>
                  <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                    Upload any photo of a street hazard you spotted!
                  </p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:translate-x-1 transition-transform shrink-0">
                <ArrowRight className="w-4 h-4" />
              </div>
              {/* Decorative background flare */}
              <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
            </button>

            {/* Quick Action cards */}
            <button 
              onClick={() => handleQuickReportClick('pothole')}
              className="p-3 rounded-2xl bg-slate-900/60 border border-indigo-500/10 hover:border-indigo-500/30 text-left transition-all group flex flex-col justify-between h-24 cursor-pointer"
            >
              <div className="text-2xl">🕳️</div>
              <div>
                <h4 className="font-bold text-xs text-white group-hover:text-indigo-300">Pothole Monster</h4>
                <p className="text-[9px] text-gray-500 truncate">Smashed/Broken road</p>
              </div>
            </button>

            <button 
              onClick={() => handleQuickReportClick('pipe')}
              className="p-3 rounded-2xl bg-slate-900/60 border border-cyan-500/10 hover:border-cyan-500/30 text-left transition-all group flex flex-col justify-between h-24 cursor-pointer"
            >
              <div className="text-2xl">💧</div>
              <div>
                <h4 className="font-bold text-xs text-white group-hover:text-cyan-300">Leaking Pipe</h4>
                <p className="text-[9px] text-gray-500 truncate">Wasting precious water</p>
              </div>
            </button>

            <button 
              onClick={() => handleQuickReportClick('trash')}
              className="p-3 rounded-2xl bg-slate-900/60 border border-emerald-500/10 hover:border-emerald-500/30 text-left transition-all group flex flex-col justify-between h-24 cursor-pointer"
            >
              <div className="text-2xl">🗑️</div>
              <div>
                <h4 className="font-bold text-xs text-white group-hover:text-emerald-300">Litter Dump</h4>
                <p className="text-[9px] text-gray-500 truncate">Messy trash heaps</p>
              </div>
            </button>

            <button 
              onClick={() => handleQuickReportClick('lamp')}
              className="p-3 rounded-2xl bg-slate-900/60 border border-amber-500/10 hover:border-amber-500/30 text-left transition-all group flex flex-col justify-between h-24 cursor-pointer"
            >
              <div className="text-2xl">💡</div>
              <div>
                <h4 className="font-bold text-xs text-white group-hover:text-amber-300">Dark Lamp</h4>
                <p className="text-[9px] text-gray-500 truncate">Scary dark unlit spot</p>
              </div>
            </button>
          </div>

          <div className="pt-2 border-t border-white/5 text-center">
            <button 
              onClick={() => setCurrentTab('map')}
              className="text-[11px] text-indigo-400 font-bold hover:underline font-mono inline-flex items-center gap-1.5"
            >
              Explore Aegis Interactive Map <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

      </div>

      {/* Simplified kid report dialog modal */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className={`w-full max-w-lg bg-slate-900 border ${bgClass} rounded-3xl p-6 relative overflow-hidden space-y-6`}
            >
              {successAnimation ? (
                <div className="text-center py-8 space-y-4">
                  <span className="text-7xl animate-bounce inline-block">🚀🌱🏅</span>
                  <h3 className="font-display font-black text-2xl text-white uppercase tracking-tight">Mission Accomplished!</h3>
                  <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                    Splendid job! For protecting the street, you earned **+100 Hero XP**! Also, Aegis City's auto-bot planted a new **Magical Seed** 🌱 in your Sanctuary Grove!
                  </p>
                  <button
                    onClick={() => {
                      setShowReportModal(false);
                      setSuccessAnimation(false);
                    }}
                    className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${primaryButtonClass}`}
                  >
                    Hooray! Go Back
                  </button>
                </div>
              ) : (
                <>
                  {/* Modal Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] text-gray-400 font-mono uppercase tracking-wider block">Junior Incident Desk</span>
                      <h3 className="text-lg font-black text-white font-display uppercase flex items-center gap-2 mt-0.5">
                        {reportingType === 'pothole' && '🕳️ Report Pothole Monster'}
                        {reportingType === 'pipe' && '💧 Save Leaking Pipe'}
                        {reportingType === 'trash' && '🗑️ Clear Litter Monster'}
                        {reportingType === 'lamp' && '💡 Cure Spooky Dark Lamp'}
                        {reportingType === 'custom' && '📸 Snap & Upload Street Issue'}
                      </h3>
                    </div>
                    <button 
                      onClick={() => setShowReportModal(false)}
                      className="p-1.5 rounded-lg bg-slate-950 text-gray-500 hover:text-white border border-white/5"
                    >
                      &times;
                    </button>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSimplifiedSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">What do you see there?</label>
                      <textarea
                        required
                        rows={3}
                        placeholder={
                          reportingType === 'pothole' ? "e.g. There is a super deep hole on the left road lane, cars are bumping hard into it!" :
                          reportingType === 'pipe' ? "e.g. Clean water is bubbling up from the pavement and flooding the walkway!" :
                          reportingType === 'trash' ? "e.g. A huge pile of plastic boxes is thrown on the sidewalk. Animals might get stuck!" :
                          reportingType === 'lamp' ? "e.g. The street pole lamp is completely dead and it gets pitch black and creepy after sunset!" :
                          "e.g. Write down the street hazard or issue you spotted! Our hero drone will go inspect it!"
                        }
                        value={kidDesc}
                        onChange={(e) => setKidDesc(e.target.value)}
                        className="w-full p-4 bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded-xl outline-none text-xs text-white placeholder:text-gray-600 resize-none transition-all"
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Where did you spot this?</label>
                          
                          <button
                            type="button"
                            onClick={() => {
                              const nextMode = !useLiveLocation;
                              setUseLiveLocation(nextMode);
                              if (nextMode) {
                                handleDetectLiveLocation();
                              } else {
                                setKidStreet('Cherrywood Lane');
                                setDetectedCoords(null);
                              }
                            }}
                            className={`text-[9px] font-mono font-bold px-2 py-1 rounded-lg border transition-all flex items-center gap-1 cursor-pointer ${
                              useLiveLocation 
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <MapPin className={`w-3 h-3 ${isDetectingLocation ? 'animate-bounce' : ''}`} />
                            {useLiveLocation ? 'Live GPS Enabled' : 'Enable Live GPS'}
                          </button>
                        </div>

                        {useLiveLocation ? (
                          <div className="relative">
                            <input
                              type="text"
                              required
                              value={kidStreet}
                              onChange={(e) => setKidStreet(e.target.value)}
                              placeholder={isDetectingLocation ? "Finding your street name..." : "Enter location or road..."}
                              className="w-full px-4 py-3 bg-slate-950 border border-emerald-500/30 hover:border-emerald-500/50 text-xs text-slate-100 rounded-xl outline-none transition-all pr-24"
                            />
                            <button
                              type="button"
                              disabled={isDetectingLocation}
                              onClick={handleDetectLiveLocation}
                              className="absolute right-2 top-1.5 bottom-1.5 px-3 bg-indigo-500/20 hover:bg-indigo-500/35 border border-indigo-500/30 text-[9px] font-bold text-indigo-300 rounded-lg transition-all"
                            >
                              {isDetectingLocation ? 'Locating...' : 'Refresh GPS'}
                            </button>
                            
                            {isDetectingLocation && (
                              <div className="absolute left-3 top-3.5 w-3 h-3 border border-t-transparent border-indigo-400 rounded-full animate-spin" />
                            )}
                          </div>
                        ) : (
                          <select
                            value={kidStreet}
                            onChange={(e) => setKidStreet(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs text-slate-100 rounded-xl outline-none transition-all"
                          >
                            <option value="Cherrywood Lane">Cherrywood Lane</option>
                            <option value="Maple Street Plaza">Maple Street Plaza</option>
                            <option value="Oakwood Avenue">Oakwood Avenue</option>
                            <option value="Grand Avenue Corridor">Grand Avenue Corridor</option>
                            <option value="Silver Lake Road">Silver Lake Road</option>
                          </select>
                        )}

                        {useLiveLocation && detectedCoords && (
                          <p className="text-[9px] font-mono text-gray-500 flex items-center gap-1 pl-1">
                            <Compass className="w-2.5 h-2.5 text-gray-500" />
                            GPS Coordinates lock: {detectedCoords.lat.toFixed(5)}, {detectedCoords.lng.toFixed(5)}
                          </p>
                        )}
                      </div>

                      {/* Snap Camera illustration */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">Add Photo (Highly Recommended)</label>
                        <div className="relative">
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleImageUpload}
                            className="hidden" 
                            id="kid-photo-input" 
                          />
                          
                          {!kidImage ? (
                            <label 
                              htmlFor="kid-photo-input"
                              className="w-full h-32 border-2 border-dashed border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-950/10 text-slate-400 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group"
                            >
                              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-gray-400 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all">
                                <Camera className="w-5 h-5" />
                              </div>
                              <div className="text-center">
                                <p className="text-xs font-bold text-slate-200">Tap to Snap Photo or Choose File</p>
                                <p className="text-[10px] text-gray-500 mt-1">Camera or file upload options will appear</p>
                              </div>
                            </label>
                          ) : (
                            <div className="relative rounded-2xl overflow-hidden border border-slate-700/50 bg-slate-950 h-36 flex items-center justify-center group/preview">
                              <img src={kidImage} alt="Kid upload preview" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-slate-950/85 opacity-100 flex flex-col items-center justify-center gap-2">
                                <p className="text-xs font-bold text-emerald-400">✅ Photo Attached Successfully</p>
                                <button 
                                  type="button"
                                  onClick={() => setKidImage(null)}
                                  className="px-3 py-1.5 bg-rose-600/90 hover:bg-rose-500 text-white font-bold rounded-lg text-[10px] transition-all cursor-pointer"
                                >
                                  Remove & Snap Another
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowReportModal(false)}
                        className="flex-1 py-3 bg-slate-950 text-slate-400 border border-slate-800 hover:text-white rounded-xl text-xs font-bold transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${primaryButtonClass}`}
                      >
                        {isSubmitting ? (
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            Dispatch Hero Patrol
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Achievement Detail Dialog Modal */}
      <AnimatePresence>
        {selectedAchievementBadge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-slate-900 border border-yellow-500/30 rounded-3xl p-6 text-center space-y-6 relative overflow-hidden"
            >
              {/* Star-burst glowing background */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl -z-10" />

              <div className="flex justify-between items-center absolute top-4 right-4 left-4">
                <div />
                <button
                  type="button"
                  onClick={() => setSelectedAchievementBadge(null)}
                  className="p-1 rounded-lg bg-slate-950 text-gray-500 hover:text-white border border-white/5 cursor-pointer text-sm font-bold w-6 h-6 flex items-center justify-center"
                >
                  &times;
                </button>
              </div>

              <div className="pt-4 space-y-4">
                {/* Huge Emoji Badge */}
                <div className={`mx-auto w-24 h-24 rounded-3xl flex items-center justify-center text-6xl relative ${
                  isBadgeUnlocked(selectedAchievementBadge)
                    ? 'bg-gradient-to-tr from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/30 shadow-2xl shadow-yellow-500/10 animate-bounce'
                    : 'bg-slate-950/80 border border-white/5 grayscale'
                }`} style={{ animationDuration: '3s' }}>
                  {selectedAchievementBadge.emoji}
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-yellow-400 font-mono uppercase tracking-widest font-black block">
                    {isBadgeUnlocked(selectedAchievementBadge) ? '🏆 Achievement Unlocked' : '🔒 Locked Achievement'}
                  </span>
                  <h3 className="text-xl font-black text-white font-display uppercase leading-tight">
                    {selectedAchievementBadge.name}
                  </h3>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
                  {selectedAchievementBadge.description}
                </p>

                {/* Progress indicator or lock status */}
                <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-white/5 text-left space-y-2">
                  <h4 className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">How to Unlock:</h4>
                  <p className="text-[11px] text-gray-300 leading-relaxed">
                    {selectedAchievementBadge.category === 'general' ? (
                      <>Submit at least <span className="text-yellow-400 font-bold">{selectedAchievementBadge.requiredCount}</span> street hazard reports. Your current count: <span className="text-emerald-400 font-bold">{actualReportCount}</span>.</>
                    ) : (
                      <>Report at least 1 <span className="text-yellow-400 font-bold">{selectedAchievementBadge.category}</span> incident.</>
                    )}
                  </p>
                </div>

                {/* Companion quote! */}
                <div className="text-left bg-gradient-to-br from-indigo-950/40 to-slate-950 p-4 rounded-2xl border border-indigo-500/10 relative">
                  <div className="absolute top-2 right-3 text-xs opacity-40">💬</div>
                  <p className="text-[11px] font-bold text-indigo-300 font-mono uppercase">
                    {activeChar.name} Says:
                  </p>
                  <p className="text-[11px] text-slate-300 italic mt-1 leading-relaxed">
                    {isBadgeUnlocked(selectedAchievementBadge) 
                      ? `"${selectedAchievementBadge.unlockMsg}"`
                      : `"Ranger, our home needs you! Go on the street patrol, report this hazard, and I will help you unlock this beautiful badge!"`
                    }
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAchievementBadge(null)}
                className="w-full py-3 bg-slate-950 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all border border-slate-800 cursor-pointer"
              >
                Close Achievement
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Celebration Modal for Newly Unlocked Badge */}
      <AnimatePresence>
        {newlyUnlockedBadge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[20000] bg-slate-950/90 backdrop-blur-lg flex items-center justify-center p-4 overflow-hidden select-none"
          >
            {/* Ambient revolving color sparks */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-yellow-500/10 via-pink-500/10 to-emerald-500/10 rounded-full blur-3xl"
              />
              {/* Floating magical sparkles */}
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    opacity: 0.1, 
                    scale: 0.5, 
                    x: (Math.random() - 0.5) * 400, 
                    y: 200 
                  }}
                  animate={{ 
                    opacity: [0.2, 1, 0], 
                    scale: [0.5, 1.2, 0.4], 
                    y: -250,
                    x: (Math.random() - 0.5) * 400
                  }}
                  transition={{ 
                    duration: 3 + Math.random() * 2, 
                    repeat: Infinity, 
                    delay: Math.random() * 2,
                    ease: "easeOut"
                  }}
                  className="absolute left-1/2 top-1/2 text-yellow-400 text-lg pointer-events-none"
                >
                  ✨
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ scale: 0.5, y: 100, rotate: -10 }}
              animate={{ 
                scale: 1, 
                y: 0, 
                rotate: 0,
                transition: { type: 'spring', damping: 15, stiffness: 120 }
              }}
              exit={{ scale: 0.8, y: 50, opacity: 0 }}
              className="w-full max-w-md bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-yellow-400/40 rounded-[32px] p-8 text-center space-y-6 relative shadow-2xl shadow-yellow-500/20"
            >
              {/* Top celebration flag banner */}
              <div className="mx-auto w-fit bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-md font-mono flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} />
                New Badge Unlocked!
              </div>

              {/* Big central badge component with heavy shadow and glow */}
              <div className="relative py-4">
                {/* Ray bursts behind the badge */}
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 m-auto w-36 h-36 border-4 border-dashed border-yellow-500/20 rounded-full"
                />
                <motion.div 
                  animate={{ rotate: -360 }}
                  transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 m-auto w-40 h-40 border border-emerald-500/10 rounded-full"
                />
                
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  className="mx-auto w-28 h-28 bg-gradient-to-tr from-yellow-400 via-amber-500 to-emerald-400 p-1.5 rounded-[36px] shadow-2xl shadow-yellow-400/30 relative z-10 flex items-center justify-center"
                >
                  <div className="w-full h-full bg-slate-950 rounded-[32px] flex items-center justify-center text-6xl shadow-inner relative overflow-hidden group">
                    <span className="relative z-10">{newlyUnlockedBadge.emoji}</span>
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  </div>
                </motion.div>
              </div>

              {/* Congratulations text */}
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white font-display uppercase tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 via-white to-emerald-200">
                  {newlyUnlockedBadge.name}
                </h3>
                <p className="text-sm text-yellow-300 font-medium font-mono">
                  +150 XP • ECO POWER CHIP 🔋
                </p>
                <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                  "{newlyUnlockedBadge.description}"
                </p>
              </div>

              {/* Companion validation speech box */}
              <div className="bg-gradient-to-br from-indigo-950/50 via-slate-900/60 to-slate-950 p-4 rounded-2xl border border-indigo-500/20 text-left relative overflow-hidden">
                <div className="absolute -right-2 -bottom-2 text-6xl opacity-5">💬</div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-lg">{activeChar.icon}</span>
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest font-mono">
                    {activeChar.name} Celebrates:
                  </span>
                </div>
                <p className="text-xs text-slate-200 italic leading-relaxed">
                  "{newlyUnlockedBadge.unlockMsg}"
                </p>
              </div>

              {/* Claim button with highly interactive pulse */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={() => setNewlyUnlockedBadge(null)}
                className="w-full py-4 bg-gradient-to-r from-yellow-500 via-amber-500 to-emerald-500 text-slate-950 font-black uppercase text-xs tracking-wider rounded-2xl shadow-xl hover:shadow-yellow-500/10 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Award className="w-4 h-4 animate-bounce" />
                Claim Badge & Continue Patrol
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
