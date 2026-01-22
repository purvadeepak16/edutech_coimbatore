import React, { useState } from 'react';

import { ArrowRight, BookOpen, Star, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './LandingPage.css';

const LandingPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [role, setRole] = useState('Student');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [gender, setGender] = useState('');
    const [learningPreference, setLearningPreference] = useState('');
    // preferred time ranges stored as array of {start,end} in 24-hour format
    const [preferredTimeRanges, setPreferredTimeRanges] = useState([{ start: '18:00', end: '19:00' }]);
    // Mentor-specific: array of { subject: string, levels: string[] }
    const [mentorSpecializations, setMentorSpecializations] = useState([{ subject: '', levels: [] }]);
    const [signupStep, setSignupStep] = useState(1);



    const { login, signUp } = useAuth();

async function handleSubmit(e) {
    e.preventDefault();

    const timeSlotsArray = (preferredTimeRanges || [])
        .map(r => (r && r.start ? `${r.start}-${r.end || r.start}` : null))
        .filter(Boolean);

    if (!email || !password) return setError('Please provide email and password');

    if (!isLogin) {
        if (!username || !role || !gender) return setError('Please fill in all required fields');
        if (role === 'Student' && (!learningPreference || timeSlotsArray.length === 0)) return setError('Please fill in student preferences and time slots');
        if (role === 'Mentor') {
            const hasSpec = (mentorSpecializations || []).some(s => (s.subject && s.subject.trim()) || (s.levels && s.levels.length > 0));
            if (!hasSpec) return setError('Please provide at least one specialization with subject or level');
        }
    }

    try {
        setError('');
        setLoading(true);

        if (isLogin) {
            await login(email, password);
        } else {
            await signUp(
                email,
                password,
                username,
                role,
                gender,
                learningPreference,
                timeSlotsArray,
                mentorSpecializations
            );
        }
    } catch (err) {
        setError(
            'Failed to ' +
            (isLogin ? 'sign in' : 'create an account') +
            ': ' + err.message
        );
    } finally {
        setLoading(false);
    }
}


    return (
        <div className="landing-page">
            <nav className="landing-nav">
                <div className="landing-logo">StudySync</div>
                <div className="nav-links">
                    <a href="#">Features</a>
                    <a href="#">Testimonials</a>
                    <a href="#">Pricing</a>
                </div>
            </nav>

            <div className="landing-content">
                <div className="hero-section">
                    <h1>Welcome to the world of <span className="highlight">Knowledge</span></h1>
                    <p className="hero-sub">A different approach to learning is a different vision of life. Start your journey with StudySync today.</p>

                    <div className="hero-stats">
                        <div className="stat-pill">
                            <Users size={16} /> 10k+ Students
                        </div>
                        <div className="stat-pill">
                            <Star size={16} /> 4.9/5 Rating
                        </div>
                    </div>

                    <button className="cta-btn" onClick={() => {
                        document.querySelector('.auth-card').scrollIntoView({ behavior: 'smooth' });
                    }}>
                        Get started <ArrowRight size={18} />
                    </button>

                    {/* Decorative Floating Assets */}
                    <div className="floating-asset asset-2">
                        <Users size={20} />
                        <span>Learn</span>
                    </div>
                </div>

                <div className="auth-card">
                    <div className="auth-header">
                        <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                        <p>{isLogin ? 'Enter your details to access your dashboard' : 'Join thousands of students today'}</p>
                    </div>

                    <form className="auth-form" onSubmit={handleSubmit}>
                        {error && <div className="auth-error">{error}</div>}
                        {!isLogin && signupStep === 1 && (
                            <div>
                                <div className="input-group">
                                    <label>Username</label>
                                    <input
                                        type="text"
                                        placeholder="Enter your name"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label>I am a...</label>
                                    <select
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        className="auth-select"
                                        required
                                    >
                                        <option value="Student">Student</option>
                                        <option value="Mentor">Mentor</option>
                                    </select>
                                </div>

                                <div style={{marginTop:12}}>
                                    <button type="button" className="auth-submit-btn" onClick={() => setSignupStep(2)}>Next</button>
                                </div>
                            </div>
                        )}

                        {!isLogin && signupStep === 2 && (
                            <div>
                                <div className="input-group">
                                    <label>Gender</label>
                                    <select
                                        value={gender}
                                        onChange={(e) => setGender(e.target.value)}
                                        className="auth-select"
                                        required
                                    >
                                        <option value="">Select gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                {role === 'Student' && (
                                    <>
                                        <div className="input-group">
                                            <label>How do you understand concepts?</label>
                                            <select
                                                value={learningPreference}
                                                onChange={(e) => setLearningPreference(e.target.value)}
                                                className="auth-select"
                                                required
                                            >
                                                <option value="">Select preference</option>
                                                <option value="Reading Notes">By reading notes</option>
                                                <option value="Listening Podcasts">By listening to podcasts</option>
                                                <option value="Visual Mind Maps">By looking at visual flow charts / mind maps</option>
                                            </select>
                                        </div>

                                        <div className="input-group">
                                            <label>Preferred Time Slots (24-hour)</label>
                                            <div>
                                                {(preferredTimeRanges || []).map((r, idx) => (
                                                    <div key={idx} style={{display:'flex',gap:8,alignItems:'center',marginBottom:8}}>
                                                        <input type="time" value={r.start} onChange={e=>{
                                                            const copy = [...preferredTimeRanges]; copy[idx] = {...copy[idx], start: e.target.value}; setPreferredTimeRanges(copy);
                                                        }} />
                                                        <span>to</span>
                                                        <input type="time" value={r.end} onChange={e=>{
                                                            const copy = [...preferredTimeRanges]; copy[idx] = {...copy[idx], end: e.target.value}; setPreferredTimeRanges(copy);
                                                        }} />
                                                        <button type="button" onClick={()=>{
                                                            const copy = preferredTimeRanges.filter((_,i)=>i!==idx); setPreferredTimeRanges(copy.length?copy:[{start:'18:00',end:'19:00'}]);
                                                        }}>Remove</button>
                                                    </div>
                                                ))}
                                                <div><button type="button" onClick={()=>setPreferredTimeRanges([...preferredTimeRanges,{start:'18:00',end:'19:00'}])}>Add Slot</button></div>
                                                <small style={{ color: '#777' }}>Use 24-hour time; add multiple slots if needed</small>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {role === 'Mentor' && (
                                    <>
                                        <div className="input-group">
                                            <label>Specializations</label>
                                            <div style={{display:'flex',flexDirection:'column',gap:8}}>
                                                {mentorSpecializations.map((spec, sIdx) => (
                                                    <div key={sIdx} style={{border:'1px solid #eee',padding:8,borderRadius:6}}>
                                                        <div style={{display:'flex',gap:8,alignItems:'center'}}>
                                                            <input
                                                                placeholder="Subject (e.g. Math)"
                                                                value={spec.subject}
                                                                onChange={e=>{
                                                                    const copy = [...mentorSpecializations]; copy[sIdx] = {...copy[sIdx], subject: e.target.value}; setMentorSpecializations(copy);
                                                                }}
                                                            />
                                                            <button type="button" onClick={()=>{
                                                                const copy = mentorSpecializations.filter((_,i)=>i!==sIdx); setMentorSpecializations(copy.length?copy:[{subject:'',levels:[]}]);
                                                            }}>Remove</button>
                                                        </div>
                                                        <div style={{marginTop:8}}>
                                                            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                                                                {['School','UG','Exam'].map(l=> (
                                                                    <label key={l} style={{display:'inline-flex',alignItems:'center',gap:6}}>
                                                                        <input type="checkbox" checked={(spec.levels||[]).includes(l)} onChange={()=>{
                                                                            const copy = [...mentorSpecializations];
                                                                            const levels = new Set(copy[sIdx].levels || []);
                                                                            if (levels.has(l)) levels.delete(l); else levels.add(l);
                                                                            copy[sIdx] = {...copy[sIdx], levels: Array.from(levels)};
                                                                            setMentorSpecializations(copy);
                                                                        }} /> {l}
                                                                    </label>
                                                                ))}
                                                                <input placeholder="Add custom level (press Enter)" onKeyDown={e=>{ if(e.key==='Enter'){ e.preventDefault(); const v=e.target.value.trim(); if(v){ const copy = [...mentorSpecializations]; const levels = new Set(copy[sIdx].levels || []); levels.add(v); copy[sIdx] = {...copy[sIdx], levels: Array.from(levels)}; setMentorSpecializations(copy); e.target.value=''; } } }} />
                                                            </div>
                                                            <small style={{color:'#777'}}>Choose level(s) for this subject</small>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div>
                                                    <button type="button" onClick={()=>setMentorSpecializations(prev=>[...prev,{subject:'',levels:[]}])}>Add Subject</button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="input-group">
                                            <label>Availability Slots (24-hour)</label>
                                            <div>
                                                {(preferredTimeRanges || []).map((r, idx) => (
                                                    <div key={idx} style={{display:'flex',gap:8,alignItems:'center',marginBottom:8}}>
                                                        <input type="time" value={r.start} onChange={e=>{
                                                            const copy = [...preferredTimeRanges]; copy[idx] = {...copy[idx], start: e.target.value}; setPreferredTimeRanges(copy);
                                                        }} />
                                                        <span>to</span>
                                                        <input type="time" value={r.end} onChange={e=>{
                                                            const copy = [...preferredTimeRanges]; copy[idx] = {...copy[idx], end: e.target.value}; setPreferredTimeRanges(copy);
                                                        }} />
                                                        <button type="button" onClick={()=>{
                                                            const copy = preferredTimeRanges.filter((_,i)=>i!==idx); setPreferredTimeRanges(copy.length?copy:[{start:'18:00',end:'19:00'}]);
                                                        }}>Remove</button>
                                                    </div>
                                                ))}
                                                <div><button type="button" onClick={()=>setPreferredTimeRanges([...preferredTimeRanges,{start:'18:00',end:'19:00'}])}>Add Slot</button></div>
                                                <small style={{ color: '#777' }}>You can change availability later</small>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Back button relocated to just above Sign Up button for better UX */}
                            </div>
                        )}
                        {/* Duplicate blocks removed; signup step fields are above */}



                        {(isLogin || (!isLogin && signupStep === 2)) && (
                            <>
                                <div className="input-group">
                                    <label>Email Address</label>
                                    <input
                                        type="email"
                                        placeholder="monark@studysync.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        style={{ transition: 'none' }}
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Password</label>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        style={{ transition: 'none' }}
                                    />
                                </div>

                                {/* Back button moved underneath Password field when on Step 2 */}
                                {!isLogin && signupStep === 2 && (
                                    <div style={{display:'flex',gap:8, marginTop:8}}>
                                        <button type="button" className="auth-submit-btn" onClick={()=>setSignupStep(1)}>Back</button>
                                    </div>
                                )}

                                <button className="auth-submit-btn" type="submit" disabled={loading}>
                                    {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
                                </button>

                                <div className="auth-footer">
                                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                                    <button
                                        type="button"
                                        className="link-btn"
                                        onClick={() => {
                                            setIsLogin(!isLogin);
                                            setError('');
                                            setSignupStep(1);
                                        }}
                                    >
                                        {isLogin ? 'Sign Up' : 'Log In'}
                                    </button>
                                </div>
                            </>
                        )}
                    </form>
                </div>
            </div>

            <div className="features-section" id="features">
                <h2>Why Choose StudySync?</h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="f-icon">🧠</div>
                        <h3>Adaptive Learning</h3>
                        <p>Our algorithms tailor your study plan based on your strengths and weaknesses.</p>
                    </div>
                    <div className="feature-card">
                        <div className="f-icon">💡</div>
                        <h3>Instant Doubts</h3>
                        <p>Get AI-powered answers to your questions instantly, 24/7.</p>
                    </div>
                    <div className="feature-card">
                        <div className="f-icon">👥</div>
                        <h3>Study Groups</h3>
                        <p>Connect with peers, share notes, and stay motivated together.</p>
                    </div>
                </div>
            </div>

            <div className="testimonials-section" id="testimonials">
                <h2>Student Success Stories</h2>
                <div className="testimonials-grid">
                    <div className="testimonial-card">
                        <p>"StudySync helped me boost my grades by 30% in just two months!"</p>
                        <div className="t-user">- Priya S., Grade 12</div>
                    </div>
                    <div className="testimonial-card">
                        <p>"The visual learning mode is a game changer for Biology concepts."</p>
                        <div className="t-user">- Rahul K., NEET Aspirant</div>
                    </div>
                    <div className="testimonial-card">
                        <p>"I love the gamification. Maintaining my streak keeps me studying every day."</p>
                        <div className="t-user">- Ananya M., Grade 11</div>
                    </div>
                </div>
            </div>

            {/* Decorative Elements */}
            <div className="blob blob-1"></div>
            <div className="blob blob-2"></div>
        </div>
    );
};

export default LandingPage;