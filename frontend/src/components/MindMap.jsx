// // // import React, { useState, useRef, useEffect } from 'react';
// // // import { X, Plus, FolderOpen, Save, Trash2 } from 'lucide-react';
// // // import './MindMap.css';
// // // import { useStudyMap } from "../context/StudyMapContext";

// // // const COLORS = [
// // //     '#5B9BFF', // Blue
// // //     '#A855F7', // Purple
// // //     '#EC4899', // Pink
// // //     '#EF4444', // Red
// // //     '#F97316', // Orange
// // //     '#10B981', // Green
// // //     '#14B8A6', // Teal
// // //     '#06B6D4', // Cyan
// // // ];

// // // const loadFromAI = (data, setNodes, nextIdRef) => {
// // //   let id = 1;
// // //   const centerId = id++;

// // //   const generatedNodes = [
// // //     {
// // //       id: centerId,
// // //       text: data.center,
// // //       x: 450,
// // //       y: 250,
// // //       color: '#5B9BFF',
// // //       isCenter: true
// // //     }
// // //   ];

// // //   data.branches.forEach((branch, i) => {
// // //     const parentId = id++;
// // //     generatedNodes.push({
// // //       id: parentId,
// // //       text: branch.title,
// // //       x: 250 + i * 250,
// // //       y: 100,
// // //       color: COLORS[i % COLORS.length],
// // //       parentId: centerId
// // //     });

// // //     branch.children.forEach((child, j) => {
// // //       generatedNodes.push({
// // //         id: id++,
// // //         text: child,
// // //         x: 250 + i * 250,
// // //         y: 200 + j * 80,
// // //         color: COLORS[(i + 1) % COLORS.length],
// // //         parentId: parentId
// // //       });
// // //     });
// // //   });

// // //   nextIdRef.current = id;
// // //   setNodes(generatedNodes);
// // // };

// // // const MindMap = ({ isOpen, onClose }) => {
// // //    const [nodes, setNodes] = useState([]);
// // //    const { mindMapData } = useStudyMap();

// // //     const [selectedNode, setSelectedNode] = useState(null);
// // //     const [draggingNode, setDraggingNode] = useState(null);
// // //     const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
// // //     const [showColorPicker, setShowColorPicker] = useState(false);
// // //     const canvasRef = useRef(null);
// // //     const nextIdRef = useRef(4);


// // //     useEffect(() => {
// // //         if (isOpen) {
// // //             drawConnections();
// // //         }
// // //     }, [nodes, isOpen]);

// // //     const drawConnections = () => {
// // //         const canvas = canvasRef.current;
// // //         if (!canvas) return;

// // //         const ctx = canvas.getContext('2d');
// // //         ctx.clearRect(0, 0, canvas.width, canvas.height);

// // //         nodes.forEach(node => {
// // //             if (node.parentId) {
// // //                 const parent = nodes.find(n => n.id === node.parentId);
// // //                 if (parent) {
// // //                     ctx.beginPath();
// // //                     ctx.moveTo(parent.x, parent.y);
// // //                     ctx.lineTo(node.x, node.y);
// // //                     ctx.strokeStyle = '#4A5568';
// // //                     ctx.lineWidth = 2;
// // //                     ctx.stroke();
// // //                 }
// // //             }
// // //         });
// // //     };

// // //     const handleMouseDown = (e, node) => {
// // //         const rect = e.currentTarget.getBoundingClientRect();
// // //         setDraggingNode(node.id);
// // //         setDragOffset({
// // //             x: e.clientX - rect.left - rect.width / 2,
// // //             y: e.clientY - rect.top - rect.height / 2
// // //         });
// // //         setSelectedNode(node.id);
// // //         setShowColorPicker(true);
// // //     };

// // //     const handleMouseMove = (e) => {
// // //         if (draggingNode) {
// // //             const container = document.querySelector('.mind-map-canvas');
// // //             const rect = container.getBoundingClientRect();
// // //             const x = e.clientX - rect.left - dragOffset.x;
// // //             const y = e.clientY - rect.top - dragOffset.y;

// // //             setNodes(nodes.map(node =>
// // //                 node.id === draggingNode
// // //                     ? { ...node, x, y }
// // //                     : node
// // //             ));
// // //         }
// // //     };

// // //     const handleMouseUp = () => {
// // //         setDraggingNode(null);
// // //     };

// // //     const addNewNode = () => {
// // //         const newNode = {
// // //             id: nextIdRef.current++,
// // //             text: 'New Concept',
// // //             x: 400 + Math.random() * 200 - 100,
// // //             y: 250 + Math.random() * 200 - 100,
// // //             color: COLORS[Math.floor(Math.random() * COLORS.length)],
// // //             parentId: nodes.find(n => n.isCenter)?.id || 1
// // //         };
// // //         setNodes([...nodes, newNode]);
// // //     };

// // //     const deleteNode = (nodeId) => {
// // //         setNodes(nodes.filter(node => node.id !== nodeId && !node.isCenter));
// // //         setSelectedNode(null);
// // //     };

// // //     const changeNodeColor = (color) => {
// // //         if (selectedNode) {
// // //             setNodes(nodes.map(node =>
// // //                 node.id === selectedNode ? { ...node, color } : node
// // //             ));
// // //         }
// // //         setShowColorPicker(false);
// // //     };

// // //     const updateNodeText = (nodeId, text) => {
// // //         setNodes(nodes.map(node =>
// // //             node.id === nodeId ? { ...node, text } : node
// // //         ));
// // //     };

// // //     const clearMap = () => {
// // //         setNodes([
// // //             { id: 1, text: 'Central Topic', x: 400, y: 250, color: '#5B9BFF', isCenter: true }
// // //         ]);
// // //         nextIdRef.current = 2;
// // //         setSelectedNode(null);
// // //     };

// // //     if (!isOpen) return null;

// // //     return (
// // //         <div className="mind-map-modal">
// // //             <div className="mind-map-container">
// // //                 <div className="mind-map-header">
// // //                     <div className="header-left">
// // //                         <div className="mind-map-icon">
// // //                             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
// // //                                 <circle cx="12" cy="12" r="3"></circle>
// // //                                 <circle cx="12" cy="5" r="2"></circle>
// // //                                 <circle cx="19" cy="12" r="2"></circle>
// // //                                 <circle cx="12" cy="19" r="2"></circle>
// // //                                 <circle cx="5" cy="12" r="2"></circle>
// // //                                 <line x1="12" y1="8" x2="12" y2="9"></line>
// // //                                 <line x1="15" y1="12" x2="17" y2="12"></line>
// // //                                 <line x1="12" y1="15" x2="12" y2="17"></line>
// // //                                 <line x1="9" y1="12" x2="7" y2="12"></line>
// // //                             </svg>
// // //                         </div>
// // //                         <h2>Visual Mind Map</h2>
// // //                     </div>
// // //                     <button className="close-btn" onClick={onClose}>
// // //                         <X size={24} />
// // //                     </button>
// // //                 </div>

// // //                 <div className="mind-map-toolbar">
// // //                     <div className="toolbar-left">
// // //                         <span className="map-label">Mind Map</span>
// // //                         <span className="map-status">Untitled</span>
// // //                     </div>
                
// // //                     <div className="toolbar-right">
// // //                         <button className="toolbar-btn" onClick={clearMap}>
// // //                             <Plus size={16} />
// // //                             New
// // //                         </button>
// // //                         <button className="toolbar-btn" onClick={addNewNode}>
// // //                             <Plus size={16} />
// // //                             Add Node
// // //                         </button>
// // //                         <button className="toolbar-btn">
// // //                             <FolderOpen size={16} />
// // //                             Open
// // //                         </button>
// // //                         <button className="toolbar-btn">
// // //                             <Save size={16} />
// // //                             Save As
// // //                         </button>
// // //                         <button className="toolbar-btn" onClick={clearMap}>
// // //                             <Trash2 size={16} />
// // //                             Clear
// // //                         </button>
// // //                     </div>
// // //                 </div>

// // //                 <div
// // //                     className="mind-map-canvas"
// // //                     onMouseMove={handleMouseMove}
// // //                     onMouseUp={handleMouseUp}
// // //                     onMouseLeave={handleMouseUp}
// // //                 >
// // //                     <canvas
// // //                         ref={canvasRef}
// // //                         width={900}
// // //                         height={500}
// // //                         style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
// // //                     />

// // //                     {nodes.map(node => (
// // //                         <div
// // //                             key={node.id}
// // //                             className={`mind-node ${selectedNode === node.id ? 'selected' : ''}`}
// // //                             style={{
// // //                                 left: node.x,
// // //                                 top: node.y,
// // //                                 backgroundColor: node.color,
// // //                             }}
// // //                             onMouseDown={(e) => handleMouseDown(e, node)}
// // //                         >
// // //                             <input
// // //                                 type="text"
// // //                                 value={node.text}
// // //                                 onChange={(e) => updateNodeText(node.id, e.target.value)}
// // //                                 className="node-input"
// // //                                 onClick={(e) => e.stopPropagation()}
// // //                             />
// // //                             {selectedNode === node.id && !node.isCenter && (
// // //                                 <button
// // //                                     className="delete-node-btn"
// // //                                     onClick={(e) => {
// // //                                         e.stopPropagation();
// // //                                         deleteNode(node.id);
// // //                                     }}
// // //                                 >
// // //                                     <X size={14} />
// // //                                 </button>
// // //                             )}
// // //                         </div>
// // //                     ))}

// // //                     {selectedNode && (
// // //                         <div className="color-picker-panel">
// // //                             <div className="color-picker-header">
// // //                                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
// // //                                     <circle cx="12" cy="12" r="10"></circle>
// // //                                     <circle cx="12" cy="12" r="3"></circle>
// // //                                 </svg>
// // //                                 <span>COLORS</span>
// // //                             </div>
// // //                             <div className="color-grid">
// // //                                 {COLORS.map(color => (
// // //                                     <button
// // //                                         key={color}
// // //                                         className={`color-option ${nodes.find(n => n.id === selectedNode)?.color === color ? 'active' : ''}`}
// // //                                         style={{ backgroundColor: color }}
// // //                                         onClick={() => changeNodeColor(color)}
// // //                                     />
// // //                                 ))}
// // //                             </div>
// // //                         </div>
// // //                     )}
// // //                 </div>
// // //             </div>
// // //         </div>
// // //     );
// // // };

// // // export default MindMap;
// // import React, { useState, useRef, useEffect } from 'react';
// // import { X, Plus, FolderOpen, Save, Trash2 } from 'lucide-react';
// // import './MindMap.css';
// // import { useStudyMap } from "../context/StudyMapContext";

// // const COLORS = [ /* unchanged */ ];

// // const loadFromAI = (data, setNodes, nextIdRef) => {
// //   let id = 1;
// //   const centerId = id++;

// //   const generatedNodes = [{
// //     id: centerId,
// //     text: data.center,
// //     x: 450,
// //     y: 250,
// //     color: '#5B9BFF',
// //     isCenter: true
// //   }];

// //   data.branches.forEach((branch, i) => {
// //     const parentId = id++;
// //     generatedNodes.push({
// //       id: parentId,
// //       text: branch.title,
// //       x: 250 + i * 250,
// //       y: 100,
// //       color: COLORS[i % COLORS.length],
// //       parentId: centerId
// //     });

// //     branch.children.forEach((child, j) => {
// //       generatedNodes.push({
// //         id: id++,
// //         text: child,
// //         x: 250 + i * 250,
// //         y: 200 + j * 80,
// //         color: COLORS[(i + 1) % COLORS.length],
// //         parentId
// //       });
// //     });
// //   });

// //   nextIdRef.current = id;
// //   setNodes(generatedNodes);
// // };

// // const MindMap = ({ isOpen, onClose }) => {
// //   const { mindMapData } = useStudyMap();

// //   const [nodes, setNodes] = useState([]);
// //   const [selectedNode, setSelectedNode] = useState(null);
// //   const [draggingNode, setDraggingNode] = useState(null);
// //   const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
// //   const [showColorPicker, setShowColorPicker] = useState(false);

// //   const canvasRef = useRef(null);
// //   const nextIdRef = useRef(4);

// //   // ✅ LOAD DATA FROM CONTEXT
// //   useEffect(() => {
// //     if (isOpen && mindMapData) {
// //       loadFromAI(mindMapData, setNodes, nextIdRef);
// //     }
// //   }, [isOpen, mindMapData]);

// //   useEffect(() => {
// //     if (isOpen) drawConnections();
// //   }, [nodes, isOpen]);

// //   const drawConnections = () => { /* unchanged */ };
// //   const handleMouseDown = () => { /* unchanged */ };
// //   const handleMouseMove = () => { /* unchanged */ };
// //   const handleMouseUp = () => { /* unchanged */ };
// //   const addNewNode = () => { /* unchanged */ };
// //   const deleteNode = () => { /* unchanged */ };
// //   const changeNodeColor = () => { /* unchanged */ };
// //   const updateNodeText = () => { /* unchanged */ };
// //   const clearMap = () => { /* unchanged */ };

// //   if (!isOpen) return null;

// //   return (
// //     <div className="mind-map-modal">
// //       <div className="mind-map-container">

// //         {/* HEADER */}
// //         <div className="mind-map-header">
// //           <h2>Visual Mind Map</h2>
// //           <button onClick={onClose}><X /></button>
// //         </div>

// //         {/* TOOLBAR (NO AI HERE) */}
// //         <div className="mind-map-toolbar">
// //           <button onClick={addNewNode}><Plus /> Add Node</button>
// //           <button onClick={clearMap}><Trash2 /> Clear</button>
// //         </div>

// //         {/* CANVAS */}
// //         <div className="mind-map-canvas"
// //           onMouseMove={handleMouseMove}
// //           onMouseUp={handleMouseUp}
// //           onMouseLeave={handleMouseUp}
// //         >
// //           <canvas ref={canvasRef} width={900} height={500} />

// //           {nodes.map(node => (
// //             <div key={node.id} className="mind-node"
// //               style={{ left: node.x, top: node.y, backgroundColor: node.color }}
// //               onMouseDown={(e) => handleMouseDown(e, node)}
// //             >
// //               <input
// //                 value={node.text}
// //                 onChange={(e) => updateNodeText(node.id, e.target.value)}
// //               />
// //             </div>
// //           ))}
// //         </div>

// //       </div>
// //     </div>
// //   );
// // };

// // export default MindMap;
// import React, { useState, useRef, useEffect } from "react";
// import { X, Plus, Trash2 } from "lucide-react";
// import "./MindMap.css";
// import { useStudyMap } from "../context/StudyMapContext";

// const COLORS = [
//   "#5B9BFF",
//   "#A855F7",
//   "#EC4899",
//   "#EF4444",
//   "#F97316",
//   "#10B981",
// ];

// const loadFromAI = (data, setNodes) => {
//   let id = 1;
//   const centerId = id++;

//   const nodes = [
//     {
//       id: centerId,
//       text: data.center,
//       x: 1000,
//       y: 600,
//       color: COLORS[0],
//       isCenter: true,
//     },
//   ];

//   data.branches.forEach((branch, i) => {
//     const angle = (2 * Math.PI * i) / data.branches.length;
//     const radius = 350;

//     const parentId = id++;
//     const px = 1000 + radius * Math.cos(angle);
//     const py = 600 + radius * Math.sin(angle);

//     nodes.push({
//       id: parentId,
//       text: branch.title,
//       x: px,
//       y: py,
//       color: COLORS[i % COLORS.length],
//       parentId: centerId,
//     });

//     branch.children.forEach((child, j) => {
//       nodes.push({
//         id: id++,
//         text: child,
//         x: px + 120,
//         y: py + j * 60,
//         color: COLORS[(i + 1) % COLORS.length],
//         parentId,
//       });
//     });
//   });

//   setNodes(nodes);
// };

// const MindMap = ({ isOpen, onClose }) => {
//   const { mindMapData } = useStudyMap();
//   const [nodes, setNodes] = useState([]);
//   const canvasRef = useRef(null);

//   useEffect(() => {
//     if (isOpen && mindMapData) {
//       loadFromAI(mindMapData, setNodes);
//     }
//   }, [isOpen, mindMapData]);

//   useEffect(() => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;

//     const ctx = canvas.getContext("2d");
//     ctx.clearRect(0, 0, canvas.width, canvas.height);

//     nodes.forEach((node) => {
//       if (node.parentId) {
//         const parent = nodes.find((n) => n.id === node.parentId);
//         if (!parent) return;

//         ctx.beginPath();
//         ctx.moveTo(parent.x, parent.y);
//         ctx.lineTo(node.x, node.y);
//         ctx.strokeStyle = "#94A3B8";
//         ctx.lineWidth = 2;
//         ctx.stroke();
//       }
//     });
//   }, [nodes]);

//   if (!isOpen) return null;

//   return (
//     <div className="mind-map-modal">
//       <div className="mind-map-container">
//         <div className="mind-map-header">
//           <h2>Visual Mind Map</h2>
//           <button onClick={onClose}>
//             <X />
//           </button>
//         </div>

//         <div className="mind-map-toolbar">
//           <button onClick={() => setNodes([])}>
//             <Trash2 /> Clear
//           </button>
//         </div>

//         <div className="mind-map-scroll">
//           <div className="mind-map-canvas">
//             <canvas ref={canvasRef} width={2000} height={1200} />

//             {nodes.map((node) => (
//               <div
//                 key={node.id}
//                 className="mind-node"
//                 style={{
//                   left: node.x,
//                   top: node.y,
//                   backgroundColor: node.color,
//                 }}
//               >
//                 {node.text}
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default MindMap;

import React, { useEffect, useRef, useState } from "react";
import { X, Trash2 } from "lucide-react";
import "./MindMap.css";
import { useStudyMap } from "../context/StudyMapContext";
import MindNode from "./MindNode";

const COLORS = ["#5B9BFF", "#A855F7", "#EC4899", "#F97316", "#10B981"];

const loadFromAI = (data) => {
  let id = 1;
  const nodes = [];

  const center = { id: id++, text: data.center, x: 1000, y: 600, color: COLORS[0], isCenter: true };
  nodes.push(center);

  data.branches.forEach((b, i) => {
    const angle = (2 * Math.PI * i) / data.branches.length;
    const px = center.x + 350 * Math.cos(angle);
    const py = center.y + 350 * Math.sin(angle);

    const parent = { id: id++, text: b.title, x: px, y: py, color: COLORS[i % COLORS.length], parentId: center.id };
    nodes.push(parent);

    b.children.forEach((c, j) => {
      nodes.push({
        id: id++,
        text: c,
        x: px + 120,
        y: py + j * 60,
        color: COLORS[(i + 1) % COLORS.length],
        parentId: parent.id,
      });
    });
  });

  return nodes;
};

const MindMap = ({ isOpen, onClose }) => {
  const { mindMapData } = useStudyMap();
  const [nodes, setNodes] = useState([]);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (isOpen && mindMapData) {
       try {
         console.log("🗺️ Loading mind map with data:", mindMapData);
         const loadedNodes = loadFromAI(mindMapData);
         console.log("📍 Generated nodes:", loadedNodes);
         setNodes(loadedNodes);
       } catch (error) {
         console.error("❌ Error loading mind map:", error);
       }
    }
  }, [isOpen, mindMapData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    nodes.forEach((n) => {
      if (!n.parentId) return;
      const p = nodes.find((x) => x.id === n.parentId);
      if (!p) return;

      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(n.x, n.y);
      ctx.strokeStyle = "#94A3B8";
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }, [nodes]);

  if (!isOpen) return null;

  return (
    <div className="mind-map-modal">
      <div className="mind-map-container">
        <div className="mind-map-header">
          <h2>Visual Mind Map</h2>
          <button onClick={onClose}><X /></button>
        </div>

        <div className="mind-map-toolbar">
          <button onClick={() => setNodes([])}><Trash2 /> Clear</button>
        </div>

        <div className="mind-map-scroll">
          <div className="mind-map-canvas">
            <canvas
              ref={canvasRef}
              width={2000}
              height={1200}
              style={{ position: "absolute", top: 0, left: 0, zIndex: 0, pointerEvents: "none" }}
            />
            {nodes.map((n) => {
              // determine level: root (center), level1 (direct child of center), level2 (child of level1)
              let level = 'level2';
              if (n.isCenter) level = 'root';
              else if (nodes.find((x) => x.id === n.parentId && x.isCenter)) level = 'level1';

              return (
                <div key={n.id} style={{ left: n.x, top: n.y, zIndex: 1, position: 'absolute', transform: 'translate(-50%, -50%)' }}>
                  <MindNode text={n.text} level={level} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MindMap;

