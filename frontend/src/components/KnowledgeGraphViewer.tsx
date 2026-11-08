import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  Search,
  Eye,
  Clock,
  ArrowRight,
  Info,
  Download,
  Sliders,
  Route,
  Play,
  Pause,
  X,
  Sparkles,
} from "lucide-react";
import type { GraphNode, GraphEdge, GraphDataResponse } from "../types/graph";

interface KnowledgeGraphViewerProps {
  data: GraphDataResponse;
  onRefresh?: () => void;
  className?: string;
}

interface SimNode extends GraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export const KnowledgeGraphViewer: React.FC<KnowledgeGraphViewerProps> = ({
  data,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Search & Filters
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showOrphansOnly, setShowOrphansOnly] = useState(false);
  const [selectedNode, setSelectedNode] = useState<SimNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<SimNode | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Physics Simulation Controls
  const [repulsionForce, setRepulsionForce] = useState(400);
  const [springLength, setSpringLength] = useState(120);
  const [centeringStrength, setCenteringStrength] = useState(0.005);
  const [isPhysicsPaused, setIsPhysicsPaused] = useState(false);
  const [showPhysicsMenu, setShowPhysicsMenu] = useState(false);

  // Shortest Path Finder State
  const [showPathFinder, setShowPathFinder] = useState(false);
  const [sourcePathSlug, setSourcePathSlug] = useState("");
  const [targetPathSlug, setTargetPathSlug] = useState("");
  const [computedPath, setComputedPath] = useState<string[] | null>(null);
  const [pathError, setPathError] = useState<string | null>(null);

  // Transform matrix state for pan/zoom
  const transformRef = useRef({ x: 0, y: 0, scale: 1 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const draggedNodeRef = useRef<SimNode | null>(null);

  // Simulation nodes and edges references
  const nodesRef = useRef<SimNode[]>([]);
  const edgesRef = useRef<GraphEdge[]>([]);
  const animFrameRef = useRef<number | null>(null);

  // Initialize simulation nodes when data changes
  useEffect(() => {
    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 600;

    const initialNodes: SimNode[] = data.nodes.map((n, i) => {
      const angle = (i / Math.max(1, data.nodes.length)) * 2 * Math.PI;
      const radiusDist = 150 + Math.random() * 150;
      const baseRadius = 8 + Math.min(16, n.degree * 2.5);

      return {
        ...n,
        x: width / 2 + Math.cos(angle) * radiusDist,
        y: height / 2 + Math.sin(angle) * radiusDist,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius: baseRadius,
      };
    });

    nodesRef.current = initialNodes;
    edgesRef.current = data.edges;

    // Reset transform to center
    transformRef.current = {
      x: width / 2,
      y: height / 2,
      scale: 1,
    };
  }, [data]);

  // Filtered nodes and edges for drawing
  const activeNodes = useMemo(() => {
    return nodesRef.current.filter((n) => {
      if (selectedCategory !== "All" && n.category !== selectedCategory) return false;
      if (showOrphansOnly && !n.is_orphan) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return n.title.toLowerCase().includes(q) || n.tags.some((t) => t.toLowerCase().includes(q));
      }
      return true;
    });
  }, [selectedCategory, showOrphansOnly, search, data]);

  const activeSlugSet = useMemo(() => new Set(activeNodes.map((n) => n.slug)), [activeNodes]);

  const activeEdges = useMemo(() => {
    return edgesRef.current.filter(
      (e) => activeSlugSet.has(e.source) && activeSlugSet.has(e.target)
    );
  }, [activeSlugSet, data]);

  // Connected neighbors lookup for hover/selection highlighting
  const connectedSlugs = useMemo(() => {
    if (computedPath && computedPath.length > 0) {
      return new Set(computedPath);
    }
    const targetNode = selectedNode || hoveredNode;
    if (!targetNode) return null;
    const set = new Set<string>([targetNode.slug]);
    for (const e of edgesRef.current) {
      if (e.source === targetNode.slug) set.add(e.target);
      if (e.target === targetNode.slug) set.add(e.source);
    }
    return set;
  }, [selectedNode, hoveredNode, computedPath]);

  // Shortest Path Finder Algorithm (BFS)
  const handleFindShortestPath = () => {
    setPathError(null);
    if (!sourcePathSlug || !targetPathSlug) {
      setPathError("Please choose both a source and target article.");
      return;
    }
    if (sourcePathSlug === targetPathSlug) {
      setComputedPath([sourcePathSlug]);
      return;
    }

    const adj = new Map<string, string[]>();
    for (const e of edgesRef.current) {
      if (!adj.has(e.source)) adj.set(e.source, []);
      if (!adj.has(e.target)) adj.set(e.target, []);
      adj.get(e.source)!.push(e.target);
      adj.get(e.target)!.push(e.source);
    }

    const queue: string[] = [sourcePathSlug];
    const visited = new Set<string>([sourcePathSlug]);
    const parent = new Map<string, string>();

    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (curr === targetPathSlug) {
        const path: string[] = [];
        let step: string | undefined = targetPathSlug;
        while (step) {
          path.unshift(step);
          step = parent.get(step);
        }
        setComputedPath(path);
        return;
      }
      for (const neighbor of adj.get(curr) || []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          parent.set(neighbor, curr);
          queue.push(neighbor);
        }
      }
    }

    setComputedPath(null);
    setPathError("No citation path exists between these two articles (they are in separate clusters).");
  };

  const handleClearPath = () => {
    setComputedPath(null);
    setPathError(null);
    setSourcePathSlug("");
    setTargetPathSlug("");
    setShowPathFinder(false);
  };

  // Export Canvas Snapshot as PNG
  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `company-wiki-knowledge-graph-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  // Physics Simulation Step
  const tickSimulation = useCallback(() => {
    if (isPhysicsPaused) return;
    const nodes = nodesRef.current;
    const edges = edgesRef.current;
    if (!nodes.length) return;

    const repulsion = repulsionForce;
    const springLen = springLength;
    const springStrength = 0.04;
    const damping = 0.88;

    const nodeBySlug = new Map<string, SimNode>();
    for (const n of nodes) {
      nodeBySlug.set(n.slug, n);
    }

    // 1. Repulsion between all node pairs
    for (let i = 0; i < nodes.length; i++) {
      const n1 = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const n2 = nodes[j];
        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const distSq = dx * dx + dy * dy || 1;
        const dist = Math.sqrt(distSq);

        if (dist < 400) {
          const force = repulsion / distSq;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          n1.vx -= fx;
          n1.vy -= fy;
          n2.vx += fx;
          n2.vy += fy;
        }
      }
    }

    // 2. Spring attraction along edges
    for (const edge of edges) {
      const s = nodeBySlug.get(edge.source);
      const t = nodeBySlug.get(edge.target);
      if (!s || !t) continue;

      const dx = t.x - s.x;
      const dy = t.y - s.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const delta = dist - springLen;
      const force = delta * springStrength * (edge.weight || 1);

      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      s.vx += fx;
      s.vy += fy;
      t.vx -= fx;
      t.vy -= fy;
    }

    // 3. Centering force & velocity damping
    for (const n of nodes) {
      if (draggedNodeRef.current === n) continue;
      const width = containerRef.current?.clientWidth || 800;
      const height = containerRef.current?.clientHeight || 600;

      const dx = width / 2 - n.x;
      const dy = height / 2 - n.y;
      n.vx += dx * centeringStrength;
      n.vy += dy * centeringStrength;

      n.vx *= damping;
      n.vy *= damping;

      n.x += n.vx;
      n.y += n.vy;
    }
  }, [isPhysicsPaused, repulsionForce, springLength, centeringStrength]);

  // Canvas Render Loop
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // Apply Pan & Zoom Transform
    const { x, y, scale } = transformRef.current;
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    const nodeBySlug = new Map<string, SimNode>();
    for (const n of nodesRef.current) {
      nodeBySlug.set(n.slug, n);
    }

    // Draw Edges
    for (const edge of activeEdges) {
      const s = nodeBySlug.get(edge.source);
      const t = nodeBySlug.get(edge.target);
      if (!s || !t) continue;

      const isPathEdge =
        computedPath &&
        computedPath.some(
          (slug, idx) =>
            idx < computedPath.length - 1 &&
            ((slug === s.slug && computedPath[idx + 1] === t.slug) ||
              (slug === t.slug && computedPath[idx + 1] === s.slug))
        );

      const isConnected =
        connectedSlugs && (connectedSlugs.has(s.slug) && connectedSlugs.has(t.slug));

      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(t.x, t.y);

      if (isPathEdge) {
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 3.5 / scale;
      } else if (isConnected) {
        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 2.5 / scale;
      } else if (connectedSlugs) {
        ctx.strokeStyle = "rgba(148, 163, 184, 0.08)";
        ctx.lineWidth = 1 / scale;
      } else {
        ctx.strokeStyle =
          edge.link_type === "direct_citation"
            ? "rgba(99, 102, 241, 0.35)"
            : "rgba(148, 163, 184, 0.22)";
        ctx.lineWidth = (edge.weight >= 2 ? 1.8 : 1.0) / scale;
      }
      ctx.stroke();
    }

    // Draw Nodes
    for (const n of activeNodes) {
      const isSelected = selectedNode?.slug === n.slug;
      const isHovered = hoveredNode?.slug === n.slug;
      const isInPath = computedPath?.includes(n.slug);
      const isConnected = connectedSlugs?.has(n.slug);
      const isDimmed = connectedSlugs && !isConnected;

      ctx.save();
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);

      // Node Fill
      if (isInPath) {
        ctx.fillStyle = "#10b981";
      } else if (isDimmed) {
        ctx.fillStyle = "rgba(100, 116, 139, 0.2)";
      } else {
        ctx.fillStyle = n.category_color || "#3b82f6";
      }
      ctx.fill();

      // Node Border / Glow
      if (isInPath || isSelected || isHovered) {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3 / scale;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius + 4 / scale, 0, Math.PI * 2);
        ctx.strokeStyle = isInPath ? "#10b981" : isSelected ? "#f59e0b" : "rgba(255, 255, 255, 0.4)";
        ctx.lineWidth = 2 / scale;
        ctx.stroke();
      } else if (isConnected && !isDimmed) {
        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 2 / scale;
        ctx.stroke();
      } else {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
        ctx.lineWidth = 1.2 / scale;
        ctx.stroke();
      }

      // Draw Node Labels
      if (!isDimmed && (scale >= 0.75 || n.degree >= 2 || isSelected || isHovered || isInPath)) {
        ctx.font = `${Math.max(10, Math.min(13, 11 / scale))}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = isInPath
          ? "#34d399"
          : isSelected || isHovered
          ? "#ffffff"
          : "rgba(241, 245, 249, 0.9)";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(n.title, n.x, n.y + n.radius + 4 / scale);
      }

      ctx.restore();
    }

    ctx.restore();
  }, [activeNodes, activeEdges, connectedSlugs, selectedNode, hoveredNode, computedPath]);

  // Main Animation Loop
  useEffect(() => {
    let active = true;
    const loop = () => {
      if (!active) return;
      tickSimulation();
      renderCanvas();
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      active = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [tickSimulation, renderCanvas]);

  // Resize canvas
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // Screen to World coordinates
  const screenToWorld = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    const { x, y, scale } = transformRef.current;
    return {
      x: (sx - x) / scale,
      y: (sy - y) / scale,
    };
  }, []);

  const findNodeAt = useCallback(
    (clientX: number, clientY: number): SimNode | null => {
      const { x: wx, y: wy } = screenToWorld(clientX, clientY);
      for (let i = activeNodes.length - 1; i >= 0; i--) {
        const n = activeNodes[i];
        const dx = n.x - wx;
        const dy = n.y - wy;
        if (dx * dx + dy * dy <= (n.radius + 6) * (n.radius + 6)) {
          return n;
        }
      }
      return null;
    },
    [activeNodes, screenToWorld]
  );

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const node = findNodeAt(e.clientX, e.clientY);
    if (node) {
      draggedNodeRef.current = node;
      setSelectedNode(node);
    } else {
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedNodeRef.current) {
      const { x: wx, y: wy } = screenToWorld(e.clientX, e.clientY);
      draggedNodeRef.current.x = wx;
      draggedNodeRef.current.y = wy;
      draggedNodeRef.current.vx = 0;
      draggedNodeRef.current.vy = 0;
    } else if (isDraggingRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      transformRef.current.x += dx;
      transformRef.current.y += dy;
    } else {
      const hit = findNodeAt(e.clientX, e.clientY);
      setHoveredNode(hit);
    }
  };

  const handleMouseUp = () => {
    draggedNodeRef.current = null;
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const currentScale = transformRef.current.scale;
    const newScale = Math.max(0.2, Math.min(4.0, currentScale * zoomFactor));

    const wx = (mouseX - transformRef.current.x) / currentScale;
    const wy = (mouseY - transformRef.current.y) / currentScale;

    transformRef.current.scale = newScale;
    transformRef.current.x = mouseX - wx * newScale;
    transformRef.current.y = mouseY - wy * newScale;
  };

  const zoomIn = () => {
    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 600;
    const cx = width / 2;
    const cy = height / 2;
    const wx = (cx - transformRef.current.x) / transformRef.current.scale;
    const wy = (cy - transformRef.current.y) / transformRef.current.scale;
    const newScale = Math.min(4.0, transformRef.current.scale * 1.25);
    transformRef.current.scale = newScale;
    transformRef.current.x = cx - wx * newScale;
    transformRef.current.y = cy - wy * newScale;
  };

  const zoomOut = () => {
    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 600;
    const cx = width / 2;
    const cy = height / 2;
    const wx = (cx - transformRef.current.x) / transformRef.current.scale;
    const wy = (cy - transformRef.current.y) / transformRef.current.scale;
    const newScale = Math.max(0.2, transformRef.current.scale * 0.8);
    transformRef.current.scale = newScale;
    transformRef.current.x = cx - wx * newScale;
    transformRef.current.y = cy - wy * newScale;
  };

  const resetView = () => {
    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 600;
    transformRef.current = {
      x: width / 2,
      y: height / 2,
      scale: 1,
    };
    setSelectedNode(null);
    setSearch("");
    handleClearPath();
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[650px] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden select-none ${className}`}
    >
      {/* Interactive Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      />

      {/* Top Floating Controls Bar */}
      <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Search & Category Filter */}
        <div className="flex items-center gap-2 pointer-events-auto bg-slate-900/80 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-xl">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter graph nodes..."
              className="pl-8 pr-2.5 py-1 text-xs rounded-lg bg-slate-800/80 border border-slate-700 text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 w-36 sm:w-48"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-200 focus:outline-hidden"
          >
            <option value="All">All Categories</option>
            {data.categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setShowOrphansOnly((p) => !p)}
            className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors border ${
              showOrphansOnly
                ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                : "bg-slate-800/60 text-slate-300 border-slate-700 hover:border-slate-600"
            }`}
          >
            Orphans
          </button>
        </div>

        {/* Action Suite (Shortest Path, Physics, Export, Zoom) */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-slate-900/80 backdrop-blur-md p-1 rounded-xl border border-slate-800 shadow-xl">
          {/* Find Path Toggle */}
          <button
            type="button"
            onClick={() => setShowPathFinder((p) => !p)}
            title="Find Shortest Citation Path"
            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
              showPathFinder || computedPath
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Route className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Path</span>
          </button>

          {/* Physics Settings Toggle */}
          <button
            type="button"
            onClick={() => setShowPhysicsMenu((p) => !p)}
            title="Adjust Simulation Physics"
            className={`p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition ${
              showPhysicsMenu ? "bg-slate-800 text-indigo-400" : ""
            }`}
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Pause / Play Physics */}
          <button
            type="button"
            onClick={() => setIsPhysicsPaused((p) => !p)}
            title={isPhysicsPaused ? "Resume Simulation" : "Freeze Simulation"}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            {isPhysicsPaused ? (
              <Play className="w-4 h-4 text-emerald-400" />
            ) : (
              <Pause className="w-4 h-4 text-amber-400" />
            )}
          </button>

          {/* Export PNG */}
          <button
            type="button"
            onClick={handleExportPNG}
            title="Export High-Res PNG"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <Download className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-slate-800 mx-0.5" />

          {/* Zoom Controls */}
          <button
            type="button"
            onClick={zoomIn}
            title="Zoom In"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={zoomOut}
            title="Zoom Out"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={resetView}
            title="Reset View"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Physics Settings Dropdown Drawer */}
      {showPhysicsMenu && (
        <div className="absolute top-16 right-4 pointer-events-auto bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-4 shadow-2xl w-64 space-y-3 z-30 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-1 border-b border-slate-800">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              Physics Engine Tuning
            </span>
            <button
              onClick={() => setShowPhysicsMenu(false)}
              className="text-slate-400 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Node Repulsion</span>
              <span className="text-white font-mono">{repulsionForce}</span>
            </div>
            <input
              type="range"
              min="100"
              max="800"
              step="20"
              value={repulsionForce}
              onChange={(e) => setRepulsionForce(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Link Spring Distance</span>
              <span className="text-white font-mono">{springLength}px</span>
            </div>
            <input
              type="range"
              min="60"
              max="240"
              step="10"
              value={springLength}
              onChange={(e) => setSpringLength(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Center Gravity</span>
              <span className="text-white font-mono">{(centeringStrength * 1000).toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0.001"
              max="0.02"
              step="0.001"
              value={centeringStrength}
              onChange={(e) => setCenteringStrength(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          <div className="pt-1 flex items-center justify-between border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                setRepulsionForce(400);
                setSpringLength(120);
                setCenteringStrength(0.005);
              }}
              className="text-[10px] text-slate-400 hover:text-white"
            >
              Reset Defaults
            </button>
            <button
              type="button"
              onClick={() => setIsPhysicsPaused((p) => !p)}
              className="text-[10px] text-indigo-400 hover:underline font-semibold"
            >
              {isPhysicsPaused ? "Resume Force" : "Freeze Movement"}
            </button>
          </div>
        </div>
      )}

      {/* Shortest Path Finder Drawer */}
      {showPathFinder && (
        <div className="absolute top-16 left-4 pointer-events-auto bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-4 shadow-2xl w-80 space-y-3 z-30 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-1 border-b border-slate-800">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Route className="w-3.5 h-3.5 text-emerald-400" />
              Find Shortest Citation Path
            </span>
            <button
              onClick={() => setShowPathFinder(false)}
              className="text-slate-400 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                Source Article:
              </label>
              <select
                value={sourcePathSlug}
                onChange={(e) => setSourcePathSlug(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-hidden"
              >
                <option value="">Select starting article...</option>
                {data.nodes.map((n) => (
                  <option key={`src-${n.slug}`} value={n.slug}>
                    {n.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                Target Article:
              </label>
              <select
                value={targetPathSlug}
                onChange={(e) => setTargetPathSlug(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-hidden"
              >
                <option value="">Select destination article...</option>
                {data.nodes.map((n) => (
                  <option key={`dst-${n.slug}`} value={n.slug}>
                    {n.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleFindShortestPath}
                className="flex-1 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition"
              >
                Trace Path
              </button>
              {computedPath && (
                <button
                  type="button"
                  onClick={handleClearPath}
                  className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 rounded-lg transition"
                >
                  Clear
                </button>
              )}
            </div>

            {pathError && (
              <p className="text-[11px] text-rose-400 pt-1 leading-snug">{pathError}</p>
            )}

            {computedPath && (
              <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-900/60 text-[11px] text-emerald-200 space-y-1">
                <span className="font-bold flex items-center gap-1 text-emerald-400">
                  <Sparkles className="w-3 h-3" />
                  Path Found ({computedPath.length - 1} hops)
                </span>
                <p className="text-[10px] text-emerald-300 font-mono break-words leading-tight">
                  {computedPath.join(" → ")}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Selected Node Details Card (Bottom Overlay) */}
      {selectedNode && (
        <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-md pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-4 shadow-2xl space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mb-1"
                style={{
                  backgroundColor: `${selectedNode.category_color}25`,
                  color: selectedNode.category_color,
                }}
              >
                {selectedNode.category}
              </span>
              <h3 className="font-bold text-white text-sm line-clamp-1">
                {selectedNode.title}
              </h3>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-slate-400 hover:text-white text-xs p-1"
            >
              ✕
            </button>
          </div>

          {selectedNode.summary && (
            <p className="text-xs text-slate-300 line-clamp-2">
              {selectedNode.summary}
            </p>
          )}

          <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px] text-slate-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" />
                {selectedNode.reading_time || 3} min
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3 text-slate-500" />
                {selectedNode.view_count} views
              </span>
              <span className="flex items-center gap-1 text-indigo-400 font-medium">
                {selectedNode.degree} citations
              </span>
            </div>

            <Link
              to={`/articles/${selectedNode.slug}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
            >
              Open Article <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Empty State Banner */}
      {activeNodes.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-6 text-center space-y-2">
          <Info className="w-8 h-8 text-slate-500 stroke-1" />
          <p className="text-sm font-semibold text-slate-300">No nodes match the current filter</p>
          <p className="text-xs text-slate-500 max-w-sm">
            Try resetting your search query or selecting "All Categories" to view the complete knowledge network.
          </p>
        </div>
      )}
    </div>
  );
};
