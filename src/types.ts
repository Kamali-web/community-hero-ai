/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type IssueCategory = 'Roads' | 'Water' | 'Waste' | 'Lighting' | 'Safety';

export type IssueStatus = 'Reported' | 'Verified' | 'Assigned' | 'In Progress' | 'Resolved';

export type SeverityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Comment {
  id: string;
  author: string;
  avatar: string;
  text: string;
  timestamp: string;
  isAuthority: boolean;
}

export interface TimelineEvent {
  id: string;
  status: IssueStatus;
  title: string;
  description: string;
  timestamp: string;
  by: string;
}

export interface AIAnalysis {
  issueType: string;
  severity: SeverityLevel;
  confidenceScore: number;
  priorityScore: number;
  suggestedDepartment: string;
  spamProbability: number;
  duplicateDetected: boolean;
  potentialDuplicateId: string | null;
  environmentalImpact: string;
  resolutionTimeEstimate: string;
  riskScore: number;
}

export interface CivicIssue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  status: IssueStatus;
  severity: SeverityLevel;
  priorityScore: number;
  confidenceScore: number;
  trustScore: number;
  locationName: string;
  latitude: number;
  longitude: number;
  imageUrl: string | null;
  voiceUrl: string | null;
  reportedBy: string;
  reportedAt: string;
  assignedDepartment: string;
  upvotes: number;
  userUpvoted?: boolean;
  comments: Comment[];
  timeline: TimelineEvent[];
  aiAnalysis: AIAnalysis | null;
}

export interface Prediction {
  id: string;
  title: string;
  category: IssueCategory;
  ward: string;
  riskLevel: SeverityLevel;
  probability: number;
  impactScore: number;
  suggestedAction: string;
  timeframe: string;
  confidence: number;
}

export interface Citizen {
  id: string;
  name: string;
  avatar: string;
  points: number;
  trustScore: number;
  reportsCount: number;
  verificationsCount: number;
  badges: string[];
}

export interface CivicMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  suggestions?: string[];
  data?: any;
}
