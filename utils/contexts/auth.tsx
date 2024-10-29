import auth from "@/firebase/auth";
import db from "@/firebase/firestore";
import { doc, setDoc, getDoc } from "firebase/firestore";
import {
  updateProfile,
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";

import { createContext, useContext, useEffect, useState } from "react";

type authContextType = {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => void;
  signUp: (email: string, password: string) => void;
  signOut: () => void;
  UpdateUserDetails: (name: string, photoURL: string) => void;
};

const AuthContext = createContext<authContextType>({
  user: null,
  loading: true,
  error: null,
  signIn: () => {},
  signUp: () => {},
  signOut: () => {},
  UpdateUserDetails: () => {},
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });
    if (!user) return unsubscribe;
    const CreateUserDoc = async () => {
      const customId = `${user.uid}`;
      const userDocRef = doc(db, "User", customId);
      const userDocSnapshot = await getDoc(userDocRef);
      if (userDocSnapshot.exists()) {
        // console.log("Document already exists with ID: ", customId);
      } else {
        await setDoc(userDocRef, {
          name: user.displayName,
          email: user.email,
          uid: user.uid,
          emailVerified: user.emailVerified,
          photoURL: user.photoURL,
          phoneNumber: user.phoneNumber,
          Storage: {
            Total: 500,
            Used: 0,
            Free: 500,
          },
        });
        localStorage &&
          localStorage.setItem(
            "User",
            JSON.stringify({
              name: user.displayName,
              email: user.email,
              uid: user.uid,
              emailVerified: user.emailVerified,
              photoURL: user.photoURL,
              phoneNumber: user.phoneNumber,
              Storage: {
                Total: 500,
                Used: 0,
                Free: 500,
              },
            })
          );
        // console.log("Document written with ID: ", customId);
      }
    };
    CreateUserDoc();
    return unsubscribe;
  }, [user]);

  const UpdateUserDetails = async (name: string, photoURL: string) => {
    try {
      const UserDetails = {
        name: name,
        photoURL: photoURL,
      };
      const customId = `${user?.uid}`;
      const userDocRef = doc(db, "User", customId);
      await setDoc(userDocRef, UserDetails, { merge: true });
      updateProfile(auth.currentUser!, {
        displayName: name,
        photoURL: photoURL,
      })
        .then(() => {
          // console.log("User Details Updated");
        })
        .catch((error) => {
          // console.log(error);
        });

      // console.log("User Details Updated", user);
    } catch (error: any) {
      setError(error.message);
    }
  };
  const signIn = async (email: string, password: string) => {
    try {
      signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      setError(error.message);
    }
  };
  const signUp = async (email: string, password: string) => {
    try {
      createUserWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      setError(error.message);
    }
  };
  const signOut = async () => {
    try {
      await auth.signOut();
    } catch (error: any) {
      setError(error.message);
    }
  };
  const value: authContextType = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    UpdateUserDetails,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
