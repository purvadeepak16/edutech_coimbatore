import React, { useState, useEffect, useRef } from 'react';
import { Lightbulb, Send, Clock, ThumbsUp, ArrowRight, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import aiRobotImg from '../assets/ai-robot.png';
import './AIDoubtSolverSection.css';

// Extract readable text from various AI response shapes.
const extractReadableText = (raw) => {
    if (!raw && raw !== 0) return null;

    // If it's already a string, try to parse JSON first, otherwise return the string.
    if (typeof raw === 'string') {
        try {
            const parsed = JSON.parse(raw);
            return extractReadableText(parsed);
        } catch (e) {
            return raw;
        }
    }

    // Handle common OpenAI-like shapes: { choices: [...] }
    const collect = [];

    const pushIfText = (txt) => {
        if (!txt && txt !== 0) return;
        if (typeof txt !== 'string') txt = String(txt);
        const trimmed = txt.trim();
        if (!trimmed) return;
        // skip short metadata values like roles or ids
        if (trimmed.length < 20 && /^(assistant|user|system|true|false|\d+)$/.test(trimmed)) return;
        collect.push(trimmed);
    };

    if (Array.isArray(raw)) {
        raw.forEach((r) => {
            const t = extractReadableText(r);
            if (t) pushIfText(t);
        });
    } else if (typeof raw === 'object') {
        // choices (chat/completion)
        if (Array.isArray(raw.choices)) {
            raw.choices.forEach((c) => {
                if (c.message) {
                    if (typeof c.message === 'string') pushIfText(c.message);
                    else if (c.message.content) pushIfText(c.message.content);
                } else if (c.text) pushIfText(c.text);
                else if (c.delta && c.delta.content) pushIfText(c.delta.content);
                else pushIfText(JSON.stringify(c));
            });
        } else if (raw.message) {
            if (typeof raw.message === 'string') pushIfText(raw.message);
            else if (raw.message.content) pushIfText(raw.message.content);
        } else if (raw.answer && typeof raw.answer === 'string') {
            pushIfText(raw.answer);
        } else if (raw.output_text && typeof raw.output_text === 'string') {
            pushIfText(raw.output_text);
        } else if (raw.text && typeof raw.text === 'string') {
            pushIfText(raw.text);
        } else if (raw.response && typeof raw.response === 'string') {
            pushIfText(raw.response);
        } else {
            // Generic recursive traversal: gather string leaves, skip known metadata keys
            const skipKeys = new Set(['role', 'id', 'type', 'index', 'metadata', 'refusal', 'reasoning']);
            const walk = (obj) => {
                if (!obj && obj !== 0) return;
                if (typeof obj === 'string') return pushIfText(obj);
                if (Array.isArray(obj)) return obj.forEach(walk);
                if (typeof obj === 'object') {
                    Object.entries(obj).forEach(([k, v]) => {
                        if (skipKeys.has(k)) return;
                        walk(v);
                    });
                } else if (typeof obj === 'number' || typeof obj === 'boolean') {
                    pushIfText(String(obj));
                }
            };
            walk(raw);
        }
    }

    if (collect.length === 0) return null;

    // Join collected pieces, preserve paragraphs and line breaks
    return collect.join('\n\n');
};

// Format text with markdown-style rendering
const formatAnswer = (text) => {
    if (!text) return null;
    
    // Split by double newlines for paragraphs
    const paragraphs = text.split(/\n\n+/);
    
    return paragraphs.map((para, idx) => {
        let trimmed = para.trim();
        
        // Check if it's a heading (###, ##, #)
        if (/^#{1,6}\s/.test(trimmed)) {
            const level = trimmed.match(/^(#{1,6})/)[1].length;
            const headingText = trimmed.replace(/^#{1,6}\s+/, '');
            const cleanText = headingText.replace(/\*\*/g, '');
            
            if (level <= 2) {
                return <h3 key={idx} className="answer-heading">{cleanText}</h3>;
            } else {
                return <h4 key={idx} className="answer-subheading">{cleanText}</h4>;
            }
        }
        
        // Check if it's a numbered list (convert to bullet list)
        if (/^\d+[\.\)]\s/.test(trimmed)) {
            const items = para.split(/\n(?=\d+[\.\)])/);
            return (
                <ul key={idx} className="answer-list">
                    {items.map((item, i) => {
                        let cleanItem = item.replace(/^\d+[\.\)]\s*/, '');
                        cleanItem = cleanItem.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
                        return <li key={i} dangerouslySetInnerHTML={{ __html: cleanItem }} />;
                    })}
                </ul>
            );
        }
        
        // Check if it's a bulleted list (-, *, •, or ++)
        if (/^[\*\-•+]{1,2}\s/.test(trimmed)) {
            const items = para.split(/\n(?=[\*\-•+]{1,2}\s)/);
            return (
                <ul key={idx} className="answer-list">
                    {items.map((item, i) => {
                        let cleanItem = item.replace(/^[\*\-•+]{1,2}\s*/, '');
                        cleanItem = cleanItem.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
                        return <li key={i} dangerouslySetInnerHTML={{ __html: cleanItem }} />;
                    })}
                </ul>
            );
        }
        
        // Regular paragraph - clean up markdown symbols and apply formatting
        let formatted = para;
        // Remove leading symbols like -, *, ###
        formatted = formatted.replace(/^[\*\-•+#\s]+/, '');
        // Convert bold markdown to HTML
        formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        // Remove any remaining single asterisks or markdown symbols
        formatted = formatted.replace(/\*/g, '');
        
        return (
            <p key={idx} className="answer-paragraph" dangerouslySetInnerHTML={{ __html: formatted }} />
        );
    });
};
const DoubtItem = ({ question, time, confidence, isLast }) => (
    <div className={`doubt-item ${isLast ? 'last' : ''}`}>
        <div className="doubt-content">
            <p className="doubt-question">"{question}"</p>
            <div className="doubt-meta">
                <span className="meta-time">
                    <Clock size={12} /> {time}
                </span>
                <span className="meta-confidence">
                    <ThumbsUp size={12} /> +{confidence}% confid.
                </span>
            </div>
        </div>
    </div>
);

const AIDoubtSolverSection = ({ initialQuery = '' }) => {
    const [query, setQuery] = useState(initialQuery || '');
    const [loading, setLoading] = useState(false);
    const [answer, setAnswer] = useState(null);
    const [error, setError] = useState(null);

    const sentRef = useRef(false);

    const onSend = async () => {
        if (!query.trim()) return;
        setLoading(true);
        setAnswer(null);
        setError(null);
        try {
            const { askOpenRouter } = await import('../services/aiApi');
            const res = await askOpenRouter(query);
            const candidate = res?.answer ?? res?.raw ?? res ?? null;
            const text = extractReadableText(candidate);
            if (text) {
                setAnswer(text);
            } else {
                // Fall back: log raw response and show it to user for debugging
                console.warn('AI returned an unreadable shape, raw response:', res);
                setAnswer(JSON.stringify(res, null, 2));
                setError('No readable text found in AI response — showing raw response');
            }
        } catch (err) {
            setError(err?.message || 'Request failed');
        } finally {
            setLoading(false);
        }
    };

    // Auto-send when an initialQuery is provided (only once)
    useEffect(() => {
        if (!initialQuery) return;
        if (sentRef.current) return;
        sentRef.current = true;
        // small delay to ensure UI mounts (optional)
        const t = setTimeout(() => {
            onSend();
        }, 120);
        return () => clearTimeout(t);
    }, [initialQuery]);

    const onKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            onSend();
        }
    };

    return (
        <section className="ai-doubt-section">
            {/* Animated Robot Mascot */}
            <div className="ai-robot-mascot">
                <img src={aiRobotImg} alt="AI Assistant" className="robot-image" />
                <div className="robot-speech-bubble">
                    <p>Ask me anything! 🤖</p>
                </div>
            </div>

            <div className="doubt-card">
                <div className="card-header">
                    <div className="icon-wrapper">
                        <Lightbulb size={24} color="var(--color-white)" fill="var(--color-white)" />
                    </div>
                    <h3>Ask AI Your Doubts</h3>
                </div>

                <div className="input-container">
                    <input
                        type="text"
                        placeholder="What's confusing you?"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={onKeyDown}
                    />
                    <button className={`send-btn ${loading ? 'thinking' : ''}`} onClick={onSend} disabled={loading}>
                        {loading ? 'Thinking...' : <Send size={18} />}
                    </button>
                </div>

                <div className="ai-response">
                    {error && (
                        <div className="ai-error">
                            <AlertCircle size={20} />
                            <span>Oops! {error}</span>
                        </div>
                    )}
                    {answer && (
                        <div className="ai-answer">
                            <div className="answer-header">
                                <div className="answer-icon">
                                    <Sparkles size={20} color="var(--color-white)" />
                                </div>
                                <h4>AI Answer</h4>
                                <div className="answer-badge">
                                    <CheckCircle size={14} />
                                    <span>Verified</span>
                                </div>
                            </div>
                            <div className="ai-answer-content">
                                {formatAnswer(answer)}
                            </div>
                            <div className="answer-footer">
                                <div className="answer-meta">
                                    <span className="answer-time">Just now</span>
                                    <span className="answer-separator">•</span>
                                    <span className="answer-model">AI Powered</span>
                                </div>
                                <div className="answer-actions">
                                    <button className="action-btn" title="Helpful">
                                        <ThumbsUp size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="recent-questions">
                    <h4>Recent Questions:</h4>
                    <div className="questions-list">
                        <DoubtItem
                            question="Why photosynthesis needs sun?"
                            time="Answered 2h ago"
                            confidence="12"
                        />
                        <DoubtItem
                            question="Mitochondria structure?"
                            time="Answered 5h ago"
                            confidence="8"
                        />
                        <DoubtItem
                            question="Cell membrane function?"
                            time="Answered yesterday"
                            confidence="15"
                            isLast={true}
                        />
                    </div>
                </div>

                <button className="view-all-btn">
                    View All Doubts <ArrowRight size={16} />
                </button>
            </div>
        </section>
    );
};

export default AIDoubtSolverSection;
