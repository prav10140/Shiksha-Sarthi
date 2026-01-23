"use client"

import React, { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Stars, Sphere, MeshDistortMaterial } from "@react-three/drei"
import { generateVoiceChat } from "../utils/groq"
import { Mic, ChevronLeft, StopCircle, Loader2, Globe } from "lucide-react"
import "./AITutorPage.css"

/* --- INTERNAL 3D COMPONENT --- */
function VoiceOrb({ state }) {
  const meshRef = useRef()

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.2
      meshRef.current.rotation.y += delta * 0.3
    }
  })

  const getConfig = () => {
    switch (state) {
      case 'listening': return { color: "#2dd4bf", speed: 2.5, distort: 0.5, scale: 2.5 } 
      case 'thinking':  return { color: "#c084fc", speed: 6.0, distort: 0.8, scale: 2.0 } 
      case 'speaking':  return { color: "#f97316", speed: 2.0, distort: 0.6, scale: 2.8 } 
      default:          return { color: "#64748b", speed: 1.0, distort: 0.3, scale: 2.2 } 
    }
  }

  const { color, speed, distort, scale } = getConfig()

  return (
    <Sphere ref={meshRef} args={[1, 100, 100]} scale={scale}>
      <MeshDistortMaterial
        color={color}
        attach="material"
        distort={distort}
        speed={speed}
        roughness={0.1}  
        metalness={0.5}  
        emissive={color} 
        emissiveIntensity={0.2}
      />
    </Sphere>
  )
}

/* --- MAIN PAGE COMPONENT --- */
function AITutorPage() {
  const navigate = useNavigate()
  
  const [mode, setMode] = useState("idle") 
  const [transcript, setTranscript] = useState("") 
  const [messages, setMessages] = useState([]) 
  const [availableVoices, setAvailableVoices] = useState([]) 
  const [language, setLanguage] = useState("en-US") 
  
  // Refs
  const isSessionActive = useRef(false)
  const recognitionRef = useRef(null)
  const synthRef = useRef(window.speechSynthesis)
  const latestTranscript = useRef("")

  // 1. LOAD VOICES ON MOUNT
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        console.log("Voices loaded:", voices.length);
        setAvailableVoices(voices);
      }
    };
    
    // Chrome/Edge load voices asynchronously
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices(); 

    return () => {
      window.speechSynthesis.cancel();
    }
  }, []);

  // 2. INITIALIZE & MANAGE SPEECH RECOGNITION
  // We put this in a separate useEffect that depends on 'language'
  useEffect(() => {
    // Cleanup previous instance if exists
    if (recognitionRef.current) {
      recognitionRef.current.onend = null; // Prevent loops during switch
      recognitionRef.current.stop();
    }

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false; 
      recognition.interimResults = true;
      recognition.lang = language; // <--- DYNAMIC LANGUAGE HERE

      recognition.onstart = () => setMode("listening");
      
      recognition.onresult = (event) => {
        const current = event.resultIndex;
        const text = event.results[current][0].transcript;
        setTranscript(text);
        latestTranscript.current = text; 
      };

      recognition.onend = () => {
        // Only restart if the session is logically active
        if (isSessionActive.current) {
          const finalText = latestTranscript.current.trim();
          if (finalText.length > 0) {
            handleUserMessage(finalText);
          } else {
            // If silence, restart listening immediately
            try { recognition.start(); } catch(e) {}
          }
        } else {
          setMode("idle");
        }
      };

      recognitionRef.current = recognition;

      // If we were already active (e.g. user switched lang mid-chat), restart immediately
      if (isSessionActive.current) {
        try { recognition.start(); } catch(e) {}
      }
    }
  }, [language]); // <--- Re-run this effect when language changes

  // 3. SEND TO AI
  const handleUserMessage = async (userText) => {
    setMode("thinking");
    setTranscript(""); 
    latestTranscript.current = ""; 

    // Inject system instruction for Language
    const systemInstruction = language === 'hi-IN' 
      ? "You are a helpful AI tutor. You must reply in Hindi (using Devanagari script). Keep answers concise."
      : "You are a helpful AI tutor. Keep answers concise.";

    const newHistory = [
      ...messages, 
      { role: "system", content: systemInstruction },
      { role: "user", content: userText }
    ];

    setMessages(newHistory);

    try {
      const aiText = await generateVoiceChat(newHistory, userText);
      setMessages(prev => [...prev, { role: "assistant", content: aiText }]);
      speakResponse(aiText);
    } catch (error) {
      console.error(error);
      setMode("listening");
      // Resume listening on error
      if (recognitionRef.current && isSessionActive.current) {
          recognitionRef.current.start();
      }
    }
  }

  // 4. AI SPEAKS (CORRECT ACCENT SELECTION)
  const speakResponse = (text) => {
    setMode("speaking");
    setTranscript(text); 

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;

    // --- STRICT VOICE SELECTION ---
    let selectedVoice = null;

    if (language === 'hi-IN') {
      // 1. Exact match for Google Hindi (Best on Android/Chrome)
      selectedVoice = availableVoices.find(v => v.name === "Google हिन्दी");
      // 2. Match any voice with Hindi in name
      if (!selectedVoice) selectedVoice = availableVoices.find(v => v.name.toLowerCase().includes("hindi"));
      // 3. Match by Language Code
      if (!selectedVoice) selectedVoice = availableVoices.find(v => v.lang === "hi-IN");
    } else {
      // English Preferences
      selectedVoice = availableVoices.find(v => v.name.includes("Google US English"));
      if (!selectedVoice) selectedVoice = availableVoices.find(v => v.name.includes("Samantha")); 
    }

    // Apply voice if found
    if (selectedVoice) {
        console.log("Using Voice:", selectedVoice.name);
        utterance.voice = selectedVoice;
    } else {
        console.warn("No specific voice found for language:", language);
    }

    utterance.rate = 1.0;  
    utterance.pitch = 1.0;

    utterance.onend = () => {
      if (isSessionActive.current) {
        setTranscript(""); 
        latestTranscript.current = ""; 
        setMode("listening");
        try { recognitionRef.current.start(); } catch(e) {}
      } else {
        setMode("idle");
      }
    };

    synthRef.current.speak(utterance);
  }

  // 5. BUTTON HANDLER
  const toggleSession = () => {
    if (!isSessionActive.current) {
      isSessionActive.current = true;
      setTranscript("");
      latestTranscript.current = "";
      recognitionRef.current?.start();
    } else {
      isSessionActive.current = false;
      recognitionRef.current?.stop();
      synthRef.current.cancel();
      setMode("idle");
      setTranscript("");
    }
  }

  return (
    <div className="ai-voice-page">
      <div className="canvas-container">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={2.0} color="#f97316" />
          <pointLight position={[-10, -10, -10]} intensity={1.0} color="#3b82f6" />
          <VoiceOrb state={mode} />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
        </Canvas>
      </div>

      <div className="ui-overlay">
        <div className="voice-header">
          <button onClick={() => navigate(-1)} className="back-btn">
            <ChevronLeft size={20} /> Back
          </button>
          
          <div className="language-selector">
            <Globe size={18} className="lang-icon" />
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              className="lang-select"
            >
              <option value="en-US">English</option>
              <option value="hi-IN">Hindi (हिंदी)</option>
            </select>
          </div>

          <div className={`status-pill ${mode}`}>
            <div className="status-dot"></div>
            {mode === 'idle' && "Nova Ready"}
            {mode === 'listening' && (language === 'hi-IN' ? "Listening (Hindi)..." : "Listening...")}
            {mode === 'thinking' && "Thinking..."}
            {mode === 'speaking' && "Speaking..."}
          </div>
        </div>

        <div className="captions-area">
           <h2 className={`caption-text ${mode === 'thinking' ? 'fade' : ''}`}>
             {mode === 'idle' ? (language === 'hi-IN' ? "बात शुरू करने के लिए माइक दबाएं" : "Tap Mic to Start Conversation") : 
              mode === 'thinking' ? "Thinking..." :
              transcript || (language === 'hi-IN' ? "सुन रहा हूँ..." : "Listening...")}
           </h2>
        </div>

        <div className="voice-controls">
           <button 
             className={`mic-button ${isSessionActive.current ? 'active' : ''}`}
             onClick={toggleSession}
           >
             {!isSessionActive.current ? <Mic size={32} /> : 
              mode === 'thinking' ? <Loader2 size={32} className="spin" /> :
              <StopCircle size={32} />}
           </button>
           <p className="hint">
             {!isSessionActive.current ? "Start Chat" : "End Call"}
           </p>
        </div>
      </div>
    </div>
  )
}

export default AITutorPage
