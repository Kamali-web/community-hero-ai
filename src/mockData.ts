/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CivicIssue, Prediction, Citizen } from './types';

export const INITIAL_CITIZENS: Citizen[] = [
  {
    id: 'c1',
    name: 'Aarav Sharma',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    points: 1250,
    trustScore: 98,
    reportsCount: 14,
    verificationsCount: 45,
    badges: ['Civic Hero', 'Local Watcher', 'Community Guardian']
  },
  {
    id: 'c2',
    name: 'Priya Patel',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    points: 980,
    trustScore: 96,
    reportsCount: 9,
    verificationsCount: 38,
    badges: ['Community Guardian', 'Local Watcher']
  },
  {
    id: 'c3',
    name: 'Karan Malhotra',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
    points: 820,
    trustScore: 94,
    reportsCount: 6,
    verificationsCount: 29,
    badges: ['Local Watcher']
  },
  {
    id: 'c4',
    name: 'Ananya Iyer',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80',
    points: 640,
    trustScore: 91,
    reportsCount: 5,
    verificationsCount: 18,
    badges: ['Local Watcher']
  }
];

export const INITIAL_ISSUES: CivicIssue[] = [
  {
    id: 'iss-1',
    title: 'Severe Pothole Cluster near Primary School',
    description: 'A series of deep potholes have formed right outside Delhi Public School. Cars and auto-rickshaws are swerving dangerously into the opposite lane to avoid them, creating a major hazard during school pickup and drop-off times.',
    category: 'Roads',
    status: 'In Progress',
    severity: 'High',
    priorityScore: 84,
    confidenceScore: 98,
    trustScore: 95,
    locationName: 'Mahatma Gandhi Road, Ward 4 (Near Delhi Public School)',
    latitude: 12.9756,
    longitude: 77.5964,
    imageUrl: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=800&q=80',
    voiceUrl: null,
    reportedBy: 'Aarav Sharma',
    reportedAt: '2026-06-25T08:30:00Z',
    assignedDepartment: 'Department of Transportation',
    upvotes: 34,
    userUpvoted: false,
    comments: [
      {
        id: 'c1',
        author: 'Aarav Sharma',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
        text: 'This is getting worse with the recent monsoon showers. A small hatchback and a scooter almost crashed here yesterday!',
        timestamp: '2026-06-25T08:35:00Z',
        isAuthority: false
      },
      {
        id: 'c2',
        author: 'Chief Engineer Davis',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80',
        text: 'A road maintenance crew has been scheduled for emergency asphalt repair. Expecting completion by Friday morning.',
        timestamp: '2026-06-26T07:15:00Z',
        isAuthority: true
      }
    ],
    timeline: [
      {
        id: 't1',
        status: 'Reported',
        title: 'Issue Submitted',
        description: 'Citizen Aarav Sharma reported the issue. AI analysis estimated a severity of High and recommended the Department of Transportation.',
        timestamp: '2026-06-25T08:30:00Z',
        by: 'System AI'
      },
      {
        id: 't2',
        status: 'Verified',
        title: 'Community Verified',
        description: 'The issue received over 15 community verifications, raising trust score to 95%.',
        timestamp: '2026-06-25T11:45:00Z',
        by: 'Community'
      },
      {
        id: 't3',
        status: 'Assigned',
        title: 'Assigned to Transportation',
        description: 'Auto-routed to Department of Transportation based on AI Department recommendation.',
        timestamp: '2026-06-25T14:20:00Z',
        by: 'Routing Agent'
      },
      {
        id: 't4',
        status: 'In Progress',
        title: 'Repairs Scheduled',
        description: 'Work order #DoT-8842 issued to Roadworks Team.',
        timestamp: '2026-06-26T07:15:00Z',
        by: 'DoT Authority'
      }
    ],
    aiAnalysis: {
      issueType: 'Pothole & Asphalt Degradation',
      severity: 'High',
      confidenceScore: 98,
      priorityScore: 84,
      suggestedDepartment: 'Department of Transportation',
      spamProbability: 2,
      duplicateDetected: false,
      potentialDuplicateId: null,
      environmentalImpact: 'Medium (Increases vehicle emissions due to deceleration, minor safety hazard for pedestrians)',
      resolutionTimeEstimate: '48 Hours',
      riskScore: 82
    }
  },
  {
    id: 'iss-2',
    title: 'Major Water Main Burst Flooding Sidewalk',
    description: 'There is a major water pipe rupture causing water to gush out onto the pavement near the metro line. It is leaking clean water at an alarming rate and causing soil erosion around the nearby utility pole.',
    category: 'Water',
    status: 'Verified',
    severity: 'Critical',
    priorityScore: 92,
    confidenceScore: 95,
    trustScore: 99,
    locationName: 'Nehru Nagar Ring Road, Ward 2 (Opposite Apollo Hospital)',
    latitude: 12.9692,
    longitude: 77.5898,
    imageUrl: 'https://images.unsplash.com/photo-1542013936693-8848e5740a7a?auto=format&fit=crop&w=800&q=80',
    voiceUrl: null,
    reportedBy: 'Priya Patel',
    reportedAt: '2026-06-26T04:10:00Z',
    assignedDepartment: 'Water Supply & Sewage Board',
    upvotes: 48,
    userUpvoted: false,
    comments: [
      {
        id: 'c1',
        author: 'Priya Patel',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
        text: 'The water pressure is very high, it is flooding the entrance to the hospital annex. Immediate shutdown required!',
        timestamp: '2026-06-26T04:12:00Z',
        isAuthority: false
      }
    ],
    timeline: [
      {
        id: 't1',
        status: 'Reported',
        title: 'Critical Report Received',
        description: 'Priya Patel submitted water leakage report. Emergency alarm triggered due to proximity to Apollo Hospital.',
        timestamp: '2026-06-26T04:10:00Z',
        by: 'System AI'
      },
      {
        id: 't2',
        status: 'Verified',
        title: 'Emergency Verified',
        description: 'Auto-verified based on visual matching and proximity alerts.',
        timestamp: '2026-06-26T04:11:00Z',
        by: 'Verification Agent'
      }
    ],
    aiAnalysis: {
      issueType: 'Water Main Break',
      severity: 'Critical',
      confidenceScore: 95,
      priorityScore: 92,
      suggestedDepartment: 'Water Supply & Sewage Dept',
      spamProbability: 1,
      duplicateDetected: false,
      potentialDuplicateId: null,
      environmentalImpact: 'Critical (Clean water wastage estimated at 250 liters/min, undermining of nearby roadway/utility pole)',
      resolutionTimeEstimate: '4 Hours',
      riskScore: 95
    }
  },
  {
    id: 'iss-3',
    title: 'Illegal Chemical Dumping in Green Zone',
    description: 'Several barrels of unknown chemical fluids and massive piles of plastic wastes have been dumped overnight in the public park behind the residential layout. A strong chemical odor is present.',
    category: 'Waste',
    status: 'Reported',
    severity: 'Critical',
    priorityScore: 89,
    confidenceScore: 91,
    trustScore: 87,
    locationName: 'Koramangala 3rd Block Greenbelt, Ward 5 (Residential Layout)',
    latitude: 12.9348,
    longitude: 77.6189,
    imageUrl: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=800&q=80',
    voiceUrl: null,
    reportedBy: 'Karan Malhotra',
    reportedAt: '2026-06-26T06:50:00Z',
    assignedDepartment: 'State Pollution Control Board',
    upvotes: 18,
    userUpvoted: false,
    comments: [],
    timeline: [
      {
        id: 't1',
        status: 'Reported',
        title: 'Hazardous Waste Report Filed',
        description: 'Karan Malhotra reported the dumping with photographic proof. AI Analysis flagged possible hazardous materials.',
        timestamp: '2026-06-26T06:50:00Z',
        by: 'System AI'
      }
    ],
    aiAnalysis: {
      issueType: 'Hazardous & Illegal Waste Dumping',
      severity: 'Critical',
      confidenceScore: 91,
      priorityScore: 89,
      suggestedDepartment: 'Environmental Health & Sanitation',
      spamProbability: 3,
      duplicateDetected: false,
      potentialDuplicateId: null,
      environmentalImpact: 'High (Soil contamination risk, hazardous vapor emission in vicinity of children and households)',
      resolutionTimeEstimate: '12 Hours',
      riskScore: 90
    }
  },
  {
    id: 'iss-4',
    title: 'Series of Broken Streetlights on Main Junction Entrance',
    description: 'An entire stretch of 8 streetlights is completely black on the entrance of APJ Abdul Kalam Marg. It is extremely dark at night, making the merging zone highly dangerous for commuters and two-wheelers.',
    category: 'Lighting',
    status: 'Assigned',
    severity: 'Medium',
    priorityScore: 68,
    confidenceScore: 94,
    trustScore: 90,
    locationName: 'APJ Abdul Kalam Marg, Ward 1 (Outer Circle Junction)',
    latitude: 12.9845,
    longitude: 77.6012,
    imageUrl: 'https://images.unsplash.com/photo-1509024644558-2f56ce76c490?auto=format&fit=crop&w=800&q=80',
    voiceUrl: null,
    reportedBy: 'Ananya Iyer',
    reportedAt: '2026-06-24T21:15:00Z',
    assignedDepartment: 'State Electricity Board',
    upvotes: 12,
    userUpvoted: false,
    comments: [
      {
        id: 'c1',
        author: 'Ananya Iyer',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80',
        text: 'Rode my scooter past here tonight and it was completely pitch black. Very hard to see speed breakers.',
        timestamp: '2026-06-24T21:20:00Z',
        isAuthority: false
      }
    ],
    timeline: [
      {
        id: 't1',
        status: 'Reported',
        title: 'Issue Logged',
        description: 'Report filed by Ananya Iyer.',
        timestamp: '2026-06-24T21:15:00Z',
        by: 'System'
      },
      {
        id: 't2',
        status: 'Verified',
        title: 'Community Upvoted',
        description: 'Verified by multiple commuting residents.',
        timestamp: '2026-06-25T01:30:00Z',
        by: 'Community'
      },
      {
        id: 't3',
        status: 'Assigned',
        title: 'Assigned to Grid Department',
        description: 'Assigned to Municipal Lighting Department.',
        timestamp: '2026-06-25T09:00:00Z',
        by: 'Routing Agent'
      }
    ],
    aiAnalysis: {
      issueType: 'Electrical Grid Fail',
      severity: 'Medium',
      confidenceScore: 94,
      priorityScore: 68,
      suggestedDepartment: 'State Electricity Board',
      spamProbability: 1,
      duplicateDetected: false,
      potentialDuplicateId: null,
      environmentalImpact: 'Low (Safety hazard, increases traffic accident risk index by 45%)',
      resolutionTimeEstimate: '72 Hours',
      riskScore: 65
    }
  }
];

export const INITIAL_PREDICTIONS: Prediction[] = [
  {
    id: 'pred-1',
    title: 'High Risk Pothole Development Corridor',
    category: 'Roads',
    ward: 'Ward 4 (MG Road Sector)',
    riskLevel: 'High',
    probability: 88,
    impactScore: 75,
    suggestedAction: 'Proactive micro-surfacing and moisture sealing before monsoon season.',
    timeframe: 'Next 14-30 Days',
    confidence: 92
  },
  {
    id: 'pred-2',
    title: 'Water Supply Leak Risk',
    category: 'Water',
    ward: 'Ward 2 (Hospital Layout)',
    riskLevel: 'Medium',
    probability: 65,
    impactScore: 90,
    suggestedAction: 'Regulate flow valves at Nehru Nagar Substation to stabilize peak pressure.',
    timeframe: 'Next 7 Days',
    confidence: 85
  },
  {
    id: 'pred-3',
    title: 'Garbage Hotspot / Litter Accumulation Zone',
    category: 'Waste',
    ward: 'Ward 5 (Koramangala 3rd Block)',
    riskLevel: 'High',
    probability: 82,
    impactScore: 60,
    suggestedAction: 'Increase smart waste bin clearance frequency and deploy public reminders.',
    timeframe: 'Next 3 Days',
    confidence: 90
  },
  {
    id: 'pred-4',
    title: 'Aging Cable Grid failure',
    category: 'Lighting',
    ward: 'Ward 1 (Outer Ring Road Suburbs)',
    riskLevel: 'Medium',
    probability: 58,
    impactScore: 70,
    suggestedAction: 'Perform preventative thermal inspection of substation junctions.',
    timeframe: 'Next 15 Days',
    confidence: 78
  }
];

export const CIVIC_KPI_STATS = {
  totalReports: 145,
  activeReports: 28,
  resolvedIssues: 117,
  avgResolutionTime: '18.4 Hrs',
  citizensBenefited: '34,250',
  waterSavedLiters: '124,000',
  roadsRepairedSqM: '1,450',
  accidentReductionPct: '42%',
  communitySatisfaction: 94,
  pointsIssued: 15400,
  communityHealthScore: 88,
  infrastructureScores: {
    roads: 81,
    water: 89,
    lighting: 92,
    waste: 79,
    safety: 85
  }
};
