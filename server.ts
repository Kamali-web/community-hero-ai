/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import dotenv from 'dotenv';
import { INITIAL_ISSUES, INITIAL_PREDICTIONS, CIVIC_KPI_STATS, INITIAL_CITIZENS } from './src/mockData';
import { CivicIssue, Comment, TimelineEvent, AIAnalysis, Prediction, IssueCategory, SeverityLevel } from './src/types';

dotenv.config();

// Initialize Express
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));

// In-Memory Database State with Filesystem Persistence
import fs from 'fs';

const DB_FILE = path.join(process.cwd(), 'issues_db.json');

function loadIssues(): CivicIssue[] {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(data);
    } else {
      fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_ISSUES, null, 2), 'utf8');
    }
  } catch (error) {
    console.error('Error loading/initializing local issues database:', error);
  }
  return [...INITIAL_ISSUES];
}

function saveIssues(updatedIssues: CivicIssue[]) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(updatedIssues, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving issues to database:', error);
  }
}

let issues: CivicIssue[] = loadIssues();
let predictions: Prediction[] = [...INITIAL_PREDICTIONS];
let kpiStats = { ...CIVIC_KPI_STATS };
let citizens = [...INITIAL_CITIZENS];

// Lazy-loaded Gemini AI client setup
let ai: GoogleGenAI | null = null;
const isGeminiEnabled = !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');

if (isGeminiEnabled) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    console.log('Successfully initialized Gemini Client on server.');
  } catch (error) {
    console.error('Error initializing Gemini client:', error);
  }
} else {
  console.log('Gemini API key not configured or is placeholder. Falling back to local smart heuristic analysis.');
}

// REST API Endpoints

// 1. Get all issues
app.get('/api/issues', (req, res) => {
  res.json(issues);
});

// 2. Get specific issue
app.get('/api/issues/:id', (req, res) => {
  const issue = issues.find((i) => i.id === req.params.id);
  if (issue) {
    res.json(issue);
  } else {
    res.status(404).json({ error: 'Issue not found' });
  }
});

// Helper: Local Smart Heuristics as fallback for Gemini Analysis
function runLocalHeuristicAnalysis(title: string, description: string, category: IssueCategory): AIAnalysis {
  const text = (title + ' ' + description).toLowerCase();
  
  let severity: SeverityLevel = 'Medium';
  let priorityScore = 50;
  let suggestedDepartment = 'Department of Transportation';
  let estTime = '72 Hours';
  let envImpact = 'Low (Minor local obstruction)';

  if (category === 'Roads') {
    suggestedDepartment = 'Department of Transportation';
    if (text.includes('accident') || text.includes('severe') || text.includes('school') || text.includes('hospital')) {
      severity = 'High';
      priorityScore = 80;
      estTime = '48 Hours';
      envImpact = 'Medium (Increases vehicular deceleration and safety hazards)';
    } else {
      severity = 'Medium';
      priorityScore = 55;
    }
  } else if (category === 'Water') {
    suggestedDepartment = 'Aegis Water Authority';
    if (text.includes('flood') || text.includes('burst') || text.includes('gush') || text.includes('leakage')) {
      severity = 'Critical';
      priorityScore = 90;
      estTime = '4 Hours';
      envImpact = 'Critical (Clean water waste, structural erosion risks)';
    } else {
      severity = 'Medium';
      priorityScore = 60;
      estTime = '24 Hours';
    }
  } else if (category === 'Waste') {
    suggestedDepartment = 'Environmental Health & Sanitation';
    if (text.includes('toxic') || text.includes('chemical') || text.includes('smell') || text.includes('dumping')) {
      severity = 'Critical';
      priorityScore = 85;
      estTime = '12 Hours';
      envImpact = 'High (Risk of soil pollution and biological hazards)';
    } else {
      severity = 'Low';
      priorityScore = 35;
      estTime = '48 Hours';
    }
  } else if (category === 'Lighting') {
    suggestedDepartment = 'Municipal Lighting & Grid Agency';
    if (text.includes('dark') || text.includes('highway') || text.includes('all black')) {
      severity = 'Medium';
      priorityScore = 65;
      estTime = '48 Hours';
      envImpact = 'Medium (Increases collision and public safety index)';
    } else {
      severity = 'Low';
      priorityScore = 40;
      estTime = '96 Hours';
    }
  } else if (category === 'Safety') {
    suggestedDepartment = 'Public Safety & Emergency Services';
    severity = 'High';
    priorityScore = 75;
    estTime = '24 Hours';
    envImpact = 'Medium (Active threat to pedestrian or passenger life-safety)';
  }

  return {
    issueType: `${category} Infrastructure Issue`,
    severity,
    confidenceScore: 92,
    priorityScore,
    suggestedDepartment,
    spamProbability: 5,
    duplicateDetected: false,
    potentialDuplicateId: null,
    environmentalImpact: envImpact,
    resolutionTimeEstimate: estTime,
    riskScore: priorityScore,
  };
}

// Helper function to extract or fetch image base64 data for Gemini
async function getBase64FromUrl(url: string): Promise<{ mimeType: string; data: string } | null> {
  try {
    if (url.startsWith('data:image/')) {
      const matches = url.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        return { mimeType: matches[1], data: matches[2] };
      }
    } else if (url.startsWith('http://') || url.startsWith('https://')) {
      const response = await fetch(url);
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const mimeType = response.headers.get('content-type') || 'image/jpeg';
        return {
          mimeType,
          data: buffer.toString('base64')
        };
      }
    }
  } catch (error) {
    console.error('Error fetching/converting image URL to base64:', error);
  }
  return null;
}

// Helper: Local Smart Heuristic Image Assessment as fallback
function runLocalHeuristicImageAnalysis(prompt: string): any {
  const text = (prompt || '').toLowerCase();
  let issueTitle = 'Pavement Cracking & Subgrade Failure';
  let category = 'Roads';
  let severity = 'Medium';
  let priorityScore = 55;
  let safetyHazard = 'Visible degradation of asphalt surface showing signs of thermal fatigue or subgrade failure. Creates minor swerve hazards for fast-moving traffic.';
  let suggestedDepartment = 'Department of Transportation';
  let remediationChecklist = [
    'Secure perimeter with high-visibility reflective cones',
    'Excavate compromised asphalt layer down to base course',
    'Infill sub-base gravel and compact to 95% density',
    'Lay hot-mix asphalt (HMA) overlay and roll to seal'
  ];
  let resolutionTimeEstimate = '72 Hours';
  let environmentalImpact = 'Low immediate environmental risk, though storm runoff can penetrate cracks and exacerbate structural damage.';
  let confidenceScore = 85;

  if (text.includes('pothole') || text.includes('asphalt') || text.includes('road')) {
    issueTitle = 'Critical Asphalt Pothole Cluster';
    category = 'Roads';
    severity = 'High';
    priorityScore = 82;
    safetyHazard = 'Deep structural pothole cluster with sharp edges exposing aggregate base. High risk of high-impact vehicle tire blowouts, wheel rim damage, or cyclist crashes.';
    remediationChecklist = [
      'Deploy temporary traffic warning signs',
      'Clean loose debris and water from pothole cavity',
      'Apply bitumen tack coat adhesive layer',
      'Fill cavity with hot asphalt patch and vibrate-compact'
    ];
    resolutionTimeEstimate = '24 Hours';
  } else if (text.includes('flood') || text.includes('leak') || text.includes('water') || text.includes('drain')) {
    issueTitle = 'Water Distribution Mainline Leakage';
    category = 'Water';
    severity = 'High';
    priorityScore = 78;
    safetyHazard = 'Active high-pressure water mains leak leading to rapid street surface flooding. Risk of soil liquefaction under pavement or building foundation settling.';
    suggestedDepartment = 'Department of Water & Sewage Administration';
    remediationChecklist = [
      'Isolate immediate zone gate-valves to stop water flow',
      'Excavate mud to expose compromised pressurized pipe join',
      'Deploy emergency clamp or wrap damaged iron pipe section',
      'Flush line, test pressure, and backfill soil'
    ];
    resolutionTimeEstimate = '12 Hours';
    environmentalImpact = 'High clean drinking water wastage, estimated loss of 120 liters/minute. Localized sub-soil erosion.';
  } else if (text.includes('trash') || text.includes('dump') || text.includes('waste') || text.includes('garbage')) {
    issueTitle = 'Illegal Toxic Waste & Solid Dumping';
    category = 'Waste';
    severity = 'High';
    priorityScore = 75;
    safetyHazard = 'Unregulated accumulation of solid construction waste, electronics, and potential biochemical hazards. Attracts pests and rodents and presents chemical burn risks.';
    suggestedDepartment = 'Environmental Health & Solid Waste Services';
    remediationChecklist = [
      'Cordon off dumping zone with hazard tape',
      'Sort recyclable metals and hazardous electrical waste',
      'Operate heavy loaders to scoop solid aggregates',
      'Sweep residues and disinfect local surface soil'
    ];
    resolutionTimeEstimate = '48 Hours';
    environmentalImpact = 'Medium risk of local groundwater contamination from toxic chemical batteries or plastic leachates.';
  } else if (text.includes('light') || text.includes('electrical') || text.includes('dark')) {
    issueTitle = 'Total Streetlight Grid Blackout';
    category = 'Lighting';
    severity = 'Medium';
    priorityScore = 60;
    safetyHazard = 'Consecutive streetlights inactive in high-density residential sidewalk. Creates dark visual blindspots, increasing risks of physical accidents or pedestrian crimes.';
    suggestedDepartment = 'Municipal Power & Grid Utilities';
    remediationChecklist = [
      'Map dark-zone feed to identify substation fuse fail',
      'Deploy utility bucket truck to access high-mast poles',
      'Replace burnt high-pressure sodium bulbs with active LEDs',
      'Test photoelectric switch circuits'
    ];
    resolutionTimeEstimate = '36 Hours';
    environmentalImpact = 'Increases energy consumption if faulty photo-sensors keep bulbs active during daylight hours.';
  }

  return {
    issueTitle,
    category,
    severity,
    priorityScore,
    safetyHazard,
    suggestedDepartment,
    remediationChecklist,
    resolutionTimeEstimate,
    environmentalImpact,
    confidenceScore
  };
}

// 2.5. Dedicated AI Visual Assessment Endpoint using gemini-3.5-flash
app.post('/api/analyze-image', async (req, res) => {
  try {
    const { imageUrl, prompt } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ error: 'Missing required parameter: imageUrl' });
    }

    if (ai && isGeminiEnabled) {
      try {
        console.log(`Running image understanding analysis via gemini-3.5-flash...`);
        
        const systemInstruction = `You are "Aegis-Vision-Assessor", an expert cognitive AI structural engineer and municipal safety inspector.
You perform critical physical inspections on community hazards using uploaded evidence.`;

        const textPrompt = `Analyze this uploaded image showing a local civic infrastructure issue or municipal hazard.
Optional User Prompt/Directives: "${prompt || 'Describe this issue, its severity, risk level, and suggested repair checklist.'}"

You MUST perform a deep, rigorous visual inspection and structural analysis.
Format your assessment strictly as a JSON object containing these exact fields:
{
  "issueTitle": "A concise, professional title for the issue",
  "category": "One of: Roads, Water, Waste, Lighting, Safety",
  "severity": "One of: Low, Medium, High, Critical",
  "priorityScore": number between 0 and 100 representing urgency,
  "safetyHazard": "An expert, high-level description of immediate or secondary public hazards and risks shown",
  "suggestedDepartment": "The municipal department best suited to handle this",
  "remediationChecklist": ["Step 1 of action plan", "Step 2", "Step 3", "Step 4"],
  "resolutionTimeEstimate": "SLA timeframe estimate, e.g. 12 Hours, 24 Hours, 3 Days",
  "environmentalImpact": "Evaluation of environmental or community impact",
  "confidenceScore": number between 0 and 100 of your visual analysis confidence
}

Ensure the JSON output is valid, clean, and contains no additional markdown blocks around it other than the JSON itself.`;

        const contents: any[] = [];
        const base64Data = await getBase64FromUrl(imageUrl);
        if (base64Data) {
          contents.push({
            inlineData: {
              mimeType: base64Data.mimeType,
              data: base64Data.data
            }
          });
        }
        contents.push({ text: textPrompt });

        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: { parts: contents },
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                issueTitle: { type: Type.STRING },
                category: { type: Type.STRING },
                severity: { type: Type.STRING },
                priorityScore: { type: Type.INTEGER },
                safetyHazard: { type: Type.STRING },
                suggestedDepartment: { type: Type.STRING },
                remediationChecklist: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                resolutionTimeEstimate: { type: Type.STRING },
                environmentalImpact: { type: Type.STRING },
                confidenceScore: { type: Type.INTEGER }
              },
              required: [
                'issueTitle', 'category', 'severity', 'priorityScore', 
                'safetyHazard', 'suggestedDepartment', 'remediationChecklist', 
                'resolutionTimeEstimate', 'environmentalImpact', 'confidenceScore'
              ]
            }
          }
        });

        const parsedAnalysis = JSON.parse(response.text || '{}');
        return res.json(parsedAnalysis);
      } catch (geminiError: any) {
        console.log(`Gemini image analysis unavailable (${geminiError?.message || geminiError}). Falling back to local heuristic image assessment.`);
        const dummyResult = runLocalHeuristicImageAnalysis(prompt);
        return res.json(dummyResult);
      }
    } else {
      console.log('Gemini API key not configured or is placeholder. Falling back to offline heuristic image assessment.');
      const dummyResult = runLocalHeuristicImageAnalysis(prompt);
      return res.json(dummyResult);
    }
  } catch (error: any) {
    console.log(`Visual analysis endpoint failed: ${error?.message || error}`);
    res.status(500).json({ error: 'Visual analysis engine failure. Check server logs.' });
  }
});

// 3. Create a new issue (with optional Gemini analysis)
app.post('/api/issues', async (req, res) => {
  try {
    const { title, description, category, locationName, latitude, longitude, imageUrl, voiceUrl, reportedBy, justAnalyzeOnly, aiAnalysis: clientAiAnalysis } = req.body;
    
    if (!title || !description || !category || !locationName) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const id = `iss-${Date.now()}`;
    const reportedAt = new Date().toISOString();

    let aiAnalysis: AIAnalysis;

    // Use pre-computed client analysis if available to skip double Gemini calls
    if (clientAiAnalysis) {
      aiAnalysis = clientAiAnalysis;
    } else if (ai && isGeminiEnabled) {
      try {
        console.log(`Running real Gemini Analysis Agent for: "${title}"`);
        
        const textPrompt = `Analyze this citizen reported civic infrastructure issue:
Title: "${title}"
Description: "${description}"
Category: "${category}"
Location: "${locationName}"

Analyze this issue as multiple coordinating agents:
1. Analysis Agent: Identify precise issue type, severity level (one of: 'Low', 'Medium', 'High', 'Critical'), confidence percentage (0-100), and suggested responsible department.
2. Verification Agent: Detect if this is spam or fraudulent (spamProbability 0-100), and if it is likely a duplicate (duplicateDetected).
3. Priority Agent: Calculate a priorityScore (0-100) taking into account safety hazards, affected populations, and environmental impact. Provide a brief sentence on environmentalImpact, and a realistic resolutionTimeEstimate (e.g. "4 Hours", "24 Hours", "72 Hours").
`;

        const contents: any[] = [];
        if (imageUrl) {
          const base64Data = await getBase64FromUrl(imageUrl);
          if (base64Data) {
            contents.push({
              inlineData: {
                mimeType: base64Data.mimeType,
                data: base64Data.data
              }
            });
          }
        }
        contents.push({ text: textPrompt });

        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: { parts: contents },
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                issueType: { type: Type.STRING, description: 'Specific classified type of the infrastructure issue' },
                severity: { type: Type.STRING, description: 'Must be one of: Low, Medium, High, Critical' },
                confidenceScore: { type: Type.INTEGER, description: 'Confidence of AI classification (0-100)' },
                priorityScore: { type: Type.INTEGER, description: 'Calculated severity priority rating (0-100)' },
                suggestedDepartment: { type: Type.STRING, description: 'Responsible city agency or department' },
                spamProbability: { type: Type.INTEGER, description: 'Likelihood of report being spam or fake (0-100)' },
                duplicateDetected: { type: Type.BOOLEAN, description: 'Whether this matches existing complaints' },
                environmentalImpact: { type: Type.STRING, description: 'Short summary of environmental or societal risk' },
                resolutionTimeEstimate: { type: Type.STRING, description: 'Estimated hours or days to resolve' }
              },
              required: [
                'issueType', 'severity', 'confidenceScore', 'priorityScore', 
                'suggestedDepartment', 'spamProbability', 'duplicateDetected', 
                'environmentalImpact', 'resolutionTimeEstimate'
              ]
            }
          }
        });

        const parsedAnalysis = JSON.parse(response.text || '{}');
        aiAnalysis = {
          issueType: parsedAnalysis.issueType || `${category} Infrastructure Issue`,
          severity: parsedAnalysis.severity as SeverityLevel || 'Medium',
          confidenceScore: parsedAnalysis.confidenceScore || 90,
          priorityScore: parsedAnalysis.priorityScore || 50,
          suggestedDepartment: parsedAnalysis.suggestedDepartment || 'Municipal Utilities',
          spamProbability: parsedAnalysis.spamProbability || 0,
          duplicateDetected: parsedAnalysis.duplicateDetected || false,
          potentialDuplicateId: null,
          environmentalImpact: parsedAnalysis.environmentalImpact || 'Low impact reported.',
          resolutionTimeEstimate: parsedAnalysis.resolutionTimeEstimate || '48 Hours',
          riskScore: parsedAnalysis.priorityScore || 50
        };

      } catch (geminiError: any) {
        console.log(`Gemini Analysis failed (${geminiError?.message || geminiError}), falling back to heuristics.`);
        aiAnalysis = runLocalHeuristicAnalysis(title, description, category);
      }
    } else {
      aiAnalysis = runLocalHeuristicAnalysis(title, description, category);
    }

    // If it is just an analysis preview, return immediately without storing or mutating state!
    if (justAnalyzeOnly) {
      return res.json({ aiAnalysis });
    }

    // Adjust scores based on analysis
    const newIssue: CivicIssue = {
      id,
      title,
      description,
      category,
      status: 'Reported',
      severity: aiAnalysis.severity,
      priorityScore: aiAnalysis.priorityScore,
      confidenceScore: aiAnalysis.confidenceScore,
      trustScore: Math.max(10, 100 - aiAnalysis.spamProbability),
      locationName,
      latitude: parseFloat(latitude) || 37.7749,
      longitude: parseFloat(longitude) || -122.4194,
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
          title: 'Issue Lodged',
          description: `Citizen submitted issue successfully in Category: ${category}. AI assigned to ${aiAnalysis.suggestedDepartment}.`,
          timestamp: reportedAt,
          by: 'System AI'
        }
      ],
      aiAnalysis
    };

    issues.unshift(newIssue);
    saveIssues(issues);

    // Dynamic Updates to Community Statistics & Reward Points
    kpiStats.totalReports += 1;
    kpiStats.activeReports += 1;
    
    // Give 50 points to reporter
    const reporter = citizens.find(c => c.name === reportedBy);
    if (reporter) {
      reporter.points += 50;
      reporter.reportsCount += 1;
    }

    res.status(201).json(newIssue);
  } catch (err) {
    console.error('Error creating issue:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 4. Upvote / Verify an issue (increases trust score and upvotes)
app.post('/api/issues/:id/upvote', (req, res) => {
  const { citizenName } = req.body;
  const issue = issues.find((i) => i.id === req.params.id);
  
  if (!issue) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  if (issue.userUpvoted) {
    // Revoke upvote
    issue.upvotes = Math.max(0, issue.upvotes - 1);
    issue.userUpvoted = false;
    issue.trustScore = Math.max(10, issue.trustScore - 2);
  } else {
    // Add upvote
    issue.upvotes += 1;
    issue.userUpvoted = true;
    issue.trustScore = Math.min(100, issue.trustScore + 3);

    // Award point to citizen verifying
    const citizen = citizens.find(c => c.name === citizenName);
    if (citizen) {
      citizen.points += 10;
      citizen.verificationsCount += 1;
    }

    // Generate timeline event if upvotes reach threshold
    if (issue.status === 'Reported' && issue.upvotes >= 10) {
      issue.status = 'Verified';
      issue.timeline.push({
        id: `t-${Date.now()}-verify`,
        status: 'Verified',
        title: 'Community Verified Threshold',
        description: `This issue has received ${issue.upvotes} community verifications. Status upgraded to Verified with a trust factor of ${issue.trustScore}%.`,
        timestamp: new Date().toISOString(),
        by: 'Civic Community'
      });
    }
  }

  saveIssues(issues);
  res.json(issue);
});

// 5. Add a comment
app.post('/api/issues/:id/comment', (req, res) => {
  const { author, avatar, text, isAuthority } = req.body;
  const issue = issues.find((i) => i.id === req.params.id);

  if (!issue) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  const newComment: Comment = {
    id: `comm-${Date.now()}`,
    author: author || 'Citizen',
    avatar: avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
    text: text || '',
    timestamp: new Date().toISOString(),
    isAuthority: !!isAuthority,
  };

  issue.comments.push(newComment);

  // If authority comments, add some notes or trust
  if (isAuthority) {
    issue.trustScore = Math.min(100, issue.trustScore + 5);
  }

  saveIssues(issues);
  res.status(201).json(issue);
});

// 6. Update Status (Authority Dashboard tool)
app.post('/api/issues/:id/status', (req, res) => {
  const { status, assignedDepartment, by } = req.body;
  const issue = issues.find((i) => i.id === req.params.id);

  if (!issue) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  const previousStatus = issue.status;
  issue.status = status as any;
  if (assignedDepartment) {
    issue.assignedDepartment = assignedDepartment;
  }

  const updateTime = new Date().toISOString();

  // Add timeline event
  issue.timeline.push({
    id: `t-${Date.now()}-status`,
    status: status as any,
    title: `Status set to ${status}`,
    description: `Administrative update: status transitioned from "${previousStatus}" to "${status}" under responsibility of "${issue.assignedDepartment}".`,
    timestamp: updateTime,
    by: by || 'City Authority'
  });

  // KPI adjustments
  if (status === 'Resolved' && previousStatus !== 'Resolved') {
    kpiStats.activeReports = Math.max(0, kpiStats.activeReports - 1);
    kpiStats.resolvedIssues += 1;
    
    // Increment benefited counts
    const benefited = Math.floor(Math.random() * 450) + 50;
    kpiStats.citizensBenefited = (parseInt(kpiStats.citizensBenefited.replace(/,/g, '')) + benefited).toLocaleString();
    
    if (issue.category === 'Water') {
      kpiStats.waterSavedLiters = (parseInt(kpiStats.waterSavedLiters.replace(/,/g, '')) + 8000).toLocaleString();
    } else if (issue.category === 'Roads') {
      kpiStats.roadsRepairedSqM = (parseInt(kpiStats.roadsRepairedSqM.replace(/,/g, '')) + 15).toLocaleString();
    }
  } else if (previousStatus === 'Resolved' && status !== 'Resolved') {
    kpiStats.activeReports += 1;
    kpiStats.resolvedIssues = Math.max(0, kpiStats.resolvedIssues - 1);
  }

  saveIssues(issues);
  res.json(issue);
});

// 7. CivicGPT chatbot - contextually answers issues from the in-memory database
app.post('/api/civic-gpt', async (req, res) => {
  try {
    const { 
      messages, 
      model = 'gemini-3.5-flash', 
      role = 'general', 
      enableThinking = false, 
      useMapsGrounding = false, 
      latitude, 
      longitude 
    } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages array' });
    }

    const lastMessage = messages[messages.length - 1]?.text || 'Hello';
    
    // Gather context of what is currently happening in Aegis City
    const activeIssueSummary = issues.map(i => `- [${i.category}] "${i.title}" at ${i.locationName}. Status: ${i.status}, Priority: ${i.priorityScore}/100, Severity: ${i.severity}`).join('\n');
    const predictionSummary = predictions.map(p => `- Predictive Risk: "${p.title}" at ${p.ward}. Category: ${p.category}, Probability: ${p.probability}%, Severity: ${p.riskLevel}`).join('\n');
    const cityStatsSummary = `City Stats:\n- Community Health Index: ${kpiStats.communityHealthScore}/100\n- Total Reported Complaints: ${kpiStats.totalReports}\n- Currently Active Problems: ${kpiStats.activeReports}\n- Resolved in Last Month: ${kpiStats.resolvedIssues}\n- Road Health Rating: ${kpiStats.infrastructureScores.roads}%\n- Clean Water Distribution: ${kpiStats.infrastructureScores.water}%\n- Trash/Sanitation Level: ${kpiStats.infrastructureScores.waste}%`;

    let personaPrompt = '';
    if (role === 'complex') {
      personaPrompt = `You are "Aegis-Inspector", a high-reasoning, deep-thinking civic safety inspector.
Your mission is to perform rigorous risk assessments on reported problems, analyze engineering or structural safety hazards, and provide exhaustive, detailed, and critical security diagnostics.
Speak critically, logically, and exhaustively like an expert structural forensic engineer. Always explore root causes, secondary consequences, and complex safety hazards.`;
    } else if (role === 'fast') {
      personaPrompt = `You are "Aegis-Dispatch", an action-oriented rapid response coordinator.
Your mission is to provide lightning-fast, ultra-direct response guidelines.
Speak in an extremely concise, punchy, and action-focused style. No fluff, no long introductions. List immediate action steps for emergency crews and citizen safety.`;
    } else {
      personaPrompt = `You are "CivicGPT", the ultimate AI-powered Civic Intelligence planner for Aegis City.
Your mission is to help citizens and authorities understand reported hazards, predictive infrastructure risks, and municipal trends.
Be incredibly helpful, friendly, supportive, and clear. Speak like a smart, analytical municipal planner with an encouraging tone.`;
    }

    const systemPrompt = `${personaPrompt}

You have absolute, real-time access to the live digital state of Aegis City:
------------------------------------------
${cityStatsSummary}

Currently Reported Active Complaints in the City:
${activeIssueSummary}

Future Predicted Infrastructure Hazards (Early Warnings):
${predictionSummary}
------------------------------------------

When answering queries, you MUST refer to these REAL live issues, stats, and predictions.
Always cite specific complaints (e.g. "Severe Pothole Cluster near Primary School on Broad Street") or active risks when they match the user's intent.

If the user asks about predictions, summarize the predictions list.
If they ask about complaints, summarize the reported issues, especially Critical or High severity ones.
If they ask about issues near them, mention issues in Ward 4, Ward 2, Ward 5 or Ward 1 depending on where they ask.

Return your response in standard Markdown format. Use bold headers, lists, tables, or blockquotes to structure your output elegantly!`;

    let reply = '';
    let groundingChunks = null;
    let groundingMetadata = null;
    let fallbackToOffline = false;

    if (ai && isGeminiEnabled) {
      try {
        console.log(`Calling Gemini [Model: ${model}, Role: ${role}, Thinking: ${enableThinking}, Maps Grounding: ${useMapsGrounding}]`);
        
        // Filter and normalize messages for Gemini multi-turn conversation
        const cleanMessages = messages.filter(m => {
          if (!m.text) return false;
          const txt = m.text;
          if (txt.includes('⚠️') || txt.includes('System Notice') || txt.includes('Fallback Alert') || txt.includes('Offline Demo Sandbox')) {
            return false;
          }
          return m.sender === 'user' || m.sender === 'bot';
        });

        const contents: any[] = [];
        let expectedRole: 'user' | 'model' = 'user';

        for (const msg of cleanMessages) {
          const mRole = msg.sender === 'user' ? 'user' : 'model';
          if (mRole === expectedRole) {
            contents.push({
              role: mRole,
              parts: [{ text: msg.text }]
            });
            expectedRole = expectedRole === 'user' ? 'model' : 'user';
          } else {
            if (mRole === 'user' && expectedRole === 'model') {
              if (contents.length > 0) {
                contents[contents.length - 1].parts[0].text += `\n\n${msg.text}`;
              } else {
                contents.push({
                  role: 'user',
                  parts: [{ text: msg.text }]
                });
                expectedRole = 'model';
              }
            } else if (mRole === 'model' && expectedRole === 'user') {
              if (contents.length > 0) {
                contents[contents.length - 1].parts[0].text += `\n\n${msg.text}`;
              }
            }
          }
        }

        // Ensure we have at least one user turn to start
        if (contents.length === 0) {
          contents.push({
            role: 'user',
            parts: [{ text: lastMessage }]
          });
        }

        const config: any = {
          systemInstruction: systemPrompt,
          temperature: role === 'fast' ? 0.3 : 0.7,
        };

        // Handle Thinking Mode for gemini-3.1-pro-preview
        if (model === 'gemini-3.1-pro-preview' && enableThinking) {
          config.thinkingConfig = {
            thinkingLevel: ThinkingLevel.HIGH
          };
          // DO NOT set maxOutputTokens
        }

        // Handle Google Maps Grounding
        if (useMapsGrounding) {
          config.tools = [{ googleMaps: {} }];
          
          // Pass location coordinates if available to retrievalConfig
          if (latitude !== undefined && longitude !== undefined) {
            config.toolConfig = {
              retrievalConfig: {
                latLng: {
                  latitude: parseFloat(latitude),
                  longitude: parseFloat(longitude)
                }
              }
            };
          }
        }

        const response = await ai.models.generateContent({
          model: model,
          contents: contents,
          config: config
        });

        reply = response.text || 'I am sorry, but I could not formulate a response at this time.';
        
        // Extract Google Maps Grounding chunks/links if present
        groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || null;
        groundingMetadata = response.candidates?.[0]?.groundingMetadata || null;

        res.json({ 
          text: reply, 
          groundingChunks: groundingChunks || null,
          groundingMetadata: groundingMetadata || null,
          modelUsed: model,
          roleUsed: role,
          thinkingEnabled: enableThinking && model === 'gemini-3.1-pro-preview'
        });

      } catch (geminiError: any) {
        console.log(`Gemini API call failed (${geminiError?.message || geminiError}), falling back to local simulation.`);
        fallbackToOffline = true;
      }
    }

    if (!ai || !isGeminiEnabled || fallbackToOffline) {
      // Robust offline fallback chatbot matching keywords
      const lower = lastMessage.toLowerCase();
      let reply = '';

      let fallbackHeader = '';
      if (fallbackToOffline) {
        fallbackHeader = `*🤖 (Offline Fallback • Unable to reach Gemini backend with your key, showing simulated responses)*\n\n`;
      } else {
        fallbackHeader = `*🤖 (Offline Demo Sandbox • Simulation using **${model}** as **${role}** role)*\n\n`;
      }

      if (lower.includes('predict') || lower.includes('hazard') || lower.includes('future')) {
        reply = fallbackHeader + `### 🔮 Aegis City Infrastructure Predictive Risks
Based on our machine learning correlation analysis of weather patterns, sensor telemetry, and active civic complaints, I have identified **${predictions.length} proactive risks**:

1. **${predictions[0].title}** in **${predictions[0].ward}**
   - *Risk Level:* **${predictions[0].riskLevel}** (${predictions[0].probability}% confidence)
   - *Action:* ${predictions[0].suggestedAction}
   
2. **${predictions[1].title}** in **${predictions[1].ward}**
   - *Risk Level:* **${predictions[1].riskLevel}** (${predictions[1].probability}% confidence)
   - *Action:* ${predictions[1].suggestedAction}

3. **${predictions[2].title}** in **${predictions[2].ward}**
   - *Risk Level:* **${predictions[2].riskLevel}** (${predictions[2].probability}% confidence)
   - *Action:* ${predictions[2].suggestedAction}

Proactive dispatch has been notified for preventative maintenance. Would you like me to generate an official routing request for these?`;
      } else if (lower.includes('complain') || lower.includes('summarize') || lower.includes('active') || lower.includes('issue')) {
        const criticalIssues = issues.filter(i => i.severity === 'Critical');
        reply = fallbackHeader + `### 📋 Aegis City Civic Complaints Summary
We currently have **${issues.length} active reported complaints**, of which **${criticalIssues.length} are flagged as CRITICAL severity**:

* **[CRITICAL] ${issues.find(i => i.id === 'iss-2')?.title || 'Water Rupture'}**
  - *Location:* Oakwood Avenue (Hospital District)
  - *AI Status:* Assigned & Verified. Estimated Resolution: 4 Hours.
* **[CRITICAL] ${issues.find(i => i.id === 'iss-3')?.title || 'Illegal Waste'}**
  - *Location:* Cedar Lane Greenbelt
  - *AI Status:* Analysis complete. Severity assigned Critical due to hazardous material index.
* **[HIGH] ${issues.find(i => i.id === 'iss-1')?.title || 'Pothole cluster'}**
  - *Location:* Broad Street (Primary School)
  - *AI Status:* Work scheduled for road patch crew.

Would you like more details on a specific issue, or do you want to file a new report?`;
      } else if (lower.includes('near me') || lower.includes('map') || lower.includes('ward')) {
        reply = fallbackHeader + `### 📍 Active Complaints Near Your Current Sector
Our location sensor places you near **Ward 2 (Hospital District)**. Here are the active issues nearby:
1. **Major Water Main Burst Flooding Sidewalk** (Critical Severity) - *Distance: 0.15 miles*
   - Currently gushing clean water. Repair order #WA-42 is issued.
2. **Potholes on Elm Expressway Merging Ramp** (Medium Severity) - *Distance: 0.8 miles*

I suggest avoiding Oakwood Avenue near the General Hospital annex as street flooding might cause transit delays. Let me know if you would like me to notify you when the Water Authority completes repairs!`;
      } else if (lower.includes('report') || lower.includes('weekly') || lower.includes('health')) {
        reply = fallbackHeader + `### 📊 Weekly Civic Intelligence Report: Aegis City
**Reporting Period: June 19 - June 26, 2026**

#### 1. Community Health Indexes
- **Overall Civic Health Index:** **${kpiStats.communityHealthScore}/100** (Steady Progress)
- **Infrastructure Safety Ratings:**
  - 🚦 Roads & Transit: **${kpiStats.infrastructureScores.roads}%**
  - 💧 Clean Water Network: **${kpiStats.infrastructureScores.water}%**
  - 🗑️ Sanitation & Waste Management: **${kpiStats.infrastructureScores.waste}%**
  - 💡 Streetlights & Grid: **${kpiStats.infrastructureScores.lighting}%**

#### 2. Resolution Efficiency
- **Total Complaints Resolved:** **117** complaints.
- **Average Turnaround Time:** **${kpiStats.avgResolutionTime}** (15% faster than last week).
- **Public Satisfaction Rating:** **${kpiStats.communitySatisfaction}%**

*CivicGPT Note: Water rupture on Oakwood Ave represents our highest escalation point today. Resolving this will secure our target 90% water safety health score by evening.*`;
      } else {
        reply = fallbackHeader + `Greetings! I am **CivicGPT**, configured to run offline simulated response matching your inputs.

Selected Role: **${role}**
Model Option: **${model}**
Thinking Mode: **${enableThinking ? 'ENABLED' : 'DISABLED'}**
Maps Grounding: **${useMapsGrounding ? 'ENABLED' : 'DISABLED'}**

I can help you analyze and manage issues across Aegis City. Here are some of the actions we can perform:
* **"Summarize today's complaints"** – Get a complete breakdown of current high-priority civic hazards.
* **"Predict infrastructure failures"** – View forecasted risk hotspots generated by our Prediction Agent.
* **"Show issues near me"** – Scan local reports around Ward 2 / Ward 4.
* **"Generate weekly civic report"** – Compile a detailed performance, health, and satisfaction audit.

How can I assist you with community intelligence today?`;
      }

      res.json({ 
        text: reply,
        groundingChunks: useMapsGrounding ? [
          {
            maps: {
              uri: "https://maps.google.com/?q=Aegis+City+Center",
              title: "Aegis City Hall, Ward 2"
            }
          }
        ] : null,
        modelUsed: model,
        roleUsed: role,
        thinkingEnabled: enableThinking
      });
    }
  } catch (err) {
    console.error('Error in CivicGPT:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 8. Refresh Predictions (AI Predictive Analytics)
app.post('/api/predictions/refresh', async (req, res) => {
  try {
    let fallbackToOffline = false;
    if (ai && isGeminiEnabled) {
      try {
        console.log('Using Gemini AI to refresh predictive community risks...');
        const activeIssuesText = issues.map(i => `${i.title} (Category: ${i.category}, Ward: ${i.locationName}, Severity: ${i.severity})`).join('\n');
        
        const prompt = `Based on the currently active complaints in Aegis City:\n${activeIssuesText}\n\nPredict 4 potential future infrastructure hazards or bottlenecks (e.g. future water leaks, pothole corridors, power grid overloading, sanitation garbage pileups). Provide:
1. Title
2. Category (must be one of: Roads, Water, Waste, Lighting, Safety)
3. Ward affected (e.g. "Ward 1", "Ward 4", "Ward 5")
4. Risk Level (Low, Medium, High, Critical)
5. Probability of occurrence (0-100)
6. Impact Score (0-100)
7. Suggested Preventative Action
8. Timeframe (e.g. "Next 7 Days", "Next 14 Days")
9. Confidence rating of this AI prediction (0-100)`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  category: { type: Type.STRING },
                  ward: { type: Type.STRING },
                  riskLevel: { type: Type.STRING },
                  probability: { type: Type.INTEGER },
                  impactScore: { type: Type.INTEGER },
                  suggestedAction: { type: Type.STRING },
                  timeframe: { type: Type.STRING },
                  confidence: { type: Type.INTEGER }
                },
                required: ['title', 'category', 'ward', 'riskLevel', 'probability', 'impactScore', 'suggestedAction', 'timeframe', 'confidence']
              }
            }
          }
        });

        const list = JSON.parse(response.text || '[]');
        if (Array.isArray(list) && list.length > 0) {
          predictions = list.map((item, idx) => ({
            id: `pred-${Date.now()}-${idx}`,
            title: item.title,
            category: item.category as IssueCategory || 'Roads',
            ward: item.ward,
            riskLevel: item.riskLevel as SeverityLevel || 'Medium',
            probability: item.probability || 70,
            impactScore: item.impactScore || 50,
            suggestedAction: item.suggestedAction,
            timeframe: item.timeframe,
            confidence: item.confidence || 80
          }));
        }
      } catch (geminiError: any) {
        console.log(`Gemini prediction refresh failed (${geminiError?.message || geminiError}), falling back to offline simulation.`);
        fallbackToOffline = true;
      }
    }

    if (!ai || !isGeminiEnabled || fallbackToOffline) {
      // Offline Simulation Update
      predictions = predictions.map(p => ({
        ...p,
        probability: Math.min(100, Math.max(10, p.probability + Math.floor(Math.random() * 15) - 7)),
        confidence: Math.min(100, Math.max(50, p.confidence + Math.floor(Math.random() * 10) - 5))
      }));
    }

    res.json(predictions);
  } catch (err) {
    console.warn('Error refreshing predictions:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 9. Get predictions
app.get('/api/predictions', (req, res) => {
  res.json(predictions);
});

// 10. Get live KPI stats
app.get('/api/stats', (req, res) => {
  res.json(kpiStats);
});

app.get('/api/kpis', (req, res) => {
  res.json(kpiStats);
});

// 11. Get citizens/leaderboard
app.get('/api/citizens', (req, res) => {
  res.json(citizens);
});

// 12. Get community news with Google Search Grounding
app.get('/api/community-news', async (req, res) => {
  try {
    const location = (req.query.location as string) || 'San Francisco';
    
    if (ai && isGeminiEnabled) {
      console.log(`Running Google Search Grounded News Agent for location: ${location}`);
      
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `Search and summarize the 5 most recent real-world local infrastructure news, public works updates, road closures, city development alerts, or civic maintenance reports for the area: "${location}". Ensure the updates are from recent times. Format the results strictly as a JSON array of objects. Each object must have:
- title: string (concise, professional title of the update)
- summary: string (2-3 sentences explaining what is happening, where, and the impact)
- category: string (one of: 'Roads', 'Water', 'Waste', 'Lighting', 'Safety', 'Development')
- date: string (approximate date/time string, e.g. "June 24, 2026")
- sourceName: string (source publication or government agency, e.g. "SF Chronicle", "City Dept of Public Works")
- url: string (a real valid URL link from search grounding)
Ensure the JSON output is valid, clean, and has no additional markdown blocks around it other than the JSON itself.`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                summary: { type: Type.STRING },
                category: { type: Type.STRING },
                date: { type: Type.STRING },
                sourceName: { type: Type.STRING },
                url: { type: Type.STRING }
              },
              required: ['title', 'summary', 'category', 'date', 'sourceName']
            }
          }
        }
      });
      
      const text = response.text || '[]';
      const articles = JSON.parse(text.trim());
      
      // Also extract search grounding chunks for references/URLs!
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const searchMetadata = response.candidates?.[0]?.groundingMetadata || null;
      
      res.json({ articles, chunks, searchMetadata });
    } else {
      // Graceful offline fallback
      const fallbackNews = getFallbackNewsForLocation(location);
      res.json({ articles: fallbackNews, chunks: [], searchMetadata: null, isOffline: true });
    }
  } catch (error: any) {
    console.log('[Info] Google Search Grounding for community news is currently rate-limited or unavailable; serving cached localized updates.');
    // Return graceful fallback data so the app doesn't crash
    const location = (req.query.location as string) || 'Aegis City';
    const fallbackNews = getFallbackNewsForLocation(location);
    res.json({ articles: fallbackNews, chunks: [], searchMetadata: null, isOffline: true, error: true });
  }
});

// 13. Generate full story content for news articles (Grounded Content Reader)
app.get('/api/community-news/generate', async (req, res) => {
  try {
    const title = req.query.title as string;
    const summary = req.query.summary as string;
    const category = req.query.category as string || 'Roads';
    const date = req.query.date as string || 'Recent';
    const sourceName = req.query.sourceName as string || 'Community Watch';
    const location = req.query.location as string || 'Aegis City';

    if (!title) {
      return res.status(400).json({ error: 'Missing title' });
    }

    if (ai && isGeminiEnabled) {
      console.log(`Running real Gemini News Grounding Agent to draft full story: "${title}"`);
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `Draft a comprehensive, professional, highly informative local news article of about 250-300 words based on this community update:
Title: "${title}"
Summary: "${summary}"
Category: "${category}"
Date: "${date}"
Source: "${sourceName}"
Location Context: "${location}"

The article must be highly realistic and contain:
1. A catchy professional subheading.
2. Three paragraphs:
   - Paragraph 1: Introduction of the news event, the location, and immediate situation.
   - Paragraph 2: Technical or civic details, engineering or municipal status, and a quote/statement from an official source (e.g. city engineer or ward officer).
   - Paragraph 3: Public impact, safety instructions, upcoming public schedules, or preventative advice for citizens.
3. 3-4 bullet points of "Key Takeaways" or "Next Steps" for residents.
4. An "AI Civic Impact Rating" (a number between 0 and 100) with a 1-sentence justification.

Format the results strictly as a JSON object containing these exact fields:
{
  "subheading": "string",
  "paragraphs": ["string", "string", "string"],
  "keyTakeaways": ["string", "string", "string", "string"],
  "impactRating": number,
  "impactJustification": "string"
}
Ensure the JSON output is valid, clean, and contains no additional markdown blocks around it other than the JSON itself.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subheading: { type: Type.STRING },
              paragraphs: { type: Type.ARRAY, items: { type: Type.STRING } },
              keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING } },
              impactRating: { type: Type.INTEGER },
              impactJustification: { type: Type.STRING }
            },
            required: ['subheading', 'paragraphs', 'keyTakeaways', 'impactRating', 'impactJustification']
          }
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json(parsed);
    } else {
      res.json(getFallbackStoryDetails(title, summary, category));
    }
  } catch (error: any) {
    console.log(`Error generating story details (${error?.message || error}).`);
    res.json(getFallbackStoryDetails(req.query.title as string || 'Community Update', req.query.summary as string || 'Details about local infrastructure.', req.query.category as string || 'Roads'));
  }
});

function getFallbackStoryDetails(title: string, summary: string, category: string): any {
  return {
    subheading: 'Local Authorities Launch Coordinated Initiative and Safe-Zone Diagnostics',
    paragraphs: [
      `A new civic operation is underway regarding "${title}". Local community officers and specialized technicians are coordinating at key zones in the region to address initial bottlenecks. Immediate diagnostic reports indicate stable progress with minimal public obstruction.`,
      `Engineers from the regional Ward development office have initiated preventative check-ups. A official spokesperson commented: "We are fast-tracking safety protocols and modernizing local assets to ensure standard operating conditions are fully maintained. Community collaboration is key to our success."`,
      `Residents in neighboring sectors are advised to stay tuned to municipal advisories. Standard utility services are expected to run without interruptions, though caution is advised near ongoing repair zones. Complete transparency will be maintained throughout the cycle.`
    ],
    keyTakeaways: [
      'Follow safety signage near utility repair lanes.',
      'Report any secondary ripples or issues via the Aegis Hero app.',
      'Check local transit schedules for minor adjustments.',
      'Contact district coordinators for emergency assistance.'
    ],
    impactRating: 75,
    impactJustification: 'Represents a medium-impact local event requiring standard administrative caution and civic awareness.'
  };
}

function getFallbackNewsForLocation(location: string): any[] {
  return [
    {
      title: `${location} Municipal Smart Grid Integration Phase 2 Begins`,
      summary: 'City engineers launched phase 2 of the intelligent power grid rollout, replacing legacy substation gear with smart automatic-failover nodes to prevent district-wide blackouts.',
      category: 'Lighting',
      date: 'June 26, 2026',
      sourceName: 'Municipal Tech Daily',
      url: 'https://example.com/municipal/smart-grid'
    },
    {
      title: `Critical Water Pipeline Maintenance Scheduled for ${location} Central Corridor`,
      summary: 'The District Water Board has announced temporary overnight shutdowns and pressure reductions starting Tuesday to repair high-pressure supply supply trunk valves.',
      category: 'Water',
      date: 'June 24, 2026',
      sourceName: 'Water Resource Council',
      url: 'https://example.com/water/pipeline-maint'
    },
    {
      title: `Emergency Roadway Hazard Cleared Successfully`,
      summary: 'Transit crews removed fallen road debris and patched several minor fissures near the bypass entry, fully restoring standard four-lane speed limits.',
      category: 'Roads',
      date: 'June 22, 2026',
      sourceName: 'Local Transport Board',
      url: 'https://example.com/traffic/hazard-cleared'
    },
    {
      title: `Civic Cleanliness Drive Launched Across Under-Served Wards`,
      summary: 'A public-private sanitization initiative commenced this morning, placing 150 extra high-capacity waste sorting bins and scheduling daily smart collections.',
      category: 'Waste',
      date: 'June 20, 2026',
      sourceName: 'Environmental Safety Union',
      url: 'https://example.com/waste/cleanliness-drive'
    }
  ];
}

// Serve Frontend (Vite Integration)
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Dev Server: Mounted Vite Middlewares.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Production Server: Serving static assets from /dist.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Community Hero AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
