# 🎓 ShikshaSaarthi: Smart Classroom Interface System

**Focus on Teaching, We Handle the Rest.**

ShikshaSaarthi is a state-of-the-art **Digital Proctorship and Classroom Management System** designed for the modern offline learning environment. It bridges the gap between traditional teaching and digital distraction control, ensuring students remain engaged, focused, and locked into their learning materials.

---

## 📖 Problem Statement
In offline classrooms, students are frequently distracted by mobile phones, background noise, and "app switching" (social media/gaming). Teachers currently have limited control over these digital distractions, leading to reduced engagement and learning gaps.

## 🎯 Our Solution
A central classroom interface where both teachers and students log in to a **Locked Learning Environment**. The system monitors disturbances and background activity while enabling structured, real-time teacher-student interaction.

---

## 🧩 System Architecture & Features

### 1. Classroom Session Initialization
* **QR/ID Login:** Instant session creation for teachers; students join via unique IDs.
* **Auto-Attendance:** Attendance is marked automatically upon a successful, verified login.

### 2. Role-Based Interfaces
* 👩‍🏫 **Teacher Dashboard:** Admin control to start/pause sessions, upload notes (PDF/PPT), and view real-time class analytics.
* 👨‍🎓 **Student Mode:** Full-screen locked interface. Access is limited strictly to teacher-provided content.

### 3. Device Lock & Attention Enforcement
* **Classroom Lock Mode:** Prevents app switching, background music/video, and screen minimization.
* **Session Persistence:** The lock is only released once the teacher officially ends the class.

### 4. Noise & Disturbance Detection

* **Local Processing:** Embedded microphone detects excessive chatter.
* **Privacy First:** Noise levels are converted to alert signals—**no audio data is ever stored or recorded.**

### 5. Engagement & Analytics
* **Controlled Content:** Uniform learning pace through direct push of slides and notes.
* **Live Quizzes:** Instant MCQs pushed during lectures to verify concept understanding.
* **Post-Class Reports:** Comprehensive summaries of attendance, noise disturbances, and engagement scores.

---

## 🛠️ Tech Stack
* **Frontend:** React.js, Vite
* **Icons:** Lucide-React
* **Styling:** CSS3 with 3D Transform & Tilt Engines
* **Monitoring:** Web Audio API & Page Visibility API

---

## 🔐 Privacy & Ethical Design
* **Zero Storage:** No audio recording or personal data misuse.
* **Session Bound:** Tracking is strictly limited to the duration of the class.
* **Transparency:** Clear student consent is required during the login process.

---

## 👥 The Team
This project was developed with passion and technical precision by:

| Name | Role |
| :--- | :--- |
| **Kartik Rawat** | 
| **Praveen Kumar Patel** | 
| **Nikhil Dangi** | 
| **Abhishek Gupta** | 

---

