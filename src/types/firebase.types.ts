// Firebase-specific type extensions

export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
  toDate(): Date;
}

export interface FirestoreDocument<T> {
  id: string;
  data: T;
  exists: boolean;
}

export interface FirebaseError {
  code: string;
  message: string;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
}
