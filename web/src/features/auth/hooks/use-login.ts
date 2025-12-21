/**
 * Hook for login functionality with Firebase
 */

import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { FirebaseError } from 'firebase/app';
import { signIn } from '@/core/firebase';
import { useAuthStore } from '@/core/store/auth-store';
import { LoginRequest } from '@/core/types';
import { trackLogin } from '@/core/analytics';

/**
 * Map Firebase auth errors to user-friendly Spanish messages
 */
const getFirebaseErrorMessage = (error: FirebaseError): string => {
  switch (error.code) {
    case 'auth/invalid-email':
      return 'El correo electrónico no es válido.';
    case 'auth/user-disabled':
      return 'Esta cuenta ha sido deshabilitada.';
    case 'auth/user-not-found':
      return 'No existe una cuenta con este correo electrónico.';
    case 'auth/wrong-password':
      return 'La contraseña es incorrecta.';
    case 'auth/invalid-credential':
      return 'Credenciales inválidas. Verifica tu correo y contraseña.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos fallidos. Intenta de nuevo más tarde.';
    case 'auth/network-request-failed':
      return 'Error de conexión. Verifica tu internet.';
    default:
      return 'Error al iniciar sesión. Intenta de nuevo.';
  }
};

export const useLogin = () => {
  const navigate = useNavigate();
  const setFirebaseUser = useAuthStore((state) => state.setFirebaseUser);

  return useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const userCredential = await signIn(credentials.email, credentials.password);
      return userCredential.user;
    },
    onSuccess: (user) => {
      trackLogin('email');
      setFirebaseUser(user);
      navigate('/dashboard');
    },
    onError: (error) => {
      if (error instanceof FirebaseError) {
        throw new Error(getFirebaseErrorMessage(error));
      }
      throw error;
    },
  });
};
