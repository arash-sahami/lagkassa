import { Injectable } from '@angular/core';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase.config';
import { AppData } from './storage.service';

const COLLECTION = 'lagkassa';
const DOC_ID     = 'p2012';

@Injectable({ providedIn: 'root' })
export class FirestoreService {
  private readonly ref = doc(db, COLLECTION, DOC_ID);

  async load(): Promise<AppData | null> {
    const snap = await getDoc(this.ref);
    return snap.exists() ? (snap.data() as AppData) : null;
  }

  async save(data: AppData): Promise<void> {
    await setDoc(this.ref, data);
  }
}
