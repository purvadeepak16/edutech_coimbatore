import React, { useState, useEffect, useRef } from 'react';
import './VisualMindMap.css';

const VisualMindMap = ({ data, onNodeClick }) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });
  const [expandedNodes, setExpandedNodes] = useState(new Set(['root']));
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  const COLORS = [
    'var(--color-soft-blue)',
    'var(--color-soft-pink)',
    'var(--color-soft-teal)',
    'var(--color-soft-yellow)',
    'var(--color-soft-purple)',
    'var(--color-soft-orange)',
  ];

  // Count total nodes in subtree for spacing calculation
  const countNodes = (node) => {
    if (!node.children || node.children.length === 0 || !expandedNodes.has(node.id)) {
      return 1;
    }
    return 1 + node.children.reduce((sum, child) => sum + countNodes(child), 0);
  };

  // Radial-elliptic layout: subtree-weighted angular spans + variable radius + collision avoidance
  const radialEllipticLayout = (rootNode, canvasSize, opts = {}) => {
    const centerX = canvasSize.width / 2;
    const centerY = canvasSize.height / 2;
    const horizontalScale = opts.horizontalScale || 1.15; // ellipse factor
    const verticalScale = opts.verticalScale || 0.85;
    const minRadius = opts.minRadius || 60;
    const depthFactor = opts.depthFactor || 110; // base increment per level
    const densityFactor = opts.densityFactor || 28; // moves dense subtrees outward
    const collisionPadding = opts.collisionPadding || 8;

    // measure node text to produce adaptive width/height and wrapped lines
    const measureNode = (title, level) => {
      const fontSize = level === 0 ? 20 : 14 + Math.max(0, 2 - level);
      const approxCharWidth = fontSize * 0.55;
      // target line width depends on level: root can be wider
      const maxLineWidth = level === 0 ? 420 : 220;

      // word-wrap simulation (deterministic, uses approx char widths)
      const words = (title || '').split(/\s+/).filter(Boolean);
      const lines = [];
      let line = '';
      let lineWidthPx = 0;

      const pushLine = (l) => {
        if (l.length === 0) return;
        lines.push(l);
      };

      for (let i = 0; i < words.length; i++) {
        const w = words[i];
        const wPx = w.length * approxCharWidth + approxCharWidth; // space allowance
        if (lineWidthPx + wPx <= maxLineWidth || line.length === 0) {
          line = line.length === 0 ? w : line + ' ' + w;
          lineWidthPx += wPx;
        } else {
          pushLine(line);
          line = w;
          lineWidthPx = wPx;
        }
      }
      pushLine(line || '');

      // compute visual width as max of measured line widths
      const measuredLineWidths = lines.map(l => Math.max(50, l.length * approxCharWidth));
      const usedWidth = Math.min(maxLineWidth, Math.max(...measuredLineWidths));
      const lineHeight = fontSize * 1.25;
      const width = usedWidth + 20; // horizontal padding
      const height = Math.max(28, lines.length * lineHeight + 12);
      return { width, height, fontSize, lines, lineHeight };
    };

    // count nodes in subtree (weight)
    const nodeWeight = (n) => {
      if (!n || !n.children || !expandedNodes.has(n.id)) return 1;
      return 1 + n.children.reduce((s, c) => s + nodeWeight(c), 0);
    };

    // store measured sizes, weights, and subtree max widths
    const sizes = new Map();
    const weights = new Map();
    const subtreeMaxWidth = new Map();

    const precompute = (n, level = 0) => {
      const measured = measureNode(n.title || '', level);
      sizes.set(n.id, measured);
      const w = nodeWeight(n);
      weights.set(n.id, w);
      // recurse and compute subtree max width
      let maxW = measured.width;
      if (n.children && n.children.length > 0 && expandedNodes.has(n.id)) {
        n.children.forEach(child => {
          precompute(child, level + 1);
          const childMax = subtreeMaxWidth.get(child.id) || (sizes.get(child.id) || {}).width || 0;
          if (childMax > maxW) maxW = childMax;
        });
      }
      subtreeMaxWidth.set(n.id, maxW);
    };

    precompute(rootNode, 0);

    const placements = [];

    // recursive layout
    const layout = (n, level, aStart, aSpan, parentId = null) => {
      const w = weights.get(n.id) || 1;
      const size = sizes.get(n.id) || { width: 120, height: 28, fontSize: 14, lines: [''] };

      // dynamic radius: base + depth influence + size influence + subtree density
      // never move nodes inward; this is a starting radius estimate
      const radius = minRadius + Math.max(0, level - 0) * depthFactor + (size.width / 2) + Math.log(Math.max(1, w)) * densityFactor + collisionPadding;

      // pick angle at middle of allocated span
      const angle = aStart + aSpan / 2;
      const rad = (angle * Math.PI) / 180;

      const x = centerX + radius * Math.cos(rad) * horizontalScale;
      const y = centerY + radius * Math.sin(rad) * verticalScale;

      placements.push({ id: n.id, node: n, x, y, level, angle, radius, width: size.width, height: size.height, fontSize: size.fontSize, lines: size.lines, lineHeight: size.lineHeight, parentId });

      // children: allocate angle proportional to child weights
      if (n.children && n.children.length > 0 && expandedNodes.has(n.id)) {
        // children: allocate angle proportional to child weights and their subtree max width
        const rawChildWeights = n.children.map(c => weights.get(c.id) || 1);
        const childWidths = n.children.map(c => subtreeMaxWidth.get(c.id) || (sizes.get(c.id) || {}).width || 0);
        // combine metrics: subtree size * (1 + normalized maxWidth)
        const normalizedWidths = childWidths.map(w => w / 220); // normalization constant
        const combined = rawChildWeights.map((rw, idx) => rw * (1 + normalizedWidths[idx]));
        const total = combined.reduce((s, v) => s + v, 0) || 1;
        let cur = aStart;
        for (let i = 0; i < n.children.length; i++) {
          const child = n.children[i];
          const span = (combined[i] / total) * aSpan;
          layout(child, level + 1, cur, span, n.id);
          cur += span;
        }
      }
    };

    // start with full circle for root
    layout(rootNode, 0, 0, 360);

    // Collision resolution and parent-child minimum separation
    const bbox = (p) => ({
      left: p.x - p.width / 2 - collisionPadding,
      right: p.x + p.width / 2 + collisionPadding,
      top: p.y - p.height / 2 - collisionPadding,
      bottom: p.y + p.height / 2 + collisionPadding
    });

    const intersects = (a, b) => {
      return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
    };

    const updatePos = (p) => {
      const radA = (p.angle * Math.PI) / 180;
      p.x = centerX + p.radius * Math.cos(radA) * horizontalScale;
      p.y = centerY + p.radius * Math.sin(radA) * verticalScale;
    };

    // Enforce parent-child minimum radial separation
    const enforceParentChildSeparation = () => {
      const byId = new Map(placements.map(p => [p.id, p]));
      placements.forEach(child => {
        if (!child.parentId) return;
        const parent = byId.get(child.parentId);
        if (!parent) return;
        const minSep = Math.max(child.height / 1.1, (child.fontSize || 14) * 1.6) + 12;
        const desiredRadius = parent.radius + minSep;
        if (child.radius < desiredRadius) {
          child.radius = desiredRadius;
          updatePos(child);
        }
      });
    };

    // Initial parent-child separation pass
    enforceParentChildSeparation();

    // Iterative pairwise overlap resolution: always push the deeper node outward (never inward)
    let changed = true;
    let iter = 0;
    const maxIter = 30;
    while (changed && iter < maxIter) {
      changed = false;
      iter++;
      // deterministic ordering: by level asc then id
      for (let i = 0; i < placements.length; i++) {
        for (let j = i + 1; j < placements.length; j++) {
          const a = placements[i];
          const b = placements[j];
          if (a.id === b.id) continue;
          const aBox = bbox(a);
          const bBox = bbox(b);
          if (!intersects(aBox, bBox)) continue;

          // choose which to push: deeper node gets pushed; if same level choose deterministic tiebreak
          let deeper = null;
          if (a.level > b.level) deeper = a;
          else if (b.level > a.level) deeper = b;
          else deeper = a.id > b.id ? a : b;

          const inc = Math.max(8, Math.sqrt(deeper.width * deeper.height) * 0.12 + 6);
          deeper.radius += inc;
          updatePos(deeper);
          changed = true;
        }
      }
      // after each sweep, re-enforce parent-child separation to avoid parent collisions
      enforceParentChildSeparation();
    }

    // Return placements mapped to required node output
    return placements.map(p => ({
      id: p.id,
      x: p.x,
      y: p.y,
      width: p.width,
      height: p.height,
      level: p.level,
      angle: p.angle,
      radius: p.radius,
      fontSize: p.fontSize,
      lines: p.lines,
      lineHeight: p.lineHeight,
      node: p.node
    }));
  };

  const nodes = data ? radialEllipticLayout(data.root, { width: dimensions.width, height: dimensions.height }) : [];

  // Find connections between nodes
  const connections = [];
  const findConnections = (node, nodePositions) => {
    if (node.children && expandedNodes.has(node.id)) {
      const parent = nodePositions.find(n => n.id === node.id);
      node.children.forEach(child => {
        const childNode = nodePositions.find(n => n.id === child.id);
        if (parent && childNode) {
          connections.push({ from: parent, to: childNode });
        }
        findConnections(child, nodePositions);
      });
    }
  };

  if (data) {
    findConnections(data.root, nodes);
  }

  const toggleNode = (nodeId) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
    if (onNodeClick) onNodeClick(nodeId);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform(prev => ({
      ...prev,
      scale: Math.max(0.3, Math.min(2, prev.scale * delta))
    }));
  };

  const handleMouseDown = (e) => {
    if (e.target.tagName === 'svg') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setTransform(prev => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setTransform({ x: 0, y: 0, scale: 1 });
  };

  const autoFitView = () => {
    if (nodes.length === 0) return;
    
    // Calculate bounding box of all nodes
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    nodes.forEach(node => {
      const halfWidth = (node.width || 160) / 2;
      const halfHeight = (node.height || 70) / 2;
      minX = Math.min(minX, node.x - halfWidth);
      maxX = Math.max(maxX, node.x + halfWidth);
      minY = Math.min(minY, node.y - halfHeight);
      maxY = Math.max(maxY, node.y + halfHeight);
    });
    
    // Add padding
    const padding = 100;
    const contentWidth = maxX - minX + padding * 2;
    const contentHeight = maxY - minY + padding * 2;
    
    // Calculate scale to fit
    const scaleX = dimensions.width / contentWidth;
    const scaleY = dimensions.height / contentHeight;
    const scale = Math.min(scaleX, scaleY, 1.2); // Cap at 120% for readability
    
    // Calculate center offset
    const contentCenterX = (minX + maxX) / 2;
    const contentCenterY = (minY + maxY) / 2;
    const viewportCenterX = dimensions.width / 2;
    const viewportCenterY = dimensions.height / 2;
    
    const offsetX = viewportCenterX - contentCenterX * scale;
    const offsetY = viewportCenterY - contentCenterY * scale;
    
    setTransform({ x: offsetX, y: offsetY, scale });
  };

  // Auto-fit on initial load and when nodes change
  useEffect(() => {
    if (nodes.length > 0) {
      const timer = setTimeout(() => autoFitView(), 100);
      return () => clearTimeout(timer);
    }
  }, [nodes.length, expandedNodes.size]);

  const expandAll = () => {
    const allIds = new Set();
    const collectIds = (node) => {
      allIds.add(node.id);
      if (node.children) {
        node.children.forEach(collectIds);
      }
    };
    if (data) collectIds(data.root);
    setExpandedNodes(allIds);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set(['root']));
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (!data || !data.root) {
    return (
      <div className="visual-mindmap-empty">
        <p>No mind map data available</p>
        <p>Generate a mind map to see the visualization</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`visual-mindmap-container ${isFullscreen ? 'fullscreen' : ''}`}
    >
      <div className="mindmap-controls">
        <button onClick={autoFitView} className="control-btn">🎯 Center & Fit</button>
        <button onClick={expandAll} className="control-btn">➕ Expand All</button>
        <button onClick={collapseAll} className="control-btn">➖ Collapse All</button>
        <button onClick={toggleFullscreen} className="control-btn control-btn-fullscreen">
          {isFullscreen ? '🗗 Exit Fullscreen' : '⛶ Fullscreen'}
        </button>
        <span className="zoom-indicator">Zoom: {(transform.scale * 100).toFixed(0)}%</span>
      </div>

      <svg
        ref={svgRef}
        className="mindmap-svg"
        width="100%"
        height="100%"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
          {/* Connections */}
          {connections.map((conn, idx) => {
            // Create smooth curved path from parent to child
            // Calculate control points for natural organic curves
            const dx = conn.to.x - conn.from.x;
            const dy = conn.to.y - conn.from.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // Control points at 40% distance for smooth curves
            const controlDist = dist * 0.4;
            const angle = Math.atan2(dy, dx);
            
            const cp1x = conn.from.x + Math.cos(angle) * controlDist;
            const cp1y = conn.from.y + Math.sin(angle) * controlDist;
            const cp2x = conn.to.x - Math.cos(angle) * controlDist;
            const cp2y = conn.to.y - Math.sin(angle) * controlDist;
            
            const path = `M ${conn.from.x} ${conn.from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${conn.to.x} ${conn.to.y}`;
            
            return (
              <path
                key={`conn-${idx}`}
                d={path}
                stroke="var(--color-navy)"
                strokeWidth="2.5"
                fill="none"
                opacity="0.35"
                className="connection-line"
              />
            );
          })}

          {/* Nodes */}
          {nodes.map((n) => {
            // `n` is the placement object returned by radialEllipticLayout
            const nd = n.node || {};
            const hasChildren = nd.children && nd.children.length > 0;
            const isExpanded = expandedNodes.has(nd.id);
            const isRoot = n.level === 0;

            const bgW = n.width || 120;
            const bgH = n.height || 34;
            const bgColor = COLORS[n.level % COLORS.length] || 'var(--color-soft-blue)';

            const lines = n.lines && n.lines.length > 0 ? n.lines : [(nd.title || '')];
            const totalTextHeight = (n.lineHeight || 18) * lines.length;
            const firstY = -totalTextHeight / 2 + (n.lineHeight || 18) / 2;

            return (
              <g
                key={n.id}
                transform={`translate(${n.x}, ${n.y})`}
                className="node-group"
                onClick={() => hasChildren && toggleNode(nd.id)}
                style={{ cursor: hasChildren ? 'pointer' : 'default' }}
              >
                <text
                  x={0}
                  y={0}
                  textAnchor="middle"
                  fill="var(--color-navy)"
                  fontSize={n.fontSize || (isRoot ? 20 : 15)}
                  fontWeight={isRoot ? 'bold' : 600}
                  className="node-text"
                >
                  {lines.map((ln, idx) => (
                    <tspan
                      key={`ln-${idx}`}
                      x={0}
                      dy={idx === 0 ? firstY : n.lineHeight || 18}
                    >
                      {ln}
                    </tspan>
                  ))}
                </text>

                {hasChildren && (
                  <g className="expand-indicator">
                    <circle
                      cx="0"
                      cy={firstY - (n.lineHeight || 18) - 10}
                      r="8"
                      fill="var(--color-navy)"
                      stroke="white"
                      strokeWidth="2"
                    />
                    <text
                      x="0"
                      y={firstY - (n.lineHeight || 18) - 10}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      fontSize="12"
                      fontWeight="bold"
                      style={{ pointerEvents: 'none' }}
                    >
                      {isExpanded ? '−' : '+'}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      <div className="mindmap-legend">
        <p><strong>📚 Study Tip:</strong> Scroll to zoom • Drag to pan • Click nodes to expand/collapse • Use fullscreen for better focus</p>
      </div>
    </div>
  );
};

export default VisualMindMap;
