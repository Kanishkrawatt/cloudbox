import auth from "@/firebase/auth";
import db from "@/firebase/firestore";
import { doc, setDoc, getDoc } from "firebase/firestore";
import {
  updateProfile,
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // Subscribe once; re-subscribing on every user change re-fired the callback.
  useEffect(
    () =>
      auth.onAuthStateChanged((user) => {
        setUser(user);
        setLoading(false);
      }),
    []
  );

  useEffect(() => {
    if (!user) return;
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
  }, [user]);

  const UpdateUserDetails = useCallback(async (name: string, photoURL: string) => {
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
  }, [user?.uid]);
  // These are promises: without await the try/catch never saw a failed login,
  // so wrong-password errors were dropped instead of shown.
  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      setError(error.message);
    }
  }, []);
  const signUp = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      setError(error.message);
    }
  }, []);
  const signOut = useCallback(async () => {
    try {
      await auth.signOut();
    } catch (error: any) {
      setError(error.message);
    }
  }, []);
  // Memoised so consumers only re-render when auth state actually changes.
  const value = useMemo<authContextType>(
    () => ({ user, loading, error, signIn, signUp, signOut, UpdateUserDetails }),
    [user, loading, error, signIn, signUp, signOut, UpdateUserDetails]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
