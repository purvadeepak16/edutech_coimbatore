import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, ArrowRight, Brain } from 'lucide-react';
import './SyllabusIngestionSection.css';

const SyllabusIngestionSection = () => {
    const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'manual'

    return (
        <section className="syllabus-ingestion-section" id="syllabus">
            <div className="section-header">
                <h2><Brain size={24} /> AI Syllabus Ingestion</h2>
                <div className="section-actions">
                    <button className="btn-secondary">View Full Syllabus</button>
                </div>
            </div>

            <div className="ingestion-container">
                <div className="ingestion-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
                        onClick={() => setActiveTab('upload')}
                    >
                        <Upload size={18} /> Upload File
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'manual' ? 'active' : ''}`}
                        onClick={() => setActiveTab('manual')}
                    >
                        <FileText size={18} /> Manual Input
                    </button>
                </div>

                <div className="ingestion-content">
                    {activeTab === 'upload' ? (
                        <div className="upload-area">
                            <div className="upload-placeholder">
                                <Upload size={48} className="upload-icon" />
                                <h3>Drop your Syllabus PDF or Image here</h3>
                                <p>AI will parse topics, remove redundancy, and structure your learning path.</p>
                                <button className="btn-primary">Select File</button>
                            </div>
                        </div>
                    ) : (
                        <div className="manual-input-area">
                            <textarea
                                placeholder="Enter topics, exam name, or paste syllabus text here..."
                                rows="6"
                            ></textarea>
                            <button className="btn-primary">
                                Generate Structure <ArrowRight size={18} />
                            </button>
                        </div>
                    )}
                </div>

                <div className="ai-processing-preview">
                    <h4><CheckCircle size={16} color="var(--color-green)" /> AI Processing Steps</h4>
                    <ul className="processing-steps">
                        <li className="completed">Parsing Syllabus File...</li>
                        <li className="completed">Identifying Key Topics...</li>
                        <li className="active">Structuring Learning Path...</li>
                        <li>Generating Micro-Checkpoints...</li>
                    </ul>
                </div>

                {/* Structured Output Preview */}
                <div className="structured-output">
                    <div className="output-header">
                        <h4>📋 Structured Syllabus Preview</h4>
                        <button className="btn-edit">Edit & Approve</button>
                    </div>

                    <div className="topics-tree">
                        <div className="topic-item">
                            <div className="topic-header">
                                <span className="topic-number">1</span>
                                <h5>Cell Biology</h5>
                                <span className="topic-duration">8 hrs</span>
                            </div>
                            <div className="subtopics">
                                <div className="subtopic">
                                    <span className="subtopic-dot"></span>
                                    <p>Cell Structure & Organelles</p>
                                </div>
                                <div className="subtopic">
                                    <span className="subtopic-dot"></span>
                                    <p>Cell Membrane & Transport</p>
                                </div>
                            </div>
                            <div className="learning-objectives">
                                <span className="obj-label">🎯 Objectives:</span>
                                <span>Understand cell components, Explain transport mechanisms</span>
                            </div>
                        </div>

                        <div className="topic-item">
                            <div className="topic-header">
                                <span className="topic-number">2</span>
                                <h5>Photosynthesis</h5>
                                <span className="topic-duration">6 hrs</span>
                            </div>
                            <div className="subtopics">
                                <div className="subtopic">
                                    <span className="subtopic-dot"></span>
                                    <p>Light Reactions</p>
                                </div>
                                <div className="subtopic">
                                    <span className="subtopic-dot"></span>
                                    <p>Calvin Cycle</p>
                                </div>
                            </div>
                            <div className="learning-objectives">
                                <span className="obj-label">🎯 Objectives:</span>
                                <span>Describe light-dependent reactions, Explain carbon fixation</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SyllabusIngestionSection;
