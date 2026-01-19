import React, { useContext, useState, useEffect } from "react"
import { auth, db } from "../firebase"
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from "firebase/auth"
import { doc, setDoc, getDoc, arrayUnion, updateDoc } from "firebase/firestore"

const AuthContext = React.createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)

  // 1. UPDATED SIGNUP: Accepts classId for students
   // 1. UPDATED SIGNUP: Accepts classId for students
    const signup = async (
    email,
    password,
    name,
    role,
    batchId,
    teacherExtraData
  ) => {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
  
    const user = userCredential.user;
  
    // Base user data (for everyone)
    const userData = {
      uid: user.uid,
      name,
      email,
      role,
      createdAt: new Date()
    };
  
    // 👩‍🏫 Only add teacher data IF role is teacher
    if (role === "teacher" && teacherExtraData) {
      userData.classLevel = teacherExtraData.classLevel ?? "beginner";
      userData.subject = teacherExtraData.subject;
      userData.language = teacherExtraData.language;
      userData.classType = teacherExtraData.classType;
    }
  
    // 👨‍🎓 Student batch
    if (role === "student" && batchId) {
      userData.batchId = batchId;
    }
  
    await setDoc(doc(db, "users", user.uid), userData);
  };
  

  // 2. LOGIN (With Safety Check)
  async function login(email, password) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    
    // Fetch role
    const userDoc = await getDoc(doc(db, "users", userCredential.user.uid))
    
    if (userDoc.exists()) {
      setUserRole(userDoc.data().role)
    } else {
      // FIX FOR YOUR ERROR: If doc is missing, recreate it
      await setDoc(doc(db, "users", userCredential.user.uid), {
        name: userCredential.user.displayName || "User",
        email: email,
        role: "student", // Default fallback
        createdAt: new Date().toISOString()
      })
      setUserRole("student")
    }
    return userCredential.user
  }

  function logout() {
    setUserRole(null)
    return signOut(auth)
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user)
        const userDoc = await getDoc(doc(db, "users", user.uid))
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role)
        }
      } else {
        setCurrentUser(null)
        setUserRole(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const value = { currentUser, userRole, signup, login, logout }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
