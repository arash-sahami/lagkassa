import { Injectable, signal } from '@angular/core';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  User,
} from 'firebase/auth';
import { firebaseApp } from '../firebase.config';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = getAuth(firebaseApp);

  // undefined = auth state not yet known (initializing)
  // null      = not logged in
  // User      = logged in
  readonly currentUser = signal<User | null | undefined>(undefined);

  constructor() {
    onAuthStateChanged(this.auth, user => {
      this.currentUser.set(user);
    });
  }

  async login(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(this.auth, email, password);
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
  }

  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(this.auth, email);
  }

  isLoggedIn(): boolean {
    const u = this.currentUser();
    return u !== null && u !== undefined;
  }
}
