/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingView from './components/LandingView';
import CitizenDashboardView from './components/CitizenDashboardView';
import ReportIssueView from './components/ReportIssueView';
import LiveCommunityMapView from './components/LiveCommunityMapView';
import IssueDetailsView from './components/IssueDetailsView';
import CivicGPTView from './components/CivicGPTView';
import CommunityTwinView from './components/CommunityTwinView';
import PredictionCenterView from './components/PredictionCenterView';
import AuthorityDashboardView from './components/AuthorityDashboardView';
import AnalyticsView from './components/AnalyticsView';
import LeaderboardView from './components/LeaderboardView';
import ImpactDashboardView from './components/ImpactDashboardView';
import AuthView from './components/AuthView';
import RoleSelectionView from './components/RoleSelectionView';
import KidsDashboardView from './components/KidsDashboardView';
import ProfileView from './components/ProfileView';
import VisualInspectorView from './components/VisualInspectorView';

import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, auth, onAuthStateChanged, User, signOut } from './lib/firebase';
import { CivicIssue, Prediction, Citizen, IssueStatus, IssueCategory } from './types';
import { LanguageCode, TRANSLATIONS, LANGUAGES } from './utils/translations';

export default function App() {
  const [currentTab, setCurrentTab] = useState('landing');
  const [guestPage, setGuestPage] = useState<'landing' | 'auth'>('landing');
  const [userRole, setUserRole] = useState<'citizen' | 'authority' | 'child' | null>(null);

  // Multilingual State and helper function
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>(
    () => (localStorage.getItem('app_lang') as LanguageCode) || 'en'
  );

  const t = (key: string, variables?: Record<string, string>) => {
    const dict = TRANSLATIONS[currentLanguage] || TRANSLATIONS['en'];
    let text = dict[key] || TRANSLATIONS['en'][key] || key;
    if (variables) {
      Object.entries(variables).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, v);
      });
    }
    return text;
  };
  
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [localTheme, setLocalTheme] = useState(() => localStorage.getItem('theme_mode') || 'default');

  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [kpiStats, setKpiStats] = useState<any>({
    activeReports: 0,
    resolvedIssues: 0,
    avgResolutionTime: '24 Hours',
    communityHealthScore: 88,
    infrastructureScores: { roads: 81, water: 89, waste: 79, lighting: 92, safety: 85 }
  });

  const [selectedIssueId, setSelectedIssueId] = useState<string>('');
  const [citizenPoints, setCitizenPoints] = useState(1250); // Sarah Jenkins starts with 1,250 points
  const [userProfile, setUserProfile] = useState<any>(null);

  // Offline capability states
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(
    localStorage.getItem('simulated_offline') === 'true'
  );
  const [drafts, setDrafts] = useState<CivicIssue[]>([]);
  const [isSyncingDrafts, setIsSyncingDrafts] = useState<boolean>(false);

  const getEffectiveOnlineStatus = () => {
    return isOnline && !isSimulatedOffline;
  };

  const handleToggleOfflineSimulator = (checked: boolean) => {
    setIsSimulatedOffline(checked);
    localStorage.setItem('simulated_offline', checked ? 'true' : 'false');
  };

  const addOfflineDraft = (newDraft: CivicIssue) => {
    setDrafts((prev) => {
      const next = [newDraft, ...prev];
      localStorage.setItem('aegis_report_drafts', JSON.stringify(next));
      return next;
    });
  };

  // Cross-tab data sharing for pre-filled report data from visual inspector
  const [prefilledReportData, setPrefilledReportData] = useState<{
    title: string;
    description: string;
    category: IssueCategory;
    imageUrl: string;
    aiAnalysis?: any;
  } | null>(null);

  // Listen to Firebase Auth state
  useEffect(() => {
    const isDemoActive = localStorage.getItem('demo_user_active') === 'true';
    if (isDemoActive) {
      const savedProfile = localStorage.getItem('demo_profile');
      const parsedProfile = savedProfile ? JSON.parse(savedProfile) : {
        name: 'Sarah Jenkins',
        points: 1250,
        badges: ['Bronze Aegis', 'Pioneer'],
        reportsCount: 0,
        verificationsCount: 0,
        trustScore: 90,
        role: null,
        sanctuary: []
      };
      setUser({
        uid: 'demo-citizen-123',
        displayName: parsedProfile.name,
        email: 'sarah@aegis.city',
        isDemo: true
      } as any);
      setCitizenPoints(parsedProfile.points ?? 1250);
      setUserProfile(parsedProfile);
      if (parsedProfile.role) {
        setUserRole(parsedProfile.role);
        if (parsedProfile.role === 'child') {
          setCurrentTab('kids-dashboard');
        } else if (parsedProfile.role === 'authority') {
          setCurrentTab('authority-dashboard');
        } else {
          setCurrentTab('citizen-dashboard');
        }
      } else {
        setUserRole(null);
      }
      setAuthChecking(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (localStorage.getItem('demo_user_active') === 'true') {
        return;
      }
      setUser(currentUser);
      if (currentUser) {
        // Fetch or create user profile in Firestore
        const userDocRef = doc(db, 'users', currentUser.uid);
        try {
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            setCitizenPoints(data.points ?? 1250);
            setUserProfile(data);
            if (data.role) {
              setUserRole(data.role);
              if (data.role === 'child') {
                setCurrentTab('kids-dashboard');
              } else if (data.role === 'authority') {
                setCurrentTab('authority-dashboard');
              } else {
                setCurrentTab('citizen-dashboard');
              }
            } else {
              setUserRole(null);
            }
          } else {
            const initialProfile = {
              name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Civic Hero',
              points: 1250,
              badges: ['Bronze Aegis', 'Pioneer'],
              reportsCount: 0,
              verificationsCount: 0,
              trustScore: 90,
              role: null
            };
            await setDoc(userDocRef, initialProfile);
            setCitizenPoints(1250);
            setUserProfile(initialProfile);
            setUserRole(null);
          }
        } catch (err) {
          console.error("Error synchronizing profile with Firestore:", err);
          setCitizenPoints(1250);
        }
      } else {
        setUserRole(null);
        setUserProfile(null);
      }
      setAuthChecking(false);
    });

    return () => unsubscribe();
  }, []);

  // Handle actual browser online/offline status & load drafts
  useEffect(() => {
    const handleOnlineStatus = () => {
      setIsOnline(true);
    };
    const handleOfflineStatus = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOfflineStatus);

    // Initial load of drafts
    const loadedDrafts = localStorage.getItem('aegis_report_drafts');
    if (loadedDrafts) {
      try {
        setDrafts(JSON.parse(loadedDrafts));
      } catch (err) {
        console.error('Error parsing local drafts:', err);
      }
    }

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOfflineStatus);
    };
  }, []);

  // Sync draft reports automatically when online connectivity is active/restored
  useEffect(() => {
    if (getEffectiveOnlineStatus() && drafts.length > 0) {
      syncOfflineDrafts();
    }
  }, [isOnline, isSimulatedOffline, drafts.length]);

  const syncOfflineDrafts = async () => {
    if (isSyncingDrafts) return;
    const loadedDrafts = localStorage.getItem('aegis_report_drafts');
    if (!loadedDrafts) return;

    let draftsList: CivicIssue[] = [];
    try {
      draftsList = JSON.parse(loadedDrafts);
    } catch (e) {
      console.error(e);
      return;
    }

    if (draftsList.length === 0) return;

    setIsSyncingDrafts(true);
    console.log(`Restored online connectivity. Syncing ${draftsList.length} offline report drafts...`);

    const remainingDrafts: CivicIssue[] = [];
    let syncedCount = 0;

    for (const draft of draftsList) {
      try {
        const response = await fetch('/api/issues', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: draft.title,
            description: draft.description,
            category: draft.category,
            locationName: draft.locationName,
            latitude: draft.latitude,
            longitude: draft.longitude,
            imageUrl: draft.imageUrl,
            voiceUrl: draft.voiceUrl,
            reportedBy: draft.reportedBy,
            aiAnalysis: draft.aiAnalysis
          })
        });

        if (response.ok) {
          const syncedIssue = await response.json();
          setIssues((prev) => [syncedIssue, ...prev]);
          syncedCount++;
        } else {
          remainingDrafts.push(draft);
        }
      } catch (err) {
        console.error('Error synchronizing draft:', draft.title, err);
        remainingDrafts.push(draft);
      }
    }

    localStorage.setItem('aegis_report_drafts', JSON.stringify(remainingDrafts));
    setDrafts(remainingDrafts);
    setIsSyncingDrafts(false);

    if (syncedCount > 0) {
      setCitizenPoints((p) => {
        const nextPoints = p + (syncedCount * 100);
        if (user) {
          updateUserPoints(user.uid, nextPoints);
          for (let i = 0; i < syncedCount; i++) {
            autoPlantTreeInSanctuary(user.uid);
          }
        }
        return nextPoints;
      });
      alert(`🎉 Aegis Synchronized! Successfully uploaded ${syncedCount} offline report drafts to the server!`);
    }
  };

  const autoPlantTreeInSanctuary = async (uid: string) => {
    try {
      if (user?.isDemo) {
        const currentSanctuary = userProfile?.sanctuary || [];
        const newTree = {
          id: `sanc-${Date.now()}`,
          category: 'flora' as const,
          name: 'Hero Oak Sapling',
          emoji: '🌱',
          stage: 0,
          stageName: 'Seedling',
          description: 'Planted automatically to reward your proactive infrastructure report.',
          dateAdded: new Date().toLocaleDateString(),
          costToGrow: 100
        };
        const nextProfile = {
          ...userProfile,
          sanctuary: [newTree, ...currentSanctuary]
        };
        setUserProfile(nextProfile);
        localStorage.setItem('demo_profile', JSON.stringify(nextProfile));
        return;
      }
      const userDocRef = doc(db, 'users', uid);
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data();
        const currentSanctuary = data.sanctuary || [];
        
        // Auto-plant a beautiful reward tree flora
        const newTree = {
          id: `sanc-${Date.now()}`,
          category: 'flora' as const,
          name: 'Hero Oak Sapling',
          emoji: '🌱',
          stage: 0,
          stageName: 'Seedling',
          description: 'Planted automatically to reward your proactive infrastructure report.',
          dateAdded: new Date().toLocaleDateString(),
          costToGrow: 100
        };
        
        const nextSanctuary = [newTree, ...currentSanctuary];
        await updateDoc(userDocRef, {
          sanctuary: nextSanctuary
        });
      }
    } catch (err) {
      console.error("Error auto-planting tree in sanctuary:", err);
    }
  };

  const updateUserPoints = async (userId: string, newPoints: number) => {
    try {
      if (user?.isDemo) {
        const nextProfile = {
          ...userProfile,
          points: newPoints
        };
        setUserProfile(nextProfile);
        localStorage.setItem('demo_profile', JSON.stringify(nextProfile));
        return;
      }
      const userDocRef = doc(db, 'users', userId);
      await setDoc(userDocRef, { points: newPoints }, { merge: true });
    } catch (err) {
      console.error("Error updating points in Firestore:", err);
    }
  };

  const handleUpdateProfile = async (updatedData: any) => {
    try {
      const mergedProfile = { ...userProfile, ...updatedData };
      setUserProfile(mergedProfile);

      if (user) {
        if (user.isDemo) {
          localStorage.setItem('demo_profile', JSON.stringify(mergedProfile));
        } else {
          const userDocRef = doc(db, 'users', user.uid);
          await setDoc(userDocRef, updatedData, { merge: true });
        }
      }
    } catch (err) {
      console.error("Error saving updated profile to DB:", err);
      throw err;
    }
  };

  // Synchronize global theme class on HTML element & document body
  useEffect(() => {
    const currentTheme = userProfile?.themeMode || localTheme || 'default';
    
    // Remove existing themes
    document.documentElement.classList.remove('theme-light', 'theme-dark', 'theme-default');
    document.body.classList.remove('theme-light', 'theme-dark', 'theme-default');
    
    // Add selected theme
    const themeClass = `theme-${currentTheme}`;
    document.documentElement.classList.add(themeClass);
    document.body.classList.add(themeClass);
    localStorage.setItem('theme_mode', currentTheme);
  }, [userProfile?.themeMode, localTheme]);

  // Load database from Server on mount or tab change (with high-quality offline cache support)
  useEffect(() => {
    const fetchAllData = async () => {
      const offline = !getEffectiveOnlineStatus();
      if (offline) {
        console.log('App is offline. Loading cached datasets from local storage...');
        const cachedIssues = localStorage.getItem('aegis_cached_issues');
        if (cachedIssues) setIssues(JSON.parse(cachedIssues));

        const cachedPredictions = localStorage.getItem('aegis_cached_predictions');
        if (cachedPredictions) setPredictions(JSON.parse(cachedPredictions));

        const cachedCitizens = localStorage.getItem('aegis_cached_citizens');
        if (cachedCitizens) setCitizens(JSON.parse(cachedCitizens));

        const cachedKpi = localStorage.getItem('aegis_cached_kpi');
        if (cachedKpi) setKpiStats(JSON.parse(cachedKpi));
        return;
      }

      try {
        const [resIssues, resPredictions, resCitizens, resKpi] = await Promise.all([
          fetch('/api/issues'),
          fetch('/api/predictions'),
          fetch('/api/citizens'),
          fetch('/api/stats')
        ]);

        if (resIssues.ok) {
          const dataIssues = await resIssues.json();
          setIssues(dataIssues);
          localStorage.setItem('aegis_cached_issues', JSON.stringify(dataIssues));
        }
        if (resPredictions.ok) {
          const dataPredictions = await resPredictions.json();
          setPredictions(dataPredictions);
          localStorage.setItem('aegis_cached_predictions', JSON.stringify(dataPredictions));
        }
        if (resCitizens.ok) {
          const dataCitizens = await resCitizens.json();
          setCitizens(dataCitizens);
          localStorage.setItem('aegis_cached_citizens', JSON.stringify(dataCitizens));
        }
        if (resKpi.ok) {
          const dataKpi = await resKpi.json();
          setKpiStats(dataKpi);
          localStorage.setItem('aegis_cached_kpi', JSON.stringify(dataKpi));
        }
      } catch (err) {
        console.error('Failure fetching data from full-stack server. Attempting cache fallback:', err);
        const cachedIssues = localStorage.getItem('aegis_cached_issues');
        if (cachedIssues) setIssues(JSON.parse(cachedIssues));
        const cachedPredictions = localStorage.getItem('aegis_cached_predictions');
        if (cachedPredictions) setPredictions(JSON.parse(cachedPredictions));
        const cachedCitizens = localStorage.getItem('aegis_cached_citizens');
        if (cachedCitizens) setCitizens(JSON.parse(cachedCitizens));
        const cachedKpi = localStorage.getItem('aegis_cached_kpi');
        if (cachedKpi) setKpiStats(JSON.parse(cachedKpi));
      }
    };

    fetchAllData();
  }, [currentTab, isOnline, isSimulatedOffline]); // refetch when changing tab or toggling connection to ensure live updates

  // Upvoting handler (Verification agent integration)
  const handleUpvote = async (id: string) => {
    // Optimistic update
    setIssues((prev) => 
      prev.map((i) => {
        if (i.id === id) {
          const alreadyUpvoted = i.userUpvoted;
          return {
            ...i,
            upvotes: alreadyUpvoted ? i.upvotes - 1 : i.upvotes + 1,
            userUpvoted: !alreadyUpvoted,
            trustScore: alreadyUpvoted ? Math.max(50, i.trustScore - 5) : Math.min(100, i.trustScore + 5)
          };
        }
        return i;
      })
    );

    // If upvoted, award the user some points!
    const targetedIssue = issues.find(i => i.id === id);
    if (targetedIssue && !targetedIssue.userUpvoted) {
      setCitizenPoints((p) => {
        const nextPoints = p + 50;
        if (user) {
          updateUserPoints(user.uid, nextPoints);
        }
        return nextPoints;
      });
    }

    try {
      await fetch(`/api/issues/${id}/upvote`, {
        method: 'POST'
      });
    } catch (err) {
      console.error('Error upvoting on server:', err);
    }
  };

  // Status updates (Authority actions desk)
  const handleUpdateStatus = async (id: string, status: IssueStatus, department?: string) => {
    // Optimistic update
    setIssues((prev) => 
      prev.map((i) => {
        if (i.id === id) {
          const updatedTimeline = [...i.timeline];
          updatedTimeline.push({
            id: `ev-${Date.now()}`,
            title: `Status set to ${status}`,
            description: department ? `Assigned to ${department} for repair` : `Work order changed to ${status}`,
            timestamp: new Date().toISOString(),
            by: userRole === 'authority' ? 'City Administrator' : 'System Agent'
          });

          return {
            ...i,
            status,
            assignedDepartment: department || i.assignedDepartment,
            timeline: updatedTimeline
          };
        }
        return i;
      })
    );

    try {
      await fetch(`/api/issues/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, department })
      });
    } catch (err) {
      console.error('Error updating status on server:', err);
    }
  };

  // Comment adding handler
  const handleAddComment = async (id: string, text: string, isAuthority: boolean) => {
    const authorName = isAuthority 
      ? 'Aegis Admin Desk' 
      : (user?.displayName || user?.email?.split('@')[0] || 'Civic Hero');
    const authorAvatar = isAuthority 
      ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80'
      : (user?.photoURL || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80');

    const newComment = {
      id: `c-${Date.now()}`,
      author: authorName,
      avatar: authorAvatar,
      text,
      timestamp: new Date().toISOString(),
      isAuthority
    };

    setIssues((prev) => 
      prev.map((i) => {
        if (i.id === id) {
          return {
            ...i,
            comments: [...i.comments, newComment]
          };
        }
        return i;
      })
    );

    try {
      await fetch(`/api/issues/${id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newComment)
      });
    } catch (err) {
      console.error('Error sending comment:', err);
    }
  };

  const handleEarnPoints = (additionalPoints: number) => {
    setCitizenPoints((p) => {
      const nextPoints = p + additionalPoints;
      if (user) {
        updateUserPoints(user.uid, nextPoints);
      }
      return nextPoints;
    });
  };

  const handleIssueReported = (newIssue: CivicIssue) => {
    setIssues((prev) => [newIssue, ...prev]);
    setCitizenPoints((p) => {
      const nextPoints = p + 100;
      if (user) {
        updateUserPoints(user.uid, nextPoints);
        autoPlantTreeInSanctuary(user.uid);
      }
      return nextPoints;
    });
  };

  // Master Render switchboard
  const renderTabContent = () => {
    const combinedIssues = [...drafts, ...issues];

    switch (currentTab) {
      case 'landing':
        return <LandingView setCurrentTab={setCurrentTab} kpiStats={kpiStats} />;
      
      case 'citizen-dashboard':
        return (
          <CitizenDashboardView 
            issues={combinedIssues}
            citizenPoints={citizenPoints}
            setCurrentTab={setCurrentTab}
            setSelectedIssueId={setSelectedIssueId}
            onUpvote={handleUpvote}
            kpiStats={kpiStats}
            onEarnPoints={handleEarnPoints}
            userProfile={userProfile}
            onIssueReported={handleIssueReported}
            currentLanguage={currentLanguage}
            t={t}
          />
        );

      case 'report':
        return (
          <ReportIssueView 
            onIssueReported={handleIssueReported}
            onSaveOfflineDraft={addOfflineDraft}
            isOnline={getEffectiveOnlineStatus()}
            setCurrentTab={setCurrentTab}
            setSelectedIssueId={setSelectedIssueId}
            userProfile={userProfile}
            prefilledData={prefilledReportData}
            onClearPrefilledData={() => setPrefilledReportData(null)}
            currentLanguage={currentLanguage}
            t={t}
          />
        );

      case 'visual-assessor':
        return (
          <VisualInspectorView 
            setCurrentTab={setCurrentTab}
            onSetPrefilledReport={setPrefilledReportData}
          />
        );

      case 'map':
        return (
          <LiveCommunityMapView 
            issues={combinedIssues}
            onUpvote={handleUpvote}
            setCurrentTab={setCurrentTab}
            setSelectedIssueId={setSelectedIssueId}
          />
        );

      case 'issue-details':
        return (
          <IssueDetailsView 
            issueId={selectedIssueId}
            issues={combinedIssues}
            userRole={userRole}
            onUpvote={handleUpvote}
            onAddComment={handleAddComment}
            onUpdateStatus={handleUpdateStatus}
            setCurrentTab={setCurrentTab}
            currentLanguage={currentLanguage}
            t={t}
          />
        );

      case 'gpt':
        return <CivicGPTView />;

      case 'kids-dashboard':
        return (
          <KidsDashboardView 
            userPoints={citizenPoints}
            setUserPoints={setCitizenPoints}
            userId={user?.uid}
            onIssueReported={handleIssueReported}
            onSaveOfflineDraft={addOfflineDraft}
            isOnline={getEffectiveOnlineStatus()}
            setCurrentTab={setCurrentTab}
            setSelectedIssueId={setSelectedIssueId}
            onChangeRole={() => setUserRole(null)}
            userProfile={userProfile}
            issues={combinedIssues}
          />
        );

      case 'twin':
        return <CommunityTwinView kpiStats={kpiStats} />;

      case 'prediction':
      case 'predictions':
        return (
          <PredictionCenterView 
            predictions={predictions} 
            setPredictions={setPredictions} 
          />
        );

      case 'authority-dashboard':
        return (
          <AuthorityDashboardView 
            issues={combinedIssues}
            kpiStats={kpiStats}
            onUpdateStatus={handleUpdateStatus}
            setCurrentTab={setCurrentTab}
            setSelectedIssueId={setSelectedIssueId}
          />
        );

      case 'analytics':
        return <AnalyticsView issues={combinedIssues} kpiStats={kpiStats} />;

      case 'leaderboard':
        return <LeaderboardView citizens={citizens} />;

      case 'impact':
        return (
          <ImpactDashboardView 
            userPoints={citizenPoints} 
            setUserPoints={setCitizenPoints} 
            userId={user?.uid} 
          />
        );

      case 'profile':
        return (
          <ProfileView 
            user={user}
            userProfile={userProfile}
            userRole={userRole}
            citizenPoints={citizenPoints}
            onUpdateProfile={handleUpdateProfile}
          />
        );

      default:
        return <LandingView setCurrentTab={setCurrentTab} kpiStats={kpiStats} />;
    }
  };

  const handleAuthSuccess = (u: any) => {
    setUser(u);
    if (u?.isDemo) {
      const savedProfile = localStorage.getItem('demo_profile');
      const parsedProfile = savedProfile ? JSON.parse(savedProfile) : {
        name: u.displayName || 'Guest Hero',
        points: 1250,
        badges: ['Bronze Aegis', 'Pioneer'],
        reportsCount: 0,
        verificationsCount: 0,
        trustScore: 90,
        role: null,
        sanctuary: []
      };
      setCitizenPoints(parsedProfile.points ?? 1250);
      setUserProfile(parsedProfile);
      setUserRole(parsedProfile.role);
      localStorage.setItem('demo_profile', JSON.stringify(parsedProfile));
    }
  };

  const handleSignOut = async () => {
    try {
      localStorage.removeItem('demo_user_active');
      localStorage.removeItem('demo_profile');
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
      setUserRole(null);
    } catch (err) {
      console.error("Error signing out from Firebase:", err);
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background Atmosphere */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-slate-950 -z-10" />
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center animate-pulse mb-6">
          <svg className="w-8 h-8 text-indigo-400 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold tracking-wider font-mono text-slate-400 uppercase">Synchronizing with Aegis...</h3>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-brand-bg text-gray-100 flex flex-col font-sans antialiased pb-12 relative">
        {/* Background radial atmosphere */}
        <div className="fixed inset-0 pointer-events-none -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/20 via-slate-950 to-slate-950" />
        
        {/* Simple navbar for logged out user */}
        <header className="sticky top-0 z-50 glass border-b border-white/5 py-4 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setGuestPage('landing')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center glow-primary">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h1 className="font-display font-black text-sm tracking-widest text-white leading-none">
                AEGIS SHIELD <span className="text-[9px] px-1.5 py-0.5 bg-indigo-500/20 text-indigo-400 rounded-full border border-indigo-500/30 font-mono">AI</span>
              </h1>
              <p className="text-[9px] text-gray-500 font-mono tracking-wider uppercase mt-1">Civic Intelligence Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme switcher */}
            <div className="flex items-center bg-slate-900 border border-white/5 rounded-xl p-1 gap-1 text-[10px] font-bold">
              <button
                onClick={() => {
                  setLocalTheme('light');
                  localStorage.setItem('theme_mode', 'light');
                }}
                className={`px-2.5 py-1 rounded transition-all cursor-pointer ${localTheme === 'light' ? 'bg-white text-slate-950 font-black shadow-sm' : 'text-gray-400 hover:text-white'}`}
              >
                LIGHT
              </button>
              <button
                onClick={() => {
                  setLocalTheme('dark');
                  localStorage.setItem('theme_mode', 'dark');
                }}
                className={`px-2.5 py-1 rounded transition-all cursor-pointer ${localTheme === 'dark' ? 'bg-indigo-600 text-white font-black' : 'text-gray-400 hover:text-white'}`}
              >
                DARK
              </button>
              <button
                onClick={() => {
                  setLocalTheme('default');
                  localStorage.setItem('theme_mode', 'default');
                }}
                className={`px-2.5 py-1 rounded transition-all cursor-pointer ${localTheme === 'default' ? 'bg-indigo-600 text-white font-black' : 'text-gray-400 hover:text-white'}`}
              >
                COSMIC
              </button>
            </div>

            {guestPage === 'landing' ? (
              <button 
                onClick={() => setGuestPage('auth')}
                className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white rounded-xl border border-indigo-500/30 text-xs font-semibold font-mono cursor-pointer transition-all"
              >
                SIGN IN
              </button>
            ) : (
              <button 
                onClick={() => setGuestPage('landing')}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-gray-300 hover:text-white rounded-xl border border-white/5 text-xs font-semibold font-mono cursor-pointer transition-all"
              >
                HOME
              </button>
            )}
          </div>
        </header>

        {guestPage === 'landing' ? (
          <LandingView 
            setCurrentTab={setCurrentTab} 
            kpiStats={kpiStats} 
            isGuest={true}
            onAuthSuccess={handleAuthSuccess}
            onGoToAuth={() => setGuestPage('auth')}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-8 px-4 relative max-w-7xl mx-auto w-full">
            <button
              onClick={() => setGuestPage('landing')}
              className="mb-4 flex items-center gap-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors font-mono self-center cursor-pointer"
            >
              <span>← Back to Home Page</span>
            </button>
            <div className="w-full max-w-md">
              <AuthView onAuthSuccess={handleAuthSuccess} />
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!userRole) {
    return (
      <RoleSelectionView 
        onSelectRole={async (role) => {
          setUserRole(role);
          if (role === 'child') {
            setCurrentTab('kids-dashboard');
          } else if (role === 'authority') {
            setCurrentTab('authority-dashboard');
          } else {
            setCurrentTab('citizen-dashboard');
          }
          if (user) {
            try {
              if (user.isDemo) {
                const updatedProfile = { ...userProfile, role };
                setUserProfile(updatedProfile);
                localStorage.setItem('demo_profile', JSON.stringify(updatedProfile));
                return;
              }
              const userDocRef = doc(db, 'users', user.uid);
              await setDoc(userDocRef, { role }, { merge: true });
              setUserProfile((prev: any) => prev ? { ...prev, role } : { role });
            } catch (err) {
              console.error("Error setting role in Firestore:", err);
            }
          }
        }}
        user={user}
        onSignOut={handleSignOut}
      />
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg text-gray-100 flex flex-col md:flex-row font-sans antialiased">
      {/* Background radial atmosphere */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/20 via-slate-950 to-slate-950" />

      {/* Primary Global Navigation */}
      <Navbar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        userRole={userRole} 
        setUserRole={setUserRole} 
        citizenPoints={citizenPoints}
        user={user}
        userProfile={userProfile}
        onSignOut={handleSignOut}
        currentLanguage={currentLanguage}
        setCurrentLanguage={setCurrentLanguage}
        t={t}
      />

      {/* Main Core View Area */}
      <main className="flex-1 md:h-screen md:overflow-y-auto flex flex-col">
        {/* Connection status bar */}
        <div className={`sticky top-0 z-40 w-full text-xs font-mono py-2.5 px-4 sm:px-6 flex flex-wrap gap-3 items-center justify-between border-b backdrop-blur-md transition-all ${
          getEffectiveOnlineStatus() 
            ? 'bg-slate-950/80 border-white/5 text-slate-400' 
            : 'bg-amber-950/85 border-amber-500/20 text-amber-300'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${getEffectiveOnlineStatus() ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-ping'}`} />
            <span>
              STATUS: <strong className="uppercase">{getEffectiveOnlineStatus() ? t('status_online') : t('status_offline')}</strong>
            </span>
            {drafts.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded text-[10px] uppercase font-bold animate-pulse">
                {drafts.length} Unsynced Draft{drafts.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {drafts.length > 0 && getEffectiveOnlineStatus() && (
              <button
                onClick={syncOfflineDrafts}
                disabled={isSyncingDrafts}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-850 active:scale-95 text-white rounded-lg text-[10px] uppercase font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                {isSyncingDrafts ? 'Syncing...' : `${t('sync_drafts')} 🔄`}
              </button>
            )}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={isSimulatedOffline}
                onChange={(e) => handleToggleOfflineSimulator(e.target.checked)}
                className="rounded bg-slate-900 border-white/10 text-indigo-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
              />
              <span className="text-[10px] uppercase tracking-wider text-slate-300">{t('simulate_offline')}</span>
            </label>
          </div>
        </div>

        <div className="flex-1 px-1 md:px-4 py-4 md:py-8">
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
}
