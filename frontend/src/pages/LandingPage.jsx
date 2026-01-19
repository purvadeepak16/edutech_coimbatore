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

    const { login, signUp } = useAuth();

    async function handleSubmit(e) {
        e.preventDefault();

        if (!email || !password || (!isLogin && !username) || (!isLogin && !role)) {
            return setError('Please fill in all fields');
        }

        try {
            setError('');
            setLoading(true);
            if (isLogin) {
                await login(email, password);
            } else {
                await signUp(email, password, username, role);
            }
        } catch (err) {
            console.error(err);
            setError('Failed to ' + (isLogin ? 'sign in' : 'create an account') + ': ' + err.message);
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
                    <div className="floating-asset asset-1">
                        <BookOpen size={20} />
                        <span>Books</span>
                    </div>
                    <div className="floating-asset asset-2">
                        <Users size={20} />
                        <span>Learn</span>
                    </div>
                    <div className="floating-asset asset-3">
                        <ArrowRight size={20} />
                        <span>Listen</span>
                    </div>
                </div>

                <div className="auth-card">
                    <div className="auth-header">
                        <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                        <p>{isLogin ? 'Enter your details to access your dashboard' : 'Join thousands of students today'}</p>
                    </div>

                    <form className="auth-form" onSubmit={handleSubmit}>
                        {error && <div className="auth-error">{error}</div>}
                        {!isLogin && (
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
                        )}
                        {!isLogin && (
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
                        )}
                        <div className="input-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                placeholder="monark@studysync.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
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
                            />
                        </div>

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
                                }}
                            >
                                {isLogin ? 'Sign Up' : 'Log In'}
                            </button>
                        </div>
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