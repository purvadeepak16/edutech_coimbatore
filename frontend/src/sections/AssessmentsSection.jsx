import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileText, Brain, Target, Calendar, BarChart2 } from 'lucide-react';
import './AssessmentsSection.css';

const TestCard = ({
    title,
    status,
    icon: Icon,
    questions,
    time,
    passScore,
    requirement,
    progress,
    color,
    isLocked,
    onStart
}) => {
    return (
        <div className={`test-card ${isLocked ? 'locked' : ''}`}>
            <div className="test-header">
                <div className={`icon-circle ${isLocked ? 'gray' : ''}`} style={!isLocked ? { borderColor: color } : {}}>
                    <Icon size={20} color={isLocked ? 'var(--color-gray-light)' : color} />
                </div>
                <div className="status-chip" style={!isLocked ? { borderColor: color } : {}}>
                    {isLocked ? '🔒 Locked' : '✓ Available'}
                </div>
            </div>

            <h3 className="test-title">{title}</h3>

            {isLocked ? (
                <div className="locked-details">
                    <p className="requirement">{requirement}</p>
                    <div className="progress-mini">
                        <span className="topics-badge">{progress}</span>
                    </div>
                    <button className="test-btn locked">
                        {status === 'Coming Soon' ? 'Coming Soon' : 'Unlock Soon'}
                    </button>
                </div>
            ) : (
                <div className="active-details">
                    <div className="test-meta">
                        <span>{questions} Questions</span> • <span>{time}</span>
                    </div>
                    <div className="pass-score">Pass: {passScore}</div>
                    <button className="test-btn primary" style={{ backgroundColor: color }} onClick={onStart}>
                        Start Test
                    </button>
                </div>
            )}
        </div>
    );
};

const AssessmentsSection = () => {
    const { useState, useEffect } = React;
    const [basicUnlocked, setBasicUnlocked] = useState(true);
    const [advancedUnlocked, setAdvancedUnlocked] = useState(false);
    const [scenarioUnlocked, setScenarioUnlocked] = useState(false);
    const [runningExam, setRunningExam] = useState(null); // 'basic' | 'advanced' | 'scenario' | null
    const [questions, setQuestions] = useState([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState([]);
    const [topic, setTopic] = useState('Daily Topic');

    // Read todaysTasks from react-router location.state (if provided)
    const location = useLocation();
    const navigate = useNavigate();
    useEffect(() => {
        const state = location && location.state ? location.state : null;
        if (state && state.todaysTasks && state.todaysTasks.length > 0) {
            const combined = state.todaysTasks.map(t => `${t.subject}: ${t.title}`).join('\n');
            setTopic(combined);
        }
    }, [location]);

    const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);

    const generateQuestions = (level, topicText, count) => {
        const topics = topicText.split('\n').filter(Boolean);
        // derive a domain/subject from the first topic line; prefer the subject part before ':'
        const first = topics.length > 0 ? topics[0] : '';
        const domain = first.includes(':') ? first.split(':')[0].trim() : (first.trim() || 'General Knowledge');

        const templatesBasic = [
            ({d}) => ({
                question: `What is ${d}?`,
                correct: `${d} is the study of its core concepts and principles.`,
                distractors: [
                    `A software tool unrelated to ${d}`,
                    `A type of data structure`,
                    `A mathematical constant`
                ]
            }),
            ({d}) => ({
                question: `Which of the following is a common type or category in ${d}?`,
                correct: `Supervised ${d}`,
                distractors: [`Photosynthesis`, `Quadratic equations`, `Cell organelle`]
            }),
            ({d}) => ({
                question: `Which term is most closely associated with ${d}?`,
                correct: `${d} model`,
                distractors: [`Unrelated term`, `Historical date`, `Random number`]
            }),
            ({d}) => ({
                question: `A primary application of ${d} is:`,
                correct: `Solving real-world problems using ${d} techniques`,
                distractors: [`Cooking recipes`, `Car maintenance`, `Painting`]
            }),
            ({d}) => ({
                question: `Which of these is an example related to ${d}?`,
                correct: `An example application of ${d}`,
                distractors: [`An unrelated biological process`, `A legal term`, `A type of furniture`]
            }),
            ({d}) => ({
                question: `Which is NOT typically a concept inside ${d}?`,
                correct: `An unrelated concept`,
                distractors: [`Core ${d} concept`, `Common ${d} term`, `Another ${d} idea`]
            }),
            ({d}) => ({
                question: `Which one is a basic component or building block in ${d}?`,
                correct: `${d} component`,
                distractors: [`Unrelated component`, `Obsolete item`, `Fictional item`]
            }),
            ({d}) => ({
                question: `What would you learn first when studying ${d}?`,
                correct: `Fundamental definitions and examples of ${d}`,
                distractors: [`Advanced research papers`, `Unrelated history`, `Vague opinions`]
            }),
            ({d}) => ({
                question: `Which phrase best describes the goal of ${d}?`,
                correct: `To model, understand, or solve problems using ${d} methods`,
                distractors: [`To create paintings`, `To bake foods`, `To program hardware`]
            }),
            ({d}) => ({
                question: `A simple true/false: ${d} is primarily concerned with core concepts and methods.`,
                correct: `True`,
                distractors: [`False`, `Sometimes`, `Cannot say`]
            })
        ];

        const out = [];
        for (let i = 0; i < count; i++) {
            if (level === 'scenario') {
                const short = topics[i % topics.length] ? topics[i % topics.length].split(':').slice(1).join(':').trim() : domain;
                const q = `Scenario: Given a real-world situation involving ${short || domain}, what would be an appropriate approach?`;
                const options = shuffle([
                    `Use ${domain} principles to analyze and decide`,
                    `Ignore the ${domain} aspects`,
                    `A purely opinion-based response`,
                    `An unrelated technical procedure`
                ]).slice(0,4);
                const correctIndex = options.findIndex(o => o.startsWith('Use'));
                out.push({ question: q, options, correctIndex, marks: 5 });
                continue;
            }

            // Basic / Advanced use templates; advanced will be similar but marked higher
            const tpl = templatesBasic[i % templatesBasic.length];
            const built = tpl({ d: domain });
            const options = shuffle([built.correct, ...built.distractors]).slice(0,4);
            const correctIndex = options.indexOf(built.correct);
            const marks = level === 'basic' ? 1 : level === 'advanced' ? 2 : 5;
            out.push({ question: built.question, options, correctIndex, marks });
        }
        return out;
    };

    const startTest = (which) => {
        if (which === 'basic' && !basicUnlocked) return;
        if (which === 'advanced' && !advancedUnlocked) return;
        if (which === 'scenario' && !scenarioUnlocked) return;

        setRunningExam(which);
        setCurrentIdx(0);
        setAnswers([]);

        if (which === 'basic') {
            setQuestions(generateQuestions('basic', topic, 10));
        } else if (which === 'advanced') {
            setQuestions(generateQuestions('advanced', topic, 10));
        } else if (which === 'scenario') {
            const n = Math.min(2, Math.max(1, Math.floor(Math.random() * 2) + 1));
            setQuestions(generateQuestions('scenario', topic, n));
        }
    };

    const submitAnswer = (optionIndex) => {
        setAnswers(prev => {
            const copy = [...prev];
            copy[currentIdx] = optionIndex;
            return copy;
        });
        if (currentIdx < questions.length - 1) {
            setCurrentIdx(currentIdx + 1);
        } else {
            finishExam();
        }
    };

    const finishExam = () => {
        // calculate score
        let totalMarks = 0;
        let scored = 0;
        questions.forEach((q, idx) => {
            totalMarks += q.marks;
            if (answers[idx] === q.correctIndex) scored += q.marks;
        });
        const percent = totalMarks === 0 ? 0 : Math.round((scored / totalMarks) * 100);

        // handle unlocking
        if (runningExam === 'basic') {
            if (percent >= 70) {
                setAdvancedUnlocked(true);
                // auto-start advanced
                setTimeout(() => startTest('advanced'), 600);
            }
        } else if (runningExam === 'advanced') {
            if (percent >= 50) {
                setScenarioUnlocked(true);
                setTimeout(() => startTest('scenario'), 600);
            }
        }

        // show simple result (could be extended to persist to backend)
        alert(`You scored ${percent}% on the ${runningExam} test.`);

        // reset running exam if scenario finished or leave unlocked state
        if (runningExam === 'scenario') {
            setRunningExam(null);
            setQuestions([]);
            setAnswers([]);
            setCurrentIdx(0);
        }
    };

    const todaysTasks = location && location.state && location.state.todaysTasks ? location.state.todaysTasks : [];

    return (
        <section className="assessments-section">
            <h2 className="section-title">Tests Unlock as You Master</h2>

            <div className="tests-grid">
                <TestCard
                    title="Basic Test"
                    icon={FileText}
                    status="Available"
                    questions={10}
                    time="15 min"
                    passScore="70%+"
                    color="var(--color-soft-teal)"
                    onStart={() => navigate('/assessment-test', { state: { level: 'basic', todaysTasks } })}
                />
                <TestCard
                    title="Advanced Test"
                    icon={Brain}
                    status={advancedUnlocked ? 'Available' : 'Locked'}
                    requirement="Complete Basic 70%+"
                    progress={advancedUnlocked ? '1/1 ✓' : '0/1'}
                    color="var(--color-soft-yellow)"
                    isLocked={!advancedUnlocked}
                    onStart={() => navigate('/assessment-test', { state: { level: 'advanced', todaysTasks } })}
                />
                <TestCard
                    title="Scenario Test"
                    icon={Target}
                    status={scenarioUnlocked ? 'Available' : 'Coming Soon'}
                    requirement="Complete Advanced 50%+"
                    progress={scenarioUnlocked ? '1/1 ✓' : '0/1'}
                    color="var(--color-soft-pink-light)"
                    isLocked={!scenarioUnlocked}
                    onStart={() => navigate('/assessment-test', { state: { level: 'scenario', todaysTasks } })}
                />
            </div>

            {runningExam && questions.length > 0 && (
                <div className="exam-runner">
                    <h3>{runningExam.toUpperCase()} TEST — Question {currentIdx + 1}/{questions.length}</h3>
                    <div className="question-box">
                        <p className="q-text">{questions[currentIdx].question}</p>
                        <div className="options">
                            {questions[currentIdx].options.map((opt, idx) => (
                                <button key={idx} className="option-btn" onClick={() => submitAnswer(idx)}>
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="results-table-container">
                <h3>Last 3 Results</h3>
                <table className="results-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Topic</th>
                            <th>Score</th>
                            <th>Time</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Today, 10:30 AM</td>
                            <td>{topic.split('\n')[0] || 'Bio: Cell Structure'}</td>
                            <td className="score-cell">85%</td>
                            <td>12m</td>
                            <td><span className="sc-status pass">Passed</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default AssessmentsSection;
