'use client';

import { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firebaseError';
import { UserCircle, LogOut, ShieldAlert, Navigation } from 'lucide-react';
import { useAuth } from '../lib/useAuth';
import Link from 'next/link';

export default function AuthButton() {
  const { user, profile, loading, isAdmin, isDriver } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setErrorMsg(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      const result = await signInWithPopup(auth, provider);
      
      if (result.user) {
        // Create user document if it doesn't exist
        const pathRef = `users/${result.user.uid}`;
        const userRef = doc(db, 'users', result.user.uid);
        let userSnap;
        try {
          userSnap = await getDoc(userRef);
        } catch (e) {
          handleFirestoreError(e, OperationType.GET, pathRef);
        }
        
        if (userSnap && !userSnap.exists()) {
          try {
            await setDoc(userRef, {
              email: result.user.email || '',
              name: result.user.displayName || result.user.email?.split('@')[0] || '',
              role: 'customer',
              createdAt: serverTimestamp()
            });
          } catch (e) {
            handleFirestoreError(e, OperationType.WRITE, pathRef);
          }
        }
      }
    } catch (error: any) {
      if (error.code !== 'auth/cancelled-popup-request' && error.code !== 'auth/popup-closed-by-user') {
        console.error("Error logging in:", error);
      }
      if (error.code === 'auth/popup-blocked') {
        setErrorMsg('Por favor, autorize os popups ou abra a aplicação noutra aba e tente novamente.');
      } else if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        // Ignored, user just closed it
      } else if (error.message && error.message.includes('authInfo')) {
        setErrorMsg('Erro de permissão no banco de dados. Tente novamente.');
      } else {
        setErrorMsg('Ocorreu um erro durante o login. Tente novamente.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  if (loading) return null;

  if (user) {
    return (
      <div className="flex items-center gap-4">
        {isAdmin && (
          <Link href="/admin" className="text-[#FF4D00] hover:text-[#09090B] transition-colors" title="Dashboard Admin">
            <ShieldAlert size={20} />
          </Link>
        )}
        {isDriver && !isAdmin && (
          <Link href="/driver" className="text-blue-500 hover:text-[#09090B] transition-colors" title="Dashboard Entregador">
            <Navigation size={20} />
          </Link>
        )}
        <span className="text-xs font-bold uppercase tracking-widest hidden md:block">
          {profile?.role === 'admin' ? <span className="text-[#FF4D00]">ADMIN </span> : null}
          {profile?.role === 'driver' ? <span className="text-blue-500">ENTREGADOR </span> : null}
          {profile?.name || user.displayName || user.email}
        </span>
        <button 
          onClick={handleLogout}
          className="bg-[#09090B]/10 hover:bg-[#FF4D00] text-inherit hover:text-white transition-colors rounded-full p-2"
          title="Logout"
        >
          <LogOut size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative z-50">
      <button 
        onClick={handleLogin}
        className="flex items-center gap-2 bg-[#FF4D00] hover:bg-[#09090B] hover:text-white text-[#09090B] font-black py-2 px-4 rounded-full transition-colors uppercase tracking-widest text-xs"
      >
        <UserCircle size={16} />
        <span>Login</span>
      </button>
      {errorMsg && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-[#FF4D00] text-[#09090B] text-xs font-bold p-3 rounded shadow-lg z-50">
          {errorMsg}
        </div>
      )}
    </div>
  );
}
