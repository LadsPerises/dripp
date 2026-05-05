import { useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { handleFirestoreError, OperationType } from './firebaseError';

export interface UserProfile {
  email: string;
  name?: string;
  role: 'customer' | 'admin' | 'driver';
  createdAt?: any;
}

export function useAuth() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const path = `users/${currentUser.uid}`;
          const docRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef).catch(e => {
            handleFirestoreError(e, OperationType.GET, path);
            return null;
          });
          
          if (docSnap && docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else if (currentUser.email === 'ladislaupiedoso@gmail.com') {
            setProfile({ email: currentUser.email, role: 'admin' });
          } else {
             setProfile(null);
          }
        } catch(e) {
          console.error(e);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const isAdmin = profile?.role === 'admin' || user?.email === 'ladislaupiedoso@gmail.com';
  const isDriver = profile?.role === 'driver' || profile?.role === 'admin' || user?.email === 'ladislaupiedoso@gmail.com';

  return { user, profile, loading, isAdmin, isDriver };
}
