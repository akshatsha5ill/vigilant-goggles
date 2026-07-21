import { auth } from './config';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { useStore } from '../../store';

const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google sign in failed", error);
    throw error;
  }
};

export const loginWithEmail = async (email, password) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error("Email sign in failed", error);
    throw error;
  }
};

export const registerWithEmail = async (email, password) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error("Registration failed", error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Sign out failed", error);
    throw error;
  }
};

// Setup global auth listener to sync with Zustand
export const initAuthListener = () => {
  onAuthStateChanged(auth, (user) => {
    const { setUser, setAuthReady } = useStore.getState();
    if (user) {
      setUser({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      });
    } else {
      setUser(null);
    }
    setAuthReady(true);
  });
};
