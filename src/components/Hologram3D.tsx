/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { 
  Cpu, RotateCcw, Camera, X, Sliders, Play, Pause, 
  RefreshCw, Compass, Check, Layers, Image, Info, 
  AlertTriangle, Eye, ShieldCheck, Award, Sparkles, HelpCircle,
  Maximize2, Minimize2, EyeOff
} from 'lucide-react';

interface Hologram3DProps {
  onEarnPoints?: (pts: number) => void;
}

const SIMULATION_BACKGROUNDS = [
  {
    id: 'road',
    name: 'Asphalt Roadway',
    url: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=1200&q=80',
    description: 'Perfect for Potholes & Pipes'
  },
  {
    id: 'concrete',
    name: 'Concrete Sidewalk',
    url: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1200&q=80',
    description: 'Perfect for Waste piles & debris'
  },
  {
    id: 'grid',
    name: 'Municipal Power Grid',
    url: 'https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?auto=format&fit=crop&w=1200&q=80',
    description: 'Perfect for Streetlights & Substation cores'
  }
];

export default function Hologram3D({ onEarnPoints }: Hologram3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const arCanvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isHovered, setIsHovered] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [rot, setRot] = useState({ x: 0.5, y: 0.6, z: 0 });
  const [modelType, setModelType] = useState<'core' | 'shield' | 'pothole' | 'pipe' | 'streetlight' | 'trash'>('core');

  // Immersive AR state
  const [arMode, setArMode] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSimulatingCamera, setIsSimulatingCamera] = useState(false);
  const [simulatedBg, setSimulatedBg] = useState('road');

  // AR calibration controls
  const [arScale, setArScale] = useState(1.0);
  const [arDepth, setArDepth] = useState(3.0);
  const [arHeight, setArHeight] = useState(0);
  const [arXOffset, setArXOffset] = useState(0);

  // Diagnostic scanner action states
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureSuccess, setCaptureSuccess] = useState(false);
  const [scanValue, setScanValue] = useState<string | null>(null);

  // Occlusion & Instructions state
  const [occlusionMode, setOcclusionMode] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [captureStep, setCaptureStep] = useState<string>('IDLE');
  const [nodesScanned, setNodesScanned] = useState(0);
  const [fullScreenAr, setFullScreenAr] = useState(false);
  const [sidebarHidden, setSidebarHidden] = useState(false);

  // Animation frame and interaction state kept in refs for smooth rendering loop
  const rotRef = useRef(rot);
  const autoRotateRef = useRef(true);
  const occlusionAlphaRef = useRef(0); // Smooth transition of occlusion mode
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    rotRef.current = rot;
  }, [rot]);

  // Activate / deactivate camera stream when arMode toggles
  useEffect(() => {
    const startCamera = async () => {
      setCameraError(null);
      setIsSimulatingCamera(false);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } }
        });
        setCameraStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        console.warn("Camera access failed, falling back to simulation.", err);
        setCameraError("Physical camera access unavailable or restricted. Simulated AR viewport active.");
        setIsSimulatingCamera(true);
      }
    };

    const stopCamera = () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsSimulatingCamera(false);
    };

    if (arMode) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [arMode]);

  // Combined 3D model calculations and projection rendering
  useEffect(() => {
    // We render either to the standard mini canvas or the AR canvas
    const activeCanvas = arMode ? arCanvasRef.current : canvasRef.current;
    if (!activeCanvas) return;

    const ctx = activeCanvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let localTime = 0;

    // --- 3D NODE GENERATION SCHEMAS ---

    // 1. Core Points
    const corePoints: any[] = [];
    const coreEdges: [number, number][] = [];
    const ringSegments = 16;
    for (let r = 0; r < 2; r++) {
      const radius = r === 0 ? 1.0 : 0.6;
      const startIndex = corePoints.length;
      for (let i = 0; i < ringSegments; i++) {
        const theta = (i / ringSegments) * Math.PI * 2;
        corePoints.push({
          x: Math.cos(theta) * radius,
          y: r === 0 ? 0 : Math.sin(localTime * 0.02) * 0.1,
          z: Math.sin(theta) * radius,
          r: r === 0 ? 99 : 56,
          g: r === 0 ? 102 : 189,
          b: r === 0 ? 241 : 248
        });
        const next = startIndex + ((i + 1) % ringSegments);
        coreEdges.push([startIndex + i, next]);
      }
    }
    const vStartIndex = corePoints.length;
    for (let i = 0; i < ringSegments; i++) {
      const theta = (i / ringSegments) * Math.PI * 2;
      corePoints.push({
        x: Math.cos(theta) * 0.8,
        y: Math.sin(theta) * 0.8,
        z: 0,
        r: 168, g: 85, b: 247
      });
      const next = vStartIndex + ((i + 1) % ringSegments);
      coreEdges.push([vStartIndex + i, next]);
    }

    // 2. Shield Points
    const shieldPoints = [
      { x: 0, y: -1.0, z: 0, r: 244, g: 63, b: 94 },
      { x: 0.7, y: -0.6, z: 0.3, r: 99, g: 102, b: 241 },
      { x: -0.7, y: -0.6, z: 0.3, r: 99, g: 102, b: 241 },
      { x: 0.8, y: 0.1, z: 0.4, r: 99, g: 102, b: 241 },
      { x: -0.8, y: 0.1, z: 0.4, r: 99, g: 102, b: 241 },
      { x: 0, y: 1.1, z: 0, r: 244, g: 63, b: 94 },
      { x: 0.6, y: -0.6, z: -0.5, r: 59, g: 130, b: 246 },
      { x: -0.6, y: -0.6, z: -0.5, r: 59, g: 130, b: 246 },
      { x: 0.6, y: 0.1, z: -0.5, r: 59, g: 130, b: 246 },
      { x: -0.6, y: 0.1, z: -0.5, r: 59, g: 130, b: 246 }
    ];
    const shieldEdges: [number, number][] = [
      [0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 5],
      [0, 6], [0, 7], [6, 8], [7, 9], [8, 5], [9, 5],
      [1, 6], [2, 7], [3, 8], [4, 9]
    ];

    // 3. Pothole Points (Amber/Rose warning colored road depression)
    const potholePoints: any[] = [];
    const potholeEdges: [number, number][] = [];
    const potholeSegments = 12;
    // Outer circular boundary
    for (let i = 0; i < potholeSegments; i++) {
      const theta = (i / potholeSegments) * Math.PI * 2;
      potholePoints.push({
        x: Math.cos(theta) * 0.9,
        y: 0.1,
        z: Math.sin(theta) * 0.9,
        r: 251, g: 146, b: 60 // Amber
      });
      potholeEdges.push([i, (i + 1) % potholeSegments]);
    }
    // Inner sunken rim
    for (let i = 0; i < potholeSegments; i++) {
      const theta = (i / potholeSegments) * Math.PI * 2;
      potholePoints.push({
        x: Math.cos(theta) * 0.5,
        y: 0.5, // depressed down
        z: Math.sin(theta) * 0.5,
        r: 244, g: 63, b: 94 // Rose
      });
      const innerIdx = potholeSegments + i;
      potholeEdges.push([innerIdx, potholeSegments + ((i + 1) % potholeSegments)]);
      potholeEdges.push([i, innerIdx]); // radial brace lines
    }
    // Central deepest core
    potholePoints.push({
      x: 0, y: 0.7, z: 0,
      r: 225, g: 29, b: 72 // Deep warning red
    });
    const centerIdx = potholePoints.length - 1;
    for (let i = 0; i < potholeSegments; i++) {
      potholeEdges.push([potholeSegments + i, centerIdx]);
    }

    // 4. Pipe Points (Neon blue/cyan broken utility line)
    const pipePoints: any[] = [];
    const pipeEdges: [number, number][] = [];
    const pipeSegments = 8;
    const pipeRings = [-0.8, -0.2, 0.2, 0.8];
    pipeRings.forEach((x, rIdx) => {
      const ringStart = pipePoints.length;
      for (let i = 0; i < pipeSegments; i++) {
        const theta = (i / pipeSegments) * Math.PI * 2;
        const jag = (rIdx === 1 || rIdx === 2) ? (Math.sin(i * 3 + localTime * 0.1) * 0.04) : 0;
        pipePoints.push({
          x: x + jag,
          y: Math.cos(theta) * 0.35,
          z: Math.sin(theta) * 0.35,
          r: (rIdx === 1 || rIdx === 2) ? 34 : 59,
          g: (rIdx === 1 || rIdx === 2) ? 211 : 130,
          b: (rIdx === 1 || rIdx === 2) ? 238 : 246
        });
        pipeEdges.push([ringStart + i, ringStart + ((i + 1) % pipeSegments)]);
      }
    });
    for (let i = 0; i < pipeSegments; i++) {
      pipeEdges.push([i, pipeSegments + i]);
      pipeEdges.push([2 * pipeSegments + i, 3 * pipeSegments + i]);
      if (i % 3 === 0) {
        pipeEdges.push([pipeSegments + i, 2 * pipeSegments + i]); // cracked link
      }
    }

    // 5. Streetlight Points
    const streetlightPoints = [
      { x: -0.25, y: 1.0, z: -0.25, r: 100, g: 116, b: 139 },
      { x: 0.25, y: 1.0, z: -0.25, r: 100, g: 116, b: 139 },
      { x: 0.25, y: 1.0, z: 0.25, r: 100, g: 116, b: 139 },
      { x: -0.25, y: 1.0, z: 0.25, r: 100, g: 116, b: 139 },
      { x: 0, y: 0.4, z: 0, r: 148, g: 163, b: 184 },
      { x: 0, y: -0.2, z: 0, r: 148, g: 163, b: 184 },
      { x: 0, y: -0.7, z: 0, r: 148, g: 163, b: 184 },
      { x: 0, y: -1.1, z: 0, r: 203, g: 213, b: 225 },
      { x: 0.3, y: -1.15, z: 0.1, r: 203, g: 213, b: 225 },
      { x: 0.5, y: -1.1, z: 0.2, r: 253, g: 224, b: 71 }, // Yellow lamp
      { x: 0.6, y: -1.0, z: 0.2, r: 254, g: 240, b: 138 },
      { x: 0.4, y: -1.0, z: 0.3, r: 253, g: 224, b: 71 }
    ];
    const streetlightEdges: [number, number][] = [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [0, 4], [1, 4], [2, 4], [3, 4],
      [4, 5], [5, 6], [6, 7],
      [7, 8], [8, 9], [9, 10], [9, 11], [10, 11]
    ];

    // 6. Trash Mound Points
    const trashPoints = [
      { x: -0.7, y: 0.9, z: -0.7, r: 120, g: 110, b: 90 },
      { x: 0.7, y: 0.9, z: -0.7, r: 120, g: 110, b: 90 },
      { x: 0.7, y: 0.9, z: 0.7, r: 120, g: 110, b: 90 },
      { x: -0.7, y: 0.9, z: 0.7, r: 120, g: 110, b: 90 },
      { x: -0.4, y: 0.4, z: -0.3, r: 249, g: 115, b: 22 },
      { x: 0.3, y: 0.3, z: -0.4, r: 34, g: 197, b: 94 },
      { x: 0.4, y: 0.5, z: 0.4, r: 249, g: 115, b: 22 },
      { x: -0.3, y: 0.4, z: 0.4, r: 34, g: 197, b: 94 },
      { x: -0.1, y: 0.0, z: -0.1, r: 239, g: 68, b: 68 },
      { x: 0.15, y: 0.1, z: 0.15, r: 249, g: 115, b: 22 }
    ];
    const trashEdges: [number, number][] = [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [0, 4], [1, 4], [2, 5], [3, 7],
      [4, 5], [5, 6], [6, 7], [7, 4],
      [4, 8], [5, 8], [6, 9], [7, 9], [8, 9]
    ];

    // Floating particles
    const particles: { x: number; y: number; z: number; size: number; speed: number; angle: number }[] = [];
    for (let i = 0; i < 20; i++) {
      particles.push({
        x: (Math.random() - 0.5) * 2.5,
        y: (Math.random() - 0.5) * 2.5,
        z: (Math.random() - 0.5) * 2.5,
        size: Math.random() * 2 + 1,
        speed: Math.random() * 0.01 + 0.005,
        angle: Math.random() * Math.PI * 2
      });
    }

    const renderLoop = () => {
      localTime++;

      // Smoothly interpolate the occlusion progress (10% per frame)
      const targetAlpha = occlusionMode ? 1.0 : 0.0;
      occlusionAlphaRef.current += (targetAlpha - occlusionAlphaRef.current) * 0.10;
      const occProgress = occlusionAlphaRef.current;

      // Pick points & edges dynamically
      let currentPoints = corePoints;
      let currentEdges = coreEdges;

      if (modelType === 'shield') {
        currentPoints = shieldPoints;
        currentEdges = shieldEdges;
      } else if (modelType === 'pothole') {
        currentPoints = potholePoints;
        currentEdges = potholeEdges;
      } else if (modelType === 'pipe') {
        currentPoints = pipePoints;
        currentEdges = pipeEdges;
      } else if (modelType === 'streetlight') {
        currentPoints = streetlightPoints;
        currentEdges = streetlightEdges;
      } else if (modelType === 'trash') {
        currentPoints = trashPoints;
        currentEdges = trashEdges;
      }

      // Auto rotation logic
      if (autoRotateRef.current) {
        rotRef.current.y += 0.006;
        rotRef.current.x = 0.4 + Math.sin(localTime * 0.005) * 0.15;
      }

      // Clear Canvas
      ctx.clearRect(0, 0, activeCanvas.width, activeCanvas.height);

      const cx = (activeCanvas.width / 2) + (arMode ? arXOffset : 0);
      const cy = (activeCanvas.height / 2) + (arMode ? arHeight : 0);
      
      // AR size factor is larger by default
      const baseScale = arMode ? 90 : 45;
      const rScale = baseScale * (arMode ? arScale : 1.0);
      const distance = arMode ? arDepth : 3.0;

      // 3D Projection Matrices
      const cosX = Math.cos(rotRef.current.x);
      const sinX = Math.sin(rotRef.current.x);
      const cosY = Math.cos(rotRef.current.y);
      const sinY = Math.sin(rotRef.current.y);
      const cosZ = Math.cos(rotRef.current.z);
      const sinZ = Math.sin(rotRef.current.z);

      const project = (p: { x: number; y: number; z: number }) => {
        // Rotate Y
        let x1 = p.x * cosY - p.z * sinY;
        let z1 = p.x * sinY + p.z * cosY;

        // Rotate X
        let y1 = p.y * cosX - z1 * sinX;
        let z2 = p.y * sinX + z1 * cosX;

        // Rotate Z
        let x2 = x1 * cosZ - y1 * sinZ;
        let y2 = x1 * sinZ + y1 * cosZ;

        // Perspective Formula
        const fov = 150;
        const scale = fov / (distance + z2);
        const screenX = cx + x2 * rScale * (scale / fov * 3);
        const screenY = cy + y2 * rScale * (scale / fov * 3);

        return { x: screenX, y: screenY, depth: z2 };
      };

      // Scanline animation overlay
      ctx.strokeStyle = arMode ? 'rgba(34, 211, 238, 0.08)' : 'rgba(99, 102, 241, 0.04)';
      ctx.lineWidth = 1;
      const scanY = (localTime * 1.8) % activeCanvas.height;
      ctx.beginPath();
      ctx.moveTo(0, scanY);
      ctx.lineTo(activeCanvas.width, scanY);
      ctx.stroke();

      // Project vertices
      const projected = currentPoints.map(p => {
        const warp = (modelType === 'core' || modelType === 'pipe') ? Math.sin(localTime * 0.04 + p.x * 2.5) * 0.03 : 0;
        return project({ x: p.x, y: p.y + warp, z: p.z });
      });

      // Draw Edges
      currentEdges.forEach(([i, j]) => {
        const pi = projected[i];
        const pj = projected[j];
        if (!pi || !pj) return;

        const depthAvg = (pi.depth + pj.depth) / 2;
        const isEdgeOccluded = depthAvg > 0.05;
        
        const baseOpacity = Math.max(0.15, Math.min(0.95, (1.2 - depthAvg) / 1.3));
        const occludedOpacity = 0.12;
        
        // Smoothly blend opacity based on the animated occlusion progress
        const opacity = isEdgeOccluded 
          ? (baseOpacity + (occludedOpacity - baseOpacity) * occProgress) 
          : baseOpacity;
        
        ctx.beginPath();
        ctx.moveTo(pi.x, pi.y);
        ctx.lineTo(pj.x, pj.y);

        const gradient = ctx.createLinearGradient(pi.x, pi.y, pj.x, pj.y);
        const col1 = currentPoints[i];
        const col2 = currentPoints[j];
        
        if (isEdgeOccluded && occProgress > 0.5) {
          gradient.addColorStop(0, `rgba(${col1.r}, ${col1.g}, ${col1.b}, ${opacity})`);
          gradient.addColorStop(1, `rgba(${col2.r}, ${col2.g}, ${col2.b}, ${opacity})`);
          ctx.strokeStyle = gradient;
          ctx.setLineDash([2, 3]);
        } else {
          gradient.addColorStop(0, `rgba(${col1.r}, ${col1.g}, ${col1.b}, ${opacity})`);
          gradient.addColorStop(1, `rgba(${col2.r}, ${col2.g}, ${col2.b}, ${opacity})`);
          ctx.strokeStyle = gradient;
          ctx.setLineDash([]);
        }

        ctx.lineWidth = (arMode ? 2.0 : 1.0) * (isHovered ? 1.5 : 1.0);
        ctx.stroke();
      });
      ctx.setLineDash([]); // Reset line dash

      // Draw Vertices (Nodes)
      projected.forEach((p, idx) => {
        const rawPt = currentPoints[idx];
        const isNodeOccluded = p.depth > 0.05;
        
        const baseNodeOpacity = Math.max(0.25, Math.min(1.0, (1.2 - p.depth) / 1.3));
        const occludedNodeOpacity = 0.15;
        
        // Smoothly blend node opacity based on occlusion progress
        const opacity = isNodeOccluded
          ? (baseNodeOpacity + (occludedNodeOpacity - baseNodeOpacity) * occProgress)
          : baseNodeOpacity;
          
        const baseSize = arMode ? 4.5 : 3;
        const nodeSize = baseSize * (1.2 - p.depth * 0.3) * (isHovered ? 1.3 : 1.0);

        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, nodeSize), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rawPt.r}, ${rawPt.g}, ${rawPt.b}, ${opacity})`;
        ctx.fill();

        // High-tech glowing node effects
        const isFullyOccluded = isNodeOccluded && occProgress > 0.8;
        if (!isFullyOccluded && (isHovered || Math.sin(localTime * 0.06 + idx) > 0.8)) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, nodeSize * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${rawPt.r}, ${rawPt.g}, ${rawPt.b}, ${opacity * 0.3})`;
          ctx.fill();
        }
      });

      // Render a subtle horizontal plane dividing the occluded and unoccluded space in AR Mode
      if (arMode && occProgress > 0.01) {
        ctx.strokeStyle = `rgba(239, 68, 68, ${0.25 * occProgress})`; // Red warning occlusion mesh
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 5]);
        
        ctx.beginPath();
        ctx.moveTo(cx - 160 * arScale, cy + arHeight);
        ctx.lineTo(cx + 160 * arScale, cy + arHeight);
        ctx.stroke();

        ctx.fillStyle = `rgba(239, 68, 68, ${0.03 * occProgress})`;
        ctx.beginPath();
        ctx.ellipse(cx, cy + arHeight, 160 * arScale, 45 * arScale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.setLineDash([]);
      }

      // Floating telemetry particles
      particles.forEach(pt => {
        pt.angle += pt.speed;
        const radius = Math.sqrt(pt.x * pt.x + pt.z * pt.z);
        pt.x = Math.cos(pt.angle) * radius;
        pt.z = Math.sin(pt.angle) * radius;

        const proj = project(pt);
        const op = Math.max(0.05, Math.min(0.65, (1.0 - proj.depth) / 1.5));
        
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, pt.size * (1.2 - proj.depth * 0.2), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(34, 211, 238, ${op})`;
        ctx.fill();
      });

      // Base radar ellipse rings
      ctx.strokeStyle = arMode ? 'rgba(34, 211, 238, 0.15)' : 'rgba(99, 102, 241, 0.08)';
      ctx.lineWidth = 1;
      const ringYOffset = arMode ? arScale * 90 : 45;
      
      ctx.beginPath();
      ctx.ellipse(cx, cy + ringYOffset, 55 * (arMode ? arScale : 1), 14 * (arMode ? arScale : 1), 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(cx, cy + ringYOffset, 75 * (arMode ? arScale : 1), 20 * (arMode ? arScale : 1), 0, 0, Math.PI * 2);
      ctx.stroke();

      animationId = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [modelType, isHovered, arMode, arScale, arDepth, arHeight, arXOffset, occlusionMode]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    autoRotateRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const currentDragStart = dragStartRef.current;
    if (!currentDragStart) return;
    const dx = e.clientX - currentDragStart.x;
    const dy = e.clientY - currentDragStart.y;

    const newRot = {
      x: rotRef.current.x + dy * 0.015,
      y: rotRef.current.y + dx * 0.015,
      z: rotRef.current.z
    };
    
    rotRef.current = newRot;
    setRot(newRot);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUpOrLeave = () => {
    dragStartRef.current = null;
    setDragStart(null);
    setTimeout(() => {
      if (!dragStartRef.current) {
        autoRotateRef.current = true;
      }
    }, 2000);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      autoRotateRef.current = false;
      const touch = e.touches[0];
      dragStartRef.current = { x: touch.clientX, y: touch.clientY };
      setDragStart({ x: touch.clientX, y: touch.clientY });
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const currentDragStart = dragStartRef.current;
    if (!currentDragStart || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const dx = touch.clientX - currentDragStart.x;
    const dy = touch.clientY - currentDragStart.y;

    const newRot = {
      x: rotRef.current.x + dy * 0.015,
      y: rotRef.current.y + dx * 0.015,
      z: rotRef.current.z
    };
    
    rotRef.current = newRot;
    setRot(newRot);
    dragStartRef.current = { x: touch.clientX, y: touch.clientY };
    setDragStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = () => {
    dragStartRef.current = null;
    setDragStart(null);
    setTimeout(() => {
      if (!dragStartRef.current) {
        autoRotateRef.current = true;
      }
    }, 2000);
  };

  // Automatic alignment / Snap to Floor
  const snapToFloor = () => {
    setArScale(1.35);
    setArDepth(2.5);
    setArHeight(90);
    setArXOffset(0);
    setRot({ x: 0.35, y: 0.6, z: 0 });
  };

  // Perform diagnostic AR capture scan
  const triggerDiagnosticCapture = () => {
    if (isCapturing || captureSuccess) return;
    setIsCapturing(true);
    setScanValue(null);
    setNodesScanned(0);
    setCaptureStep('STARTING_SCANNER');

    // Dynamic scanning code generation
    const nodeCode = `SCAN-${Math.floor(100000 + Math.random() * 900000)}`;

    setTimeout(() => {
      setCaptureStep('MEASURING_SURFACE_LEVEL');
      setNodesScanned(4);
    }, 500);

    setTimeout(() => {
      setCaptureStep('CREATING_3D_OUTLINE');
      setNodesScanned(9);
    }, 1100);

    setTimeout(() => {
      setCaptureStep('DETERMINING_SURFACE_BOUNDS');
      setNodesScanned(14);
    }, 1700);

    setTimeout(() => {
      setCaptureStep('SAVING_COMPLIANCE_RECORD');
      setNodesScanned(16);
    }, 2300);

    setTimeout(() => {
      setIsCapturing(false);
      setCaptureSuccess(true);
      setScanValue(nodeCode);
      setCaptureStep('IDLE');

      // Reward points!
      if (onEarnPoints) {
        onEarnPoints(50);
      }

      // Automatically reset capture banner after 5 seconds
      setTimeout(() => {
        setCaptureSuccess(false);
        setScanValue(null);
      }, 5000);
    }, 2800);
  };

  const activeBgObj = SIMULATION_BACKGROUNDS.find(bg => bg.id === simulatedBg);

  return (
    <>
      {/* CSS Animation Injector */}
      <style>{`
        @keyframes sweep {
          0% { transform: translateY(-100%); }
          50% { transform: translateY(100%); }
          100% { transform: translateY(-100%); }
        }
        @keyframes scanFlash {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.4; }
        }
        .animate-sweep {
          animation: sweep 3.5s ease-in-out infinite;
        }
        .animate-scan-flash {
          animation: scanFlash 1.5s ease-in-out infinite;
        }
      `}</style>

      {/* Primary Widget Core */}
      <div 
        id="3d-hologram-widget"
        className="p-4 bg-slate-900/40 border border-white/5 rounded-2xl space-y-3 transition-all hover:bg-slate-900/70 hover:border-indigo-500/10 relative overflow-hidden group select-none"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          handleMouseUpOrLeave();
        }}
      >
        {/* Dynamic Grid Background overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.01)_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none" />
        
        {/* Mini scan line glow */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent animate-pulse" />

        {/* Widget Header */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
            <span className="text-[10px] text-gray-400 font-mono tracking-wider uppercase font-bold">
              {modelType === 'core' && 'AEGIS COGNITIVE CORE'}
              {modelType === 'shield' && 'SECURE AEGIS SHIELD'}
              {modelType === 'pothole' && 'ROAD POTHOLE MODEL'}
              {modelType === 'pipe' && 'UTILITY PIPE CRACK'}
              {modelType === 'streetlight' && 'POWER GRID NODE'}
              {modelType === 'trash' && 'WASTE HOARD MOUND'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setModelType(prev => {
                const list: typeof modelType[] = ['core', 'shield', 'pothole', 'pipe', 'streetlight', 'trash'];
                const nextIdx = (list.indexOf(prev) + 1) % list.length;
                return list[nextIdx];
              })}
              className="p-1 hover:bg-white/5 rounded text-[9px] text-indigo-400 hover:text-white transition-colors cursor-pointer"
              title="Toggle Model Object"
            >
              Switch Object
            </button>
            
            {/* Open Immersive AR Trigger */}
            <button
              onClick={() => setArMode(true)}
              className="px-2 py-1 bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/20 text-cyan-400 hover:text-cyan-300 font-mono text-[9px] font-bold uppercase rounded-lg flex items-center gap-1 transition-all cursor-pointer"
            >
              <Camera className="w-2.5 h-2.5" />
              <span>Open in AR</span>
            </button>

            {!autoRotateRef.current && (
              <button 
                onClick={() => { autoRotateRef.current = true; }}
                className="p-1 hover:bg-white/5 rounded text-[9px] text-gray-500 hover:text-white transition-colors cursor-pointer"
                title="Reset Autoplay"
              >
                <RotateCcw className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        </div>

        {/* 3D Canvas Projection Stage */}
        <div className="relative flex items-center justify-center bg-slate-950/60 rounded-xl border border-white/5 overflow-hidden py-2">
          <canvas
            ref={canvasRef}
            width={240}
            height={135}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            className="cursor-grab active:cursor-grabbing block relative z-10 touch-none"
          />
          <div className="absolute bottom-1 right-2 text-[8px] font-mono text-gray-600 pointer-events-none z-15">
            DRAG TO ROTATE
          </div>
          
          {/* Futuristic Status Dots */}
          <div className="absolute top-2 left-2 flex items-center gap-1 z-15">
            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
            <span className="text-[8px] font-mono text-cyan-400 uppercase tracking-tight">Active View</span>
          </div>
        </div>

        <p className="text-[10px] text-gray-500 font-sans leading-relaxed">
          Interactive civic wireframe models designed to overlap live camera feeds to diagnose real-world architectural issues.
        </p>
      </div>

      {/* =========================================================================
          IMMERSIVE AR OVERLAY VIEW MODAL (Mobile Camera + Telemetry Simulation)
          ========================================================================= */}
      {arMode && (
        <div className={`fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-50 flex items-center justify-center transition-all duration-300 ${fullScreenAr ? 'p-0' : 'p-3 sm:p-6'} animate-fadeIn`}>
          
          {/* Capture flash feedback */}
          {isCapturing && (
            <div className="absolute inset-0 bg-white z-[60] pointer-events-none animate-ping" />
          )}

          <div id="ar-viewer-container" className={`bg-slate-900 overflow-hidden relative transition-all duration-300 ${fullScreenAr ? 'w-screen h-screen rounded-none border-0 shadow-none' : 'border border-white/10 rounded-3xl w-full max-w-5xl h-[92vh] sm:h-[84vh] shadow-2xl shadow-cyan-400/5'} flex flex-col lg:flex-row`}>
            
            {/* Close modal button top right */}
            <button 
              onClick={() => setArMode(false)}
              className="absolute top-4 right-4 z-50 p-2.5 bg-slate-950/80 border border-white/10 hover:border-red-400/20 text-gray-400 hover:text-red-400 rounded-full transition-all cursor-pointer shadow-lg"
              title="Exit AR View"
            >
              <X className="w-5 h-5" />
            </button>

            {/* LEFT / CENTRAL AR VIEWPORT PANEL (Camera feed + Hologram canvas overlay) */}
            <div className="flex-1 bg-black relative flex flex-col justify-between overflow-hidden">
              
              {/* VIDEO CAMERA STREAM BACKGROUND */}
              {!isSimulatingCamera ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover opacity-70 z-0"
                />
              ) : (
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-70 z-0 transition-all duration-500"
                  style={{ backgroundImage: `url('${activeBgObj?.url}')` }}
                />
              )}

              {/* OVERLAID 3D PROJECTION CANVAS */}
              <canvas
                ref={arCanvasRef}
                width={560}
                height={420}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUpOrLeave}
                onMouseLeave={handleMouseUpOrLeave}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
                className="absolute inset-0 w-full h-full z-20 cursor-grab active:cursor-grabbing block touch-none"
              />

              {/* AR INSTRUCTIONS CARD */}
              <div className="absolute top-24 left-4 z-40 pointer-events-auto max-w-[240px] font-mono">
                {showInstructions ? (
                  <div className="bg-slate-950/90 backdrop-blur-md border border-cyan-400/35 rounded-xl p-3 space-y-2.5 text-white shadow-xl">
                    <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-cyan-400">
                        <Info className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                        <span>AR SCANNER GUIDE</span>
                      </div>
                      <button 
                        onClick={() => setShowInstructions(false)}
                        className="text-gray-400 hover:text-white text-[9px] uppercase hover:underline cursor-pointer px-1.5 py-0.5 rounded bg-white/5"
                      >
                        Hide
                      </button>
                    </div>
                    <ul className="space-y-1.5 text-[8.5px] text-gray-300 leading-normal font-sans">
                      <li className="flex gap-1">
                        <span className="text-cyan-400 font-bold shrink-0 font-mono">1.</span>
                        <span>Drag inside screen to rotate the 3D model.</span>
                      </li>
                      <li className="flex gap-1">
                        <span className="text-cyan-400 font-bold shrink-0 font-mono">2.</span>
                        <span>Adjust position using Size, Distance, and Elevation sliders or click <strong>Snap to Floor</strong>.</span>
                      </li>
                      <li className="flex gap-1">
                        <span className="text-cyan-400 font-bold shrink-0 font-mono">3.</span>
                        <span>Toggle <strong>Occlusion Mode</strong> to let the 3D model appear realistically behind foreground objects.</span>
                      </li>
                      <li className="flex gap-1">
                        <span className="text-cyan-400 font-bold shrink-0 font-mono">4.</span>
                        <span>Take a scan to complete your citizen check and earn 50 XP!</span>
                      </li>
                    </ul>
                    <button 
                      onClick={() => setShowInstructions(false)}
                      className="w-full mt-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-[8.5px] font-mono font-bold py-1.5 rounded-lg transition-all cursor-pointer text-center active:scale-[0.98] shadow-md shadow-cyan-400/15"
                    >
                      GOT IT, HIDE GUIDE
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowInstructions(true)}
                    className="bg-slate-950/90 backdrop-blur-md border border-cyan-400/35 hover:border-cyan-400 rounded-lg px-2.5 py-1.5 text-[9px] text-cyan-400 font-bold uppercase transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Info className="w-3 h-3 text-cyan-400 animate-pulse" />
                    <span>Show Guide</span>
                  </button>
                )}
              </div>

              {/* HIGH-TECH HUD SCREEN OVERLAYS */}
              <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-between p-4 font-mono select-none">
                
                {/* HUD Top-Bar Info */}
                <div className="flex justify-between items-start text-cyan-400 text-[9px] sm:text-[10px] bg-slate-950/80 backdrop-blur-md p-2.5 rounded-xl border border-white/5 w-full pointer-events-auto">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shrink-0" />
                      <span className="text-white uppercase tracking-wider">AR CAMERA VIEW // GROUND LEVEL ALIGNMENT</span>
                    </div>
                    <div className="text-gray-400 font-sans">
                      SENSORS: <span className="text-emerald-400 font-bold font-mono">ACTIVE</span> // ALIGNMENT: <span className="text-cyan-400 font-bold font-mono">READY</span>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-gray-400 text-[8.5px]">GPS LOCK:</span>
                      <span className="text-emerald-400 font-bold">CONNECTED</span>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-1.5 pt-1">
                      <button 
                        onClick={snapToFloor}
                        className="pointer-events-auto px-2 py-0.5 rounded text-[8px] font-mono font-bold transition-all cursor-pointer bg-cyan-400 text-slate-950 hover:bg-cyan-300 flex items-center gap-1 shadow-md shadow-cyan-400/10 active:scale-95"
                      >
                        <Layers className="w-2.5 h-2.5" />
                        <span>SNAP TO FLOOR</span>
                      </button>
                      <button 
                        onClick={() => setOcclusionMode(!occlusionMode)}
                        className="pointer-events-auto px-1.5 py-0.5 rounded text-[8px] font-mono font-bold transition-all cursor-pointer bg-slate-950/85 text-cyan-400 border border-cyan-400/30 hover:bg-cyan-400/10"
                        style={{ color: occlusionMode ? '#f43f5e' : '#22d3ee', borderColor: occlusionMode ? '#f43f5e33' : '#22d3ee33' }}
                      >
                        {occlusionMode ? 'OCCLUSION: ON' : 'OCCLUSION: OFF'}
                      </button>
                      <button 
                        onClick={() => setFullScreenAr(!fullScreenAr)}
                        className="pointer-events-auto px-1.5 py-0.5 rounded text-[8px] font-mono font-bold transition-all cursor-pointer bg-slate-950/85 text-cyan-400 border border-cyan-400/30 hover:bg-cyan-400/10 flex items-center gap-1"
                        title={fullScreenAr ? "Exit Fullscreen" : "Enter Fullscreen"}
                      >
                        {fullScreenAr ? <Minimize2 className="w-2.5 h-2.5 text-rose-400 animate-pulse" /> : <Maximize2 className="w-2.5 h-2.5" />}
                        <span>{fullScreenAr ? 'FULLSCREEN' : 'FULLSCREEN'}</span>
                      </button>
                      <button 
                        onClick={() => setSidebarHidden(!sidebarHidden)}
                        className="pointer-events-auto px-1.5 py-0.5 rounded text-[8px] font-mono font-bold transition-all cursor-pointer bg-slate-950/85 text-cyan-400 border border-cyan-400/30 hover:bg-cyan-400/10 flex items-center gap-1"
                        title={sidebarHidden ? "Show Sidebar Controls" : "Hide Sidebar Controls"}
                      >
                        {sidebarHidden ? <Eye className="w-2.5 h-2.5 text-cyan-400" /> : <EyeOff className="w-2.5 h-2.5 text-rose-400" />}
                        <span>{sidebarHidden ? 'SHOW CONTROLS' : 'HIDE CONTROLS'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* HUD Targeting Reticle Brackets & Center crosshairs */}
                <div className="absolute inset-0 flex items-center justify-center">
                  
                  {/* Corner Targets */}
                  <div className="absolute top-16 left-12 w-8 h-8 border-t-2 border-l-2 border-cyan-400/40" />
                  <div className="absolute top-16 right-12 w-8 h-8 border-t-2 border-r-2 border-cyan-400/40" />
                  <div className="absolute bottom-16 left-12 w-8 h-8 border-b-2 border-l-2 border-cyan-400/40" />
                  <div className="absolute bottom-16 right-12 w-8 h-8 border-b-2 border-r-2 border-cyan-400/40" />

                  {/* Laser Scan line Sweep */}
                  <div className="absolute left-12 right-12 h-0.5 bg-cyan-400/20 shadow-cyan-400/30 shadow-lg animate-sweep pointer-events-none" />

                  {/* Center Crosshair Ring */}
                  <div className="w-16 h-16 border border-dashed border-cyan-400/30 rounded-full flex items-center justify-center animate-spin-slow">
                    <div className="w-4 h-4 border border-cyan-400/50 rounded-full" />
                  </div>
                  
                  {/* Compass Axis indicator */}
                  <div className="absolute bottom-20 left-12 flex items-center gap-2 text-cyan-400/60 text-[9px]">
                    <Compass className="w-4 h-4 animate-radar text-cyan-400" />
                    <span>DIRECTION: {Math.floor(rotRef.current.y * 57.29) % 360}° // TILT: {Math.floor(rotRef.current.x * 57.29)}°</span>
                  </div>
                </div>

                {/* HUD Bottom-Bar System logs */}
                <div className="flex justify-between items-end text-cyan-400 text-[8px] sm:text-[9px] bg-slate-950/60 backdrop-blur-md p-2 rounded-xl border border-white/5">
                  <div className="space-y-0.5 text-gray-400">
                    <div>[SCANNER] PHONE SENSORS: ONLINE</div>
                    <div>[SCANNER] 3D MESH STATUS: READY</div>
                    <div>[SCANNER] SURFACE DISTANCE: {arDepth.toFixed(1)}m</div>
                  </div>
                  <div className="text-right text-gray-500">
                    DRAG MODEL TO MANUALLY POSITION
                  </div>
                </div>
              </div>

              {/* Live Scanner Capture Confirmation Banner overlay */}
              {captureSuccess && (
                <div className="absolute inset-x-4 top-16 z-30 p-4 bg-emerald-950/90 border border-emerald-400/20 rounded-2xl flex items-center gap-3 animate-bounce shadow-2xl">
                  <Award className="w-8 h-8 text-emerald-400 shrink-0" />
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-white uppercase font-mono">Civic Diagnostic Completed Successfully!</h4>
                    <p className="text-[10px] text-gray-300 font-sans leading-tight">
                      Telemetry data package logged to local node. <strong className="text-emerald-300 font-mono">+{50} PTS Credited</strong> to your Hero Profile!
                    </p>
                    {scanValue && <p className="text-[8px] text-emerald-400 font-mono">HASH: {scanValue}</p>}
                  </div>
                </div>
              )}

              {/* Processing Capture step-by-step animation overlay */}
              {isCapturing && (
                <div className="absolute inset-0 bg-slate-950/90 z-30 flex flex-col items-center justify-center p-6 font-mono">
                  {/* Outer scan rings */}
                  <div className="relative w-28 h-28 flex items-center justify-center mb-6">
                    <div className="absolute inset-0 border-2 border-cyan-400/20 rounded-full animate-ping" />
                    <div className="absolute inset-1.5 border border-dashed border-cyan-400/40 rounded-full animate-spin-slow" />
                    <div className="absolute inset-4 border border-indigo-500/30 rounded-full animate-reverse-spin" />
                    <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                    <div className="absolute -bottom-2 bg-cyan-400 text-slate-950 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                      {Math.min(100, Math.floor(nodesScanned * 6.25))}%
                    </div>
                  </div>

                  <div className="text-center space-y-4 max-w-sm w-full">
                    <div className="space-y-1">
                      <p className="text-[10px] text-cyan-400 tracking-widest font-bold uppercase animate-pulse">
                        {captureStep.replace(/_/g, ' ')}
                      </p>
                      <p className="text-[9px] text-gray-500">
                        PROCESSING TELEMETRY CHANNELS...
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-900 border border-white/5 rounded-full h-2 overflow-hidden relative">
                      <div 
                        className="bg-gradient-to-r from-cyan-400 to-indigo-500 h-full transition-all duration-300"
                        style={{ width: `${nodesScanned * 6.25}%` }}
                      />
                    </div>

                    {/* Node scanning status */}
                    <div className="flex justify-between items-center text-[9px] text-gray-400 px-1 border-t border-white/5 pt-2">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                        <span>VERTICES TRACED:</span>
                      </div>
                      <span className="text-cyan-400 font-bold">{nodesScanned} / 16 COGNITIVE NODES</span>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* RIGHT SIDEBAR: AR MODEL SELECTION & CALIBRATION CONTROLS */}
            {!sidebarHidden && (
              <div className="w-full lg:w-80 bg-slate-950 border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col h-[40vh] lg:h-full overflow-y-auto divide-y divide-white/10 select-none">
              
              {/* Section 1: Target Hazard Object Select */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Select 3D Hazard Model</h4>
                  <span className="text-[8px] bg-cyan-400/10 text-cyan-400 font-mono px-1.5 py-0.5 rounded-full font-bold">6 PRESETS</span>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                  {[
                    { id: 'core', name: 'Aegis Core', desc: 'System Core', color: 'border-purple-500/20' },
                    { id: 'shield', name: 'Aegis Shield', desc: 'Boundary marker', color: 'border-rose-500/20' },
                    { id: 'pothole', name: 'Road Pothole', desc: 'Asphalt gap', color: 'border-amber-500/20' },
                    { id: 'pipe', name: 'Water Pipe Crack', desc: 'Underground crack', color: 'border-cyan-500/20' },
                    { id: 'streetlight', name: 'Streetlight pole', desc: 'Damaged pole', color: 'border-yellow-500/20' },
                    { id: 'trash', name: 'Waste Debris', desc: 'Trash heap', color: 'border-green-500/20' }
                  ].map((obj) => (
                    <button
                      key={obj.id}
                      onClick={() => setModelType(obj.id as any)}
                      className={`p-2 bg-slate-900 border text-left rounded-xl transition-all flex items-center justify-between group cursor-pointer ${
                        modelType === obj.id 
                          ? 'border-cyan-400 bg-cyan-400/5 shadow-md shadow-cyan-400/5' 
                          : 'border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="space-y-0.5 truncate pr-2">
                        <p className={`text-[10px] font-bold font-mono transition-colors ${modelType === obj.id ? 'text-cyan-400' : 'text-white'}`}>
                          {obj.name}
                        </p>
                        <p className="text-[8px] text-gray-500 truncate">{obj.desc}</p>
                      </div>
                      <div className={`w-3 h-3 rounded-full border border-white/20 flex items-center justify-center shrink-0 ${modelType === obj.id ? 'border-cyan-400 bg-cyan-400/10' : ''}`}>
                        {modelType === obj.id && <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 2: AR Alignment sliders */}
              <div className="p-4 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">3D Model Controls</h4>
                  <button 
                    onClick={() => {
                      setArScale(1.0);
                      setArDepth(3.0);
                      setArHeight(0);
                      setArXOffset(0);
                      setRot({ x: 0.5, y: 0.6, z: 0 });
                    }}
                    className="text-[8px] text-cyan-400 hover:text-cyan-300 font-mono font-bold uppercase transition-colors"
                  >
                    Reset Alignment
                  </button>
                </div>

                {/* Snap to Ground Level */}
                <button
                  onClick={snapToFloor}
                  className="w-full bg-cyan-500/10 hover:bg-cyan-500/15 border border-cyan-400/35 text-cyan-400 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 text-[9.5px] font-mono font-bold uppercase transition-all cursor-pointer active:scale-95"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Align / Snap Model to Floor</span>
                </button>

                <div className="space-y-2.5">
                  {/* Scale Size */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[8px] font-mono text-gray-400">
                      <span>MODEL SIZE (SCALE)</span>
                      <span className="text-cyan-400 font-bold">{(arScale * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="2.5"
                      step="0.05"
                      value={arScale}
                      onChange={(e) => setArScale(parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-900 border border-white/5 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>

                  {/* Depth / Z distance */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[8px] font-mono text-gray-400">
                      <span>DISTANCE FROM CAMERA (DEPTH)</span>
                      <span className="text-cyan-400 font-bold">{arDepth.toFixed(1)}m</span>
                    </div>
                    <input
                      type="range"
                      min="1.5"
                      max="5.0"
                      step="0.1"
                      value={arDepth}
                      onChange={(e) => setArDepth(parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-900 border border-white/5 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>

                  {/* Elevation / Y offset */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[8px] font-mono text-gray-400">
                      <span>VERTICAL ELEVATION (HEIGHT)</span>
                      <span className="text-cyan-400 font-bold">{arHeight > 0 ? `+${arHeight}` : arHeight}px</span>
                    </div>
                    <input
                      type="range"
                      min="-120"
                      max="120"
                      step="2"
                      value={arHeight}
                      onChange={(e) => setArHeight(parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-900 border border-white/5 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>

                  {/* Pan / X offset */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[8px] font-mono text-gray-400">
                      <span>HORIZONTAL PANNING (LEFT/RIGHT)</span>
                      <span className="text-cyan-400 font-bold">{arXOffset > 0 ? `+${arXOffset}` : arXOffset}px</span>
                    </div>
                    <input
                      type="range"
                      min="-150"
                      max="150"
                      step="2"
                      value={arXOffset}
                      onChange={(e) => setArXOffset(parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-900 border border-white/5 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Lens Configuration (Camera vs Simulation) & Occlusion */}
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Lens Settings</h4>
                  <button
                    onClick={() => setIsSimulatingCamera(prev => !prev)}
                    className={`px-2 py-0.5 text-[8px] font-mono font-bold uppercase rounded border transition-all ${
                      isSimulatingCamera 
                        ? 'bg-amber-400/10 border-amber-400/20 text-amber-400' 
                        : 'bg-slate-900 border-white/10 text-gray-400'
                    }`}
                  >
                    {isSimulatingCamera ? 'Using Sandbox Context' : 'Using Video Camera'}
                  </button>
                </div>

                {/* Occlusion Mode Toggle */}
                <div className="bg-slate-900/60 border border-white/5 rounded-xl p-3 flex items-center justify-between">
                  <div className="space-y-0.5 pr-2">
                    <p className="text-[9px] font-bold text-white font-mono uppercase tracking-tight">Depth Occlusion Mode</p>
                    <p className="text-[7.5px] text-gray-500 font-sans leading-tight">Allow 3D wireframe points to hide behind simulated physical depth barriers</p>
                  </div>
                  <button
                    onClick={() => setOcclusionMode(!occlusionMode)}
                    className={`px-3 py-1 text-[8.5px] font-mono font-bold uppercase rounded-lg border transition-all cursor-pointer ${
                      occlusionMode 
                        ? 'bg-rose-500/10 border-rose-500/25 text-rose-400' 
                        : 'bg-slate-950 border-white/10 text-gray-500 hover:text-white'
                    }`}
                  >
                    {occlusionMode ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>

                {isSimulatingCamera && (
                  <div className="space-y-2">
                    <p className="text-[8px] font-mono text-gray-500 uppercase">Change Simulation Backdrop:</p>
                    <div className="space-y-1.5">
                      {SIMULATION_BACKGROUNDS.map((bg) => (
                        <button
                          key={bg.id}
                          onClick={() => setSimulatedBg(bg.id)}
                          className={`w-full p-2 text-left rounded-xl border flex gap-2 items-center transition-all cursor-pointer ${
                            simulatedBg === bg.id 
                              ? 'bg-slate-900 border-cyan-400/30' 
                              : 'bg-slate-950/80 border-white/5 hover:border-white/10'
                          }`}
                        >
                          <div 
                            className="w-10 h-8 rounded bg-cover bg-center shrink-0 border border-white/10"
                            style={{ backgroundImage: `url('${bg.url}')` }}
                          />
                          <div className="space-y-0.5 truncate">
                            <p className="text-[9px] font-bold text-white leading-none">{bg.name}</p>
                            <p className="text-[7.5px] text-gray-500 truncate">{bg.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {cameraError && !isSimulatingCamera && (
                  <div className="p-2 bg-amber-400/5 border border-amber-400/10 rounded-xl space-y-1">
                    <div className="flex gap-1 text-amber-400 items-center">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span className="text-[9px] font-bold font-mono">CAMERA FEED UNAVAILABLE</span>
                    </div>
                    <p className="text-[8px] text-gray-400 leading-normal font-sans">
                      Device camera rejected or denied within iframe sandboxed space. Simulated background activated automatically.
                    </p>
                  </div>
                )}
              </div>

              {/* Action Scanning Button Bottom */}
              <div className="p-4 pt-5 mt-auto bg-slate-950 border-t border-white/5 space-y-3">
                <button
                  onClick={triggerDiagnosticCapture}
                  disabled={isCapturing}
                  className="w-full bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white font-mono text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/10 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Camera className="w-4 h-4 text-white" />
                  <span>CAPTURE AR DIAGNOSTIC SCAN</span>
                </button>
                <div className="flex gap-1.5 justify-center text-[8.5px] font-mono text-gray-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>SCAN AWARDS COMPLIANCE +50 PTS</span>
                </div>
              </div>
            </div>
          )}

          </div>
        </div>
      )}
    </>
  );
}
