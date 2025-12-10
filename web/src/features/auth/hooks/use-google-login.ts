/**
 * Hook for Google sign-in functionality with Firebase using popup
 */

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FirebaseError } from 'firebase/app';
import { signInWithGoogle, getCurrentUser } from '@/core/firebase';
import { useAuthStore } from '@/core/store/auth-store';

/**
 * Map Firebase Google auth errors to user-friendly Spanish messages
 */
const getGoogleErrorMessage = (error: FirebaseError): string => {
  console.log('Firebase error code:', error.code);
  switch (error.code) {
    case 'auth/popup-closed-by-user':
      return 'Inicio de sesión cancelado.';
    case 'auth/popup-blocked':
      return 'El popup fue bloqueado. Permite los popups para continuar.';
    case 'auth/cancelled-popup-request':
      return 'La solicitud fue cancelada.';
    case 'auth/account-exists-with-different-credential':
      return 'Ya existe una cuenta con este correo. Intenta con otro método.';
    case 'auth/network-request-failed':
      return 'Error de conexión. Verifica tu internet.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Intenta de nuevo más tarde.';
    case 'auth/user-disabled':
      return 'Esta cuenta ha sido deshabilitada.';
    case 'auth/unauthorized-domain':
      return 'Este dominio no está autorizado. Contacta al administrador.';
    case 'auth/operation-not-allowed':
      return 'Google Sign-in no está habilitado en este proyecto.';
    default:
      return `Error al iniciar sesión con Google: ${error.code}`;
  }
};

export const useGoogleLogin = () => {
  const navigate = useNavigate();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { isAuthenticated, isLoading } = useAuthStore();

  // Watch for auth state changes and navigate when authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading && isPending) {
      console.log('Google login: Auth state detected, navigating to dashboard...');
      setIsPending(false);
      navigate('/dashboard');
    }
  }, [isAuthenticated, isLoading, isPending, navigate]);

  // Use a regular function (not async) to ensure synchronous popup opening
  const mutate = useCallback(() => {
    console.log('Google login: Starting...');
    console.log('Google login: Current user before:', getCurrentUser()?.email || 'none');
    setError(null);
    setIsPending(true);

    // Call signInWithPopup synchronously - the popup opens immediately
    // Use .then()/.catch() instead of async/await to avoid microtask delays
    signInWithGoogle()
      .then((result) => {
        console.log('Google login: Promise resolved!');
        console.log('Google login: User email:', result.user.email);
        console.log('Google login: User UID:', result.user.uid);
        console.log('Google login: Provider:', result.providerId);
        // Auth state listener will update the store and the useEffect above will navigate
        // But also try direct navigation as backup
        navigate('/dashboard');
      })
      .catch((err: unknown) => {
        console.error('Google login: Error caught');
        console.error('Google login: Error type:', typeof err);
        console.error('Google login: Error details:', err);

        // Check current user in case auth actually succeeded but promise rejected
        const currentUser = getCurrentUser();
        console.log('Google login: Current user after error:', currentUser?.email || 'none');

        if (currentUser) {
          console.log('Google login: User is actually signed in despite error, navigating...');
          navigate('/dashboard');
          return;
        }

        setIsPending(false);

        if (err instanceof FirebaseError) {
          const message = getGoogleErrorMessage(err);
          setError(new Error(message));
        } else if (err instanceof Error) {
          setError(err);
        } else {
          setError(new Error('Error desconocido al iniciar sesión con Google'));
        }
      })
      .finally(() => {
        console.log('Google login: Flow completed (finally block)');
        console.log('Google login: Current user in finally:', getCurrentUser()?.email || 'none');
      });
  }, [navigate]);

  return {
    mutate,
    isPending,
    error,
    isGooglePending: isPending,
    googleError: error,
  };
};
