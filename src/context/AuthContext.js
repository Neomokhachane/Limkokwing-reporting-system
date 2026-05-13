import React, { createContext, useContext, useState, useEffect } from "react";
import { onAuthChange, getUserData, logoutUser } from "../firebase/authService";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile = null;

    const unsubscribe = onAuthChange(async (user) => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      setCurrentUser(user);
      if (user) {
        unsubscribeProfile = onSnapshot(
          doc(db, "users", user.uid),
          (snapshot) => {
            setUserProfile(snapshot.exists() ? snapshot.data() : null);
            setLoading(false);
          },
          () => {
            setUserProfile(null);
            setLoading(false);
          }
        );
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      if (unsubscribeProfile) unsubscribeProfile();
      unsubscribe();
    };
  }, []);

  const logout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setUserProfile(null);
  };

  const refreshProfile = async () => {
    if (currentUser) {
      const profile = await getUserData(currentUser.uid);
      setUserProfile(profile);
    }
  };

  return (
    <AuthContext.Provider
      value={{ currentUser, userProfile, loading, logout, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
