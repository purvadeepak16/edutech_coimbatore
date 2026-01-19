import React, { useState } from 'react';
import { Network, AlertCircle, Lock, CheckCircle2 } from 'lucide-react';
import MindMap from '../components/MindMap';
import './KnowledgeGraphSection.css';

const TreeNode = ({ title, status, progress, children, isLast }) => {
    const getStatusIcon = (status) => {
        switch (status) {
            case 'mastered': return <CheckCircle2 size={16} color="var(--color-success)" />;
            case 'weak': return <AlertCircle size={16} color="var(--color-danger)" />;
            case 'locked': return <Lock size={16} color="var(--color-soft-blue)" />;
            default: return <div className="status-dot in-progress"></div>;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'mastered': return 'var(--color-success)';
            case 'weak': return 'var(--color-danger)';
            case 'locked': return 'var(--color-gray-light)';
            case 'inprogress': return 'var(--color-warning)';
            default: return 'var(--color-navy)';
        }
    };

    return (
        <div className="tree-node-wrapper">
            <div className={`tree-node ${status}`}>
                <div className="node-content">
                    {getStatusIcon(status)}
                    <span className="node-title">{title}</span>
                    {progress && <span className="node-progress" style={{ color: getStatusColor(status) }}>{progress}</span>}
                </div>
            </div>
            {children && (
                <div className="tree-children">
                    {children}
                </div>
            )}
        </div>
    );
};

const KnowledgeGraphSection = () => {
    const [isMindMapOpen, setIsMindMapOpen] = useState(false);

    return (
        <section className="knowledge-graph-section">
            <div className="section-header-row">
                <h2>Your Learning Map</h2>
                <div className="legend">
                    <span className="legend-item"><span className="dot mastered"></span> Mastered</span>
                    <span className="legend-item"><span className="dot inprogress"></span> In Progress</span>
                    <span className="legend-item"><span className="dot weak"></span> Weak</span>
                    <span className="legend-item"><span className="dot locked"></span> Locked</span>
                </div>
            </div>

            <div className="graph-container">
                <div className="root-node">
                    <h3>📚 Biology</h3>
                </div>

                <div className="tree-structure">
                    {/* Unit 1 */}
                    <div className="branch">
                        <TreeNode title="Unit 1: Cell Structure" status="mastered" progress="92%">
                            <TreeNode title="1.1 Membrane" status="mastered" progress="92%" />
                            <TreeNode title="1.2 Mitochondria" status="weak" progress="45%" />
                            <TreeNode title="1.3 Nucleus" status="mastered" progress="88%" isLast={true} />
                        </TreeNode>
                    </div>

                    {/* Unit 2 */}
                    <div className="branch">
                        <TreeNode title="Unit 2: Genetics" status="inprogress" progress="In Progress">
                            <div className="dependency-line">Needs Unit 1: 85%+</div>
                        </TreeNode>
                    </div>

                    {/* Unit 3 */}
                    <div className="branch">
                        <TreeNode title="Unit 3: Evolution" status="locked" progress="Locked" isLast={true} />
                    </div>
                </div>
            </div>

            <div className="graph-footer">
                <div className="summary-stats">
                    <span>🟢 5 Mastered</span>
                    <span>🟡 3 In Progress</span>
                    <span>🔴 2 Weak</span>
                    <span>🔵 1 Locked</span>
                </div>
                <div className="actions">
                    <button className="action-link" onClick={() => setIsMindMapOpen(true)}>
                        <Network size={16} />
                        Open Visual Mind Map
                    </button>
                    <a href="#">View Full Syllabus</a>
                    <a href="#">Download Study Map</a>
                </div>
            </div>

            <MindMap isOpen={isMindMapOpen} onClose={() => setIsMindMapOpen(false)} />
        </section>
    );
};

export default KnowledgeGraphSection;

