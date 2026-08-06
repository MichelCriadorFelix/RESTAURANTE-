import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import firebaseConfigLocal from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigLocal.apiKey,
  authDomain: firebaseConfigLocal.authDomain,
  projectId: firebaseConfigLocal.projectId,
  storageBucket: firebaseConfigLocal.storageBucket,
  messagingSenderId: firebaseConfigLocal.messagingSenderId,
  appId: firebaseConfigLocal.appId,
  firestoreDatabaseId: firebaseConfigLocal.firestoreDatabaseId || '(default)'
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);

export function sanitizeForFirestore<T>(val: T): T {
  if (val === undefined) return null as any;
  if (val === null) return null as any;
  if (Array.isArray(val)) {
    return val.map(sanitizeForFirestore) as any;
  }
  if (typeof val === 'object') {
    const res: any = {};
    for (const key in val) {
      if (Object.prototype.hasOwnProperty.call(val, key)) {
        const v = val[key];
        if (v !== undefined) {
          res[key] = sanitizeForFirestore(v);
        }
      }
    }
    return res;
  }
  return val;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
