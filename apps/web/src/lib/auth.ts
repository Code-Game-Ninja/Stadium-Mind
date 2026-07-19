'use client';

import type { AppRole } from '@stadiummind/shared';
import { auth, db } from './firebaseClient';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore';

export interface Session {
  role: AppRole;
  email: string;
  displayName: string;
  uid: string;
}

// Volunteer application legacy types (we still need this signature for compatibility)
export interface VolunteerApplication {
  name: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  assignedZone?: string;
}

/**
 * Creates a new volunteer application using Firebase Auth and Firestore.
 */
export async function applyForVolunteer(name: string, email: string) {
  try {
    // We create a Firebase Auth user. The default password for demo purposes is 'volunteer123'
    const cred = await createUserWithEmailAndPassword(auth, email, 'volunteer123');
    const uid = cred.user.uid;

    // Save their profile in the `users` collection as a pending volunteer
    await setDoc(doc(db, 'users', uid), {
      email,
      displayName: name,
      role: 'volunteer',
      status: 'pending'
    });
    
    // Also save to `volunteers` collection for the dashboard if needed, 
    // or just rely on the existing volunteer manager which reads from matches.
    // For now we just create the user.
  } catch (err) {
    console.error('Error applying for volunteer:', err);
    throw err;
  }
}

/**
 * Creates a new fan account using Firebase Auth and Firestore.
 */
export async function signUpFan(name: string, email: string, password: string) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;

    await setDoc(doc(db, 'users', uid), {
      email,
      displayName: name,
      role: 'fan',
      status: 'active'
    });
  } catch (err) {
    console.error('Error signing up fan:', err);
    throw err;
  }
}

/**
 * Wraps Firebase signOut
 */
export async function logout() {
  await firebaseSignOut(auth);
}

/**
 * Synchronous getSession is no longer possible with real Firebase Auth.
 * We'll return null here and let LoginGate rely on onAuthStateChanged.
 */
export function getSession(): Session | null {
  return null;
}

/**
 * Listener for auth state changes that fetches the user role from Firestore.
 */
export function onAuthStateChanged(callback: (session: Session | null) => void) {
  return firebaseOnAuthStateChanged(auth, async (user: User | null) => {
    if (!user) {
      callback(null);
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        callback({
          uid: user.uid,
          email: user.email || data.email,
          displayName: data.displayName || 'User',
          role: data.role as AppRole
        });
      } else {
        // No profile doc — default to the least-privileged role.
        callback({
          uid: user.uid,
          email: user.email || '',
          displayName: 'User',
          role: 'fan'
        });
      }
    } catch (err) {
      console.error('Failed to fetch user role', err);
      callback(null);
    }
  });
}
