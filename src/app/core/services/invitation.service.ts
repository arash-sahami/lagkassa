import { Injectable } from '@angular/core';
import { doc, getDoc, setDoc, writeBatch, Timestamp } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { db, firebaseApp } from '../firebase.config';

export const ADMINS_COLLECTION      = 'lagkassa_admins';
export const INVITATIONS_COLLECTION = 'lagkassa_invitations';

const INVITE_VALID_DAYS = 7;

export interface Invitation {
  createdBy: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  used: boolean;
  usedBy?: string;
  usedAt?: Timestamp;
}

export type InvitationStatus = 'valid' | 'missing' | 'used' | 'expired';

@Injectable({ providedIn: 'root' })
export class InvitationService {
  private readonly auth = getAuth(firebaseApp);

  /** Creates a one-time invitation and returns its token. Caller must be an admin. */
  async create(): Promise<{ token: string; expiresAt: Date }> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Inte inloggad');

    const token     = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + INVITE_VALID_DAYS * 24 * 60 * 60 * 1000);
    const invitation: Invitation = {
      createdBy: user.uid,
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(expiresAt),
      used: false,
    };
    await setDoc(doc(db, INVITATIONS_COLLECTION, token), invitation);
    return { token, expiresAt };
  }

  /** Link that the QR code points to. Respects the app's base href (GitHub Pages sub-path). */
  registerUrl(token: string): string {
    return new URL(`registrera?token=${encodeURIComponent(token)}`, document.baseURI).toString();
  }

  async status(token: string): Promise<InvitationStatus> {
    const snap = await getDoc(doc(db, INVITATIONS_COLLECTION, token));
    if (!snap.exists()) return 'missing';
    const inv = snap.data() as Invitation;
    if (inv.used) return 'used';
    if (inv.expiresAt.toMillis() < Date.now()) return 'expired';
    return 'valid';
  }

  /**
   * Creates the Firebase Auth account and, in one atomic batch, registers the
   * user as admin and consumes the invitation (enforced by firestore.rules).
   */
  async register(token: string, email: string, password: string): Promise<void> {
    const { user } = await createUserWithEmailAndPassword(this.auth, email, password);
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, ADMINS_COLLECTION, user.uid), {
        email,
        invitation: token,
        createdAt: Timestamp.now(),
      });
      batch.update(doc(db, INVITATIONS_COLLECTION, token), {
        used: true,
        usedBy: user.uid,
        usedAt: Timestamp.now(),
      });
      await batch.commit();
    } catch (e) {
      // Invitation rejected (used/expired) – remove the orphan account so the e-mail can be reused
      await user.delete().catch(() => {});
      throw e;
    }
  }
}
