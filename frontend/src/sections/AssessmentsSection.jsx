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

        // Templates for BASIC level - recall and understanding
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

        // Templates for ADVANCED level - application and analysis
        const templatesAdvanced = [
            ({d}) => ({
                question: `If you were implementing a ${d} solution in a production environment, which factor would be MOST critical to consider first?`,
                correct: `Scalability and performance optimization of ${d} algorithms`,
                distractors: [
                    `The color scheme of the user interface`,
                    `The brand of the development computer`,
                    `The location of the office`
                ]
            }),
            ({d}) => ({
                question: `A company needs to solve a problem using ${d}. They have limited data and tight deadlines. What approach would you recommend?`,
                correct: `Use a lightweight ${d} model with transfer learning to leverage pre-trained knowledge`,
                distractors: [
                    `Wait for more data to arrive before starting`,
                    `Use the most complex ${d} architecture regardless of constraints`,
                    `Abandon ${d} and use random guessing`
                ]
            }),
            ({d}) => ({
                question: `When comparing two ${d} approaches for the same problem, which evaluation metric would provide the most comprehensive insight?`,
                correct: `A combination of accuracy, precision, recall, and F1-score along with computational cost`,
                distractors: [
                    `Only the training time`,
                    `The number of lines of code`,
                    `The popularity of the method on social media`
                ]
            }),
            ({d}) => ({
                question: `You notice your ${d} model performs well on training data but poorly on new data. What is the most likely issue and solution?`,
                correct: `Overfitting - implement regularization, cross-validation, or gather more diverse training data`,
                distractors: [
                    `The model is too simple - make it more complex`,
                    `This is normal behavior and requires no action`,
                    `The testing data must be corrupted`
                ]
            }),
            ({d}) => ({
                question: `In a multi-stage ${d} pipeline, which design principle would best ensure maintainability and debugging ease?`,
                correct: `Modular design with clear interfaces, logging at each stage, and unit tests`,
                distractors: [
                    `Write all code in a single function for simplicity`,
                    `Avoid documentation to save time`,
                    `Hard-code all parameters for consistency`
                ]
            }),
            ({d}) => ({
                question: `A client asks you to explain how your ${d} solution makes decisions. What approach demonstrates both technical understanding and communication skill?`,
                correct: `Use visualization techniques and simplified analogies while being transparent about limitations`,
                distractors: [
                    `Refuse to explain citing proprietary algorithms`,
                    `Provide only mathematical equations without context`,
                    `Tell them it's magic and they wouldn't understand`
                ]
            }),
            ({d}) => ({
                question: `Two ${d} models have similar accuracy but different computational requirements. How should you decide which to deploy?`,
                correct: `Evaluate based on production constraints: latency requirements, available compute resources, and maintenance costs`,
                distractors: [
                    `Always choose the faster one regardless of accuracy`,
                    `Deploy both and randomly choose between them`,
                    `Choose based on which one has more parameters`
                ]
            }),
            ({d}) => ({
                question: `When integrating ${d} into an existing system, what consideration is often overlooked but critical?`,
                correct: `Data quality, preprocessing pipelines, and continuous monitoring in production`,
                distractors: [
                    `The font used in documentation`,
                    `The specific IDE the developers prefer`,
                    `Whether the team likes ${d} or not`
                ]
            }),
            ({d}) => ({
                question: `Your ${d} system needs to handle concept drift over time. What strategy would be most effective?`,
                correct: `Implement continuous learning with periodic retraining, monitoring for performance degradation, and version control`,
                distractors: [
                    `Train once and never update the model`,
                    `Completely retrain from scratch daily regardless of performance`,
                    `Ignore changes and hope the model adapts automatically`
                ]
            }),
            ({d}) => ({
                question: `Given limited computational resources, how would you optimize a ${d} workflow for better efficiency?`,
                correct: `Profile the code, identify bottlenecks, use efficient data structures, and consider distributed computing for parallelizable tasks`,
                distractors: [
                    `Buy more computers without analyzing the problem`,
                    `Remove all features to make it faster`,
                    `Run the code multiple times hoping it gets faster`
                ]
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

            // Choose template based on level
            const templates = level === 'advanced' ? templatesAdvanced : templatesBasic;
            const tpl = templates[i % templates.length];
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

        // handle unlocking - Basic requires 60%+, Advanced requires 50%+
        if (runningExam === 'basic') {
            if (percent >= 60) {
                setAdvancedUnlocked(true);
                alert(`🎉 Basic Test Passed with ${percent}%! Advanced Test Unlocked.`);
                // auto-start advanced
                setTimeout(() => startTest('advanced'), 600);
            } else {
                alert(`Basic Test Score: ${percent}%. You need 60% or higher to unlock Advanced Test.`);
            }
        } else if (runningExam === 'advanced') {
            if (percent >= 50) {
                setScenarioUnlocked(true);
                alert(`🎉 Advanced Test Passed with ${percent}%! Scenario Test Unlocked.`);
                setTimeout(() => startTest('scenario'), 600);
            } else {
                alert(`Advanced Test Score: ${percent}%. You need 50% or higher to unlock Scenario Test.`);
            }
        } else {
            alert(`You scored ${percent}% on the ${runningExam} test.`);
        }

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
                    passScore="60%+"
                    color="var(--color-soft-teal)"
                    onStart={() => navigate('/assessment-test', { state: { level: 'basic', todaysTasks } })}
                />
                <TestCard
                    title="Advanced Test"
                    icon={Brain}
                    status={advancedUnlocked ? 'Available' : 'Locked'}
                    requirement="Complete Basic 60%+"
                    questions={10}
                    time="20 min"
                    passScore="50%+"
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
