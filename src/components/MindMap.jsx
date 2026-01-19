import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, FolderOpen, Save, Trash2 } from 'lucide-react';
import './MindMap.css';

const COLORS = [
    '#5B9BFF', // Blue
    '#A855F7', // Purple
    '#EC4899', // Pink
    '#EF4444', // Red
    '#F97316', // Orange
    '#10B981', // Green
    '#14B8A6', // Teal
    '#06B6D4', // Cyan
];

const MindMap = ({ isOpen, onClose }) => {
    const [nodes, setNodes] = useState([
        { id: 1, text: 'Central Topic', x: 400, y: 250, color: '#5B9BFF', isCenter: true },
        { id: 2, text: 'New Concept', x: 600, y: 250, color: '#06B6D4', parentId: 1 },
        { id: 3, text: 'New Concept', x: 400, y: 150, color: '#EF4444', parentId: 1 },
    ]);
    const [selectedNode, setSelectedNode] = useState(null);
    const [draggingNode, setDraggingNode] = useState(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [showColorPicker, setShowColorPicker] = useState(false);
    const canvasRef = useRef(null);
    const nextIdRef = useRef(4);

    useEffect(() => {
        if (isOpen) {
            drawConnections();
        }
    }, [nodes, isOpen]);

    const drawConnections = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        nodes.forEach(node => {
            if (node.parentId) {
                const parent = nodes.find(n => n.id === node.parentId);
                if (parent) {
                    ctx.beginPath();
                    ctx.moveTo(parent.x, parent.y);
                    ctx.lineTo(node.x, node.y);
                    ctx.strokeStyle = '#4A5568';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            }
        });
    };

    const handleMouseDown = (e, node) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setDraggingNode(node.id);
        setDragOffset({
            x: e.clientX - rect.left - rect.width / 2,
            y: e.clientY - rect.top - rect.height / 2
        });
        setSelectedNode(node.id);
        setShowColorPicker(true);
    };

    const handleMouseMove = (e) => {
        if (draggingNode) {
            const container = document.querySelector('.mind-map-canvas');
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left - dragOffset.x;
            const y = e.clientY - rect.top - dragOffset.y;

            setNodes(nodes.map(node =>
                node.id === draggingNode
                    ? { ...node, x, y }
                    : node
            ));
        }
    };

    const handleMouseUp = () => {
        setDraggingNode(null);
    };

    const addNewNode = () => {
        const newNode = {
            id: nextIdRef.current++,
            text: 'New Concept',
            x: 400 + Math.random() * 200 - 100,
            y: 250 + Math.random() * 200 - 100,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            parentId: nodes.find(n => n.isCenter)?.id || 1
        };
        setNodes([...nodes, newNode]);
    };

    const deleteNode = (nodeId) => {
        setNodes(nodes.filter(node => node.id !== nodeId && !node.isCenter));
        setSelectedNode(null);
    };

    const changeNodeColor = (color) => {
        if (selectedNode) {
            setNodes(nodes.map(node =>
                node.id === selectedNode ? { ...node, color } : node
            ));
        }
        setShowColorPicker(false);
    };

    const updateNodeText = (nodeId, text) => {
        setNodes(nodes.map(node =>
            node.id === nodeId ? { ...node, text } : node
        ));
    };

    const clearMap = () => {
        setNodes([
            { id: 1, text: 'Central Topic', x: 400, y: 250, color: '#5B9BFF', isCenter: true }
        ]);
        nextIdRef.current = 2;
        setSelectedNode(null);
    };

    if (!isOpen) return null;

    return (
        <div className="mind-map-modal">
            <div className="mind-map-container">
                <div className="mind-map-header">
                    <div className="header-left">
                        <div className="mind-map-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="3"></circle>
                                <circle cx="12" cy="5" r="2"></circle>
                                <circle cx="19" cy="12" r="2"></circle>
                                <circle cx="12" cy="19" r="2"></circle>
                                <circle cx="5" cy="12" r="2"></circle>
                                <line x1="12" y1="8" x2="12" y2="9"></line>
                                <line x1="15" y1="12" x2="17" y2="12"></line>
                                <line x1="12" y1="15" x2="12" y2="17"></line>
                                <line x1="9" y1="12" x2="7" y2="12"></line>
                            </svg>
                        </div>
                        <h2>Visual Mind Map</h2>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="mind-map-toolbar">
                    <div className="toolbar-left">
                        <span className="map-label">Mind Map</span>
                        <span className="map-status">Untitled</span>
                    </div>
                    <div className="toolbar-right">
                        <button className="toolbar-btn" onClick={clearMap}>
                            <Plus size={16} />
                            New
                        </button>
                        <button className="toolbar-btn" onClick={addNewNode}>
                            <Plus size={16} />
                            Add Node
                        </button>
                        <button className="toolbar-btn">
                            <FolderOpen size={16} />
                            Open
                        </button>
                        <button className="toolbar-btn">
                            <Save size={16} />
                            Save As
                        </button>
                        <button className="toolbar-btn" onClick={clearMap}>
                            <Trash2 size={16} />
                            Clear
                        </button>
                    </div>
                </div>

                <div
                    className="mind-map-canvas"
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    <canvas
                        ref={canvasRef}
                        width={900}
                        height={500}
                        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
                    />

                    {nodes.map(node => (
                        <div
                            key={node.id}
                            className={`mind-node ${selectedNode === node.id ? 'selected' : ''}`}
                            style={{
                                left: node.x,
                                top: node.y,
                                backgroundColor: node.color,
                            }}
                            onMouseDown={(e) => handleMouseDown(e, node)}
                        >
                            <input
                                type="text"
                                value={node.text}
                                onChange={(e) => updateNodeText(node.id, e.target.value)}
                                className="node-input"
                                onClick={(e) => e.stopPropagation()}
                            />
                            {selectedNode === node.id && !node.isCenter && (
                                <button
                                    className="delete-node-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteNode(node.id);
                                    }}
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    ))}

                    {selectedNode && (
                        <div className="color-picker-panel">
                            <div className="color-picker-header">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                                <span>COLORS</span>
                            </div>
                            <div className="color-grid">
                                {COLORS.map(color => (
                                    <button
                                        key={color}
                                        className={`color-option ${nodes.find(n => n.id === selectedNode)?.color === color ? 'active' : ''}`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => changeNodeColor(color)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MindMap;
