// export default LandingPage

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Sparkles, CheckCircle, ArrowRight, Play, 
  Users, Shield, Bell, Mic, Lock,
  Zap, BarChart3, ShieldCheck, Layers, Layout, Globe 
} from 'lucide-react'
import "./LandingPage.css"

function LandingPage() {
  const navigate = useNavigate()
  
  // 3D Tilt Effect State for the phone mockup
  const [rotation, setRotation] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e) => {
    const { innerWidth, innerHeight } = window
    const x = (e.clientX - innerWidth / 2) / 25
    const y = (e.clientY - innerHeight / 2) / 25
    setRotation({ x: -y, y: x })
  }

  return (
    <div className="landing-container" onMouseMove={handleMouseMove}>
      
      {/* --- NAVBAR --- */}
      <nav className="landing-nav">
        <div className="logo-area">
          <div className="logo-icon">ST</div>
          <span className="logo-text">ShikshaSaarthi</span>
        </div>
        
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#demo">How it works</a>
          <a href="#pricing">Pricing</a>
        </div>

        <div className="auth-buttons">
          <button className="btn-signin" onClick={() => navigate('/login')}>
            Sign In
          </button>
          <button className="btn-signup" onClick={() => navigate('/login')}>
            Get Started
          </button>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <header className="hero-section">
        
        {/* LEFT TEXT */}
        <div className="hero-text">
          <div className="badge-pill">
            <Sparkles size={14} fill="#f97316" stroke="none"/>
            <span>AI Classroom Portal</span>
          </div>
          <h1>Focus on Teaching, <br/><span className="highlight">We Handle the Rest.</span></h1>
          <p className="hero-sub">
            The all-in-one portal for offline classrooms. Unique IDs for every student, 
            AI teaching assistance, and automated distraction monitoring.
          </p>
          
          <div className="hero-actions">
            <button className="btn-cta" onClick={() => navigate('/login')}>
              Launch Class <ArrowRight size={18} />
            </button>
            <button className="btn-secondary">
              <Play size={18} fill="currentColor" /> Watch Demo
            </button>
          </div>

          <div className="trust-badges">
            <div className="avatars">
               <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User"/>
               <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka" alt="User"/>
               <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Mark" alt="User"/>
            </div>
            <span>Used by 500+ Institutions</span>
          </div>
        </div>

        {/* RIGHT 3D MOBILE DEMO */}
        <div className="hero-visual">
          <div 
            className="phone-mockup-3d"
            style={{ 
              transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)` 
            }}
          >
            <div className="phone-frame">
              <div className="phone-notch"></div>
              <div className="phone-screen">
                
                {/* --- AUTOMATIC SCROLLING CONTENT --- */}
                <div className="scrolling-wrapper">
                  
                  {/* --- SCREEN 1: CLASS HEADER --- */}
                  <div className="mock-screen-section">
                     <div className="mock-header">
                        <div className="status-dot"></div>
                        <span>Live Session: CS-101</span>
                     </div>
                     <div className="mock-card info">
                        <h4>Subject: React Hooks</h4>
                        <p>Code: <strong>X7K-9P2</strong></p>
                        <div className="progress-bar"><div className="fill" style={{width: '85%'}}></div></div>
                        <span className="tiny-text">34/40 Students Joined</span>
                     </div>
                  </div>

                  {/* --- SCREEN 2: AI ASSISTANT --- */}
                  <div className="mock-screen-section">
                     <h5 className="section-title"><Sparkles size={12}/> AI Assistant</h5>
                     <div className="mock-chat">
                        <div className="chat-bubble bot">
                            Teacher: "Explain useEffect simply."
                        </div>
                        <div className="chat-bubble user">
                            AI: "It's like a side-effect manager. It runs code *after* the render is committed..."
                        </div>
                     </div>
                  </div>

                  {/* --- SCREEN 3: DISTRACTION ALERTS --- */}
                  <div className="mock-screen-section">
                     <h5 className="section-title"><Shield size={12}/> Monitoring</h5>
                     <div className="mock-alert-card">
                        <Bell size={16} className="alert-icon"/>
                        <div>
                           <strong>Tab Switch Detected</strong>
                           <p>Student ID: Rahul_101</p>
                        </div>
                     </div>
                     <div className="mock-alert-card warning">
                        <Mic size={16} className="alert-icon"/>
                        <div>
                           <strong>High Noise Level</strong>
                           <p>Row 3 - Disturbance detected</p>
                        </div>
                     </div>
                  </div>

                  {/* --- SCREEN 4: ATTENDANCE --- */}
                  <div className="mock-screen-section">
                     <h5 className="section-title"><CheckCircle size={12}/> Auto-Attendance</h5>
                     <div className="mock-list">
                        <div className="mock-item"><span>Rahul (101)</span><span className="green">Present</span></div>
                        <div className="mock-item"><span>Anita (102)</span><span className="green">Present</span></div>
                        <div className="mock-item"><span>Simran (103)</span><span className="red">Late</span></div>
                     </div>
                  </div>
                  
                  {/* --- DUPLICATE CONTENT FOR INFINITE LOOP --- */}
                  <div className="mock-screen-section">
                     <div className="mock-header">
                        <div className="status-dot"></div>
                        <span>Live Session: CS-101</span>
                     </div>
                     <div className="mock-card info">
                        <h4>Subject: React Hooks</h4>
                        <p>Code: <strong>X7K-9P2</strong></p>
                        <div className="progress-bar"><div className="fill" style={{width: '85%'}}></div></div>
                     </div>
                  </div>

                </div>

                {/* Static Bottom Bar */}
                <div className="phone-bottom-bar">
                   <div className="bar-icon active"><Lock size={16}/></div>
                   <div className="bar-icon"><Mic size={16}/></div>
                   <div className="bar-icon"><Users size={16}/></div>
                </div>

              </div>
            </div>
            {/* Phone Shadow & Floating Elements */}
            <div className="phone-shadow"></div>
            <div className="float-card card-1"><CheckCircle size={16}/> Attendance Auto-Marked</div>
            <div className="float-card card-2"><Shield size={16}/> Tab Switch Alert!</div>
          </div>
        </div>
      </header>

      {/* --- INITIAL FEATURES GRID --- */}
      <section className="features-section" id="features">
        <h2>Built for the Modern <br/>Offline Classroom.</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="f-icon orange"><Sparkles size={24}/></div>
            <h3>Context-Aware AI</h3>
            <p>The AI remembers your last class and suggests continuation points automatically.</p>
          </div>
          <div className="feature-card">
            <div className="f-icon blue"><Lock size={24}/></div>
            <h3>Locked Interface</h3>
            <p>Students cannot switch tabs or open other apps. Total focus ensured.</p>
          </div>
          <div className="feature-card">
            <div className="f-icon green"><Mic size={24}/></div>
            <h3>Lecture Analysis</h3>
            <p>We analyze your lecture duration and generate structured notes instantly.</p>
          </div>
        </div>
      </section>

      {/* --- SYSTEM ARCHITECTURE SECTION (Steps 4-8) --- */}
      
      <section className="architecture-section" id="demo">
        <div className="section-header">
          <span className="badge-pill-small">Technical Workflow</span>
          <h2>A Multi-Layered Approach <br/>to Classroom Focus.</h2>
        </div>

        <div className="arch-container">
          {/* Row 1: Disturbance & Lock */}
          <div className="arch-row">
            <div className="arch-card-extended">
              <div className="arch-icon-wrapper blue">
                <Mic size={24} />
              </div>
              <div className="arch-info">
                <h4>04. Noise Detection</h4>
                <p>Local processing monitors chatter and background noise. Data is converted to alerts instantly without storing audio.</p>
                <span className="privacy-tag">Privacy Secured</span>
              </div>
            </div>

            <div className="arch-card-extended">
              <div className="arch-icon-wrapper orange">
                <Layers size={24} />
              </div>
              <div className="arch-info">
                <h4>05. Activity Monitoring</h4>
                <p>Detects tab-switching, unauthorized app launches, or background media playback with soft-warning systems.</p>
              </div>
            </div>
          </div>

          {/* Row 2: Content & Quizzes */}
          <div className="arch-row">
            <div className="arch-card-extended">
              <div className="arch-icon-wrapper green">
                <Layout size={24} />
              </div>
              <div className="arch-info">
                <h4>06. Content Control</h4>
                <p>Uniform learning pace by restricting student screens to teacher-provided PDFs, slides, or whiteboard only.</p>
              </div>
            </div>

            <div className="arch-card-extended">
              <div className="arch-icon-wrapper purple">
                <Zap size={24} />
              </div>
              <div className="arch-info">
                <h4>07. Live Engagement</h4>
                <p>Push instant MCQs and concept-check questions directly to devices to maintain high student attention levels.</p>
              </div>
            </div>
          </div>

          {/* Full Width: Reports */}
          <div className="arch-card-featured">
            <div className="arch-featured-content">
              <div className="arch-icon-wrapper gold">
                <BarChart3 size={32} />
              </div>
              <div>
                <h3>08. Post-Class Analytics & Reports</h3>
                <p>Comprehensive logs for teachers including individual focus scores, participation data, and noise heatmaps—all generated automatically at session end.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- PROFESSIONAL FOOTER --- */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand-section">
            <div className="logo-area">
              <div className="logo-icon">ST</div>
              <span className="logo-text">ShikshaSaarthi</span>
            </div>
            <p className="footer-desc">
              Bridging the gap between offline traditional teaching and modern digital control.
            </p>
            <div className="footer-trust">
              <div className="trust-item"><ShieldCheck size={16}/> GDPR Compliant</div>
              <div className="trust-item"><Lock size={16}/> 256-bit Encrypted</div>
            </div>
          </div>

          <div className="footer-links-grid">
            <div className="footer-col">
              <h5>Platform</h5>
              <a href="#features">Teacher Portal</a>
              <a href="#features">Student Lock-App</a>
              <a href="#pricing">Institutions</a>
            </div>
            <div className="footer-col">
              <h5>Company</h5>
              <a href="#privacy">Privacy Policy</a>
              <a href="#ethical">Ethical Design</a>
              <a href="#security">Security Lab</a>
            </div>
            <div className="footer-col">
              <h5>Contact</h5>
              <a href="#help">Help Center</a>
              <a href="#sales">Contact Sales</a>
              <a href="#partners">Partner Program</a>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>© 2026 ShikshaSaarthi. Made for focused learning.</p>
          <div className="footer-lang">
            <Globe size={14}/> <span>English (US)</span>
          </div>
        </div>
      </footer>

    </div>
  )
}

export default LandingPage
