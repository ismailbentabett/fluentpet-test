import { FirebaseApp, initializeApp } from "firebase/app";
import {
    Auth,
    browserLocalPersistence,
    createUserWithEmailAndPassword,
    getAuth,
    setPersistence,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    User,
} from "firebase/auth";
import {
    doc,
    Firestore,
    getDoc,
    getFirestore,
    serverTimestamp,
    setDoc,
    Timestamp,
} from "firebase/firestore";

import { AuthenticationError } from "./errors";
import { firebaseConfig } from "../../config/firebase.config";
import { AuthResponse, UserData } from "../../types/auth";

export class FirebaseAuthService {
  private app: FirebaseApp;
  private auth: Auth;
  private db: Firestore;

  constructor() {
    this.app = initializeApp(firebaseConfig);
    this.auth = getAuth(this.app);
    this.db = getFirestore(this.app);
    this.initializePersistence();
  }

  private async initializePersistence(): Promise<void> {
    try {
      await setPersistence(this.auth, browserLocalPersistence);
    } catch (error) {
      console.error("Failed to set auth persistence:", error);
    }
  }

  private formatTimestamp(timestamp: Timestamp | null): string {
    return timestamp?.toDate().toISOString() ?? new Date().toISOString();
  }

  private async updateUserLoginTimestamp(uid: string): Promise<void> {
    await setDoc(
      doc(this.db, "users", uid),
      {
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  public getAuth(): Auth {
    return this.auth;
  }

  async signIn(
    email: string,
    password: string
  ): Promise<AuthResponse<{ user: User; userData: UserData }>> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      const userData = await this.getCurrentUserData();

      if (!userData) {
        throw new AuthenticationError(
          "auth/user-data-not-found",
          "User data not found"
        );
      }

      await this.updateUserLoginTimestamp(userCredential.user.uid);

      return {
        success: true,
        data: {
          user: userCredential.user,
          userData,
        },
      };
    } catch (error: unknown) {
      const authError = AuthenticationError.fromFirebaseError(error);
      return {
        success: false,
        error: {
          code: authError.code,
          message: authError.message,
          technical: authError.technical,
        } as any,
      };
    }
  }

  async signUp(
    email: string,
    password: string,
    displayName: string
  ): Promise<AuthResponse<{ user: User; userData: UserData }>> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      const { user } = userCredential;

      await updateProfile(user, { displayName });

      const userData: UserData = {
        uid: user.uid,
        email: user.email ?? "",
        displayName,
        role: "user",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      await setDoc(doc(this.db, "users", user.uid), {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      });

      return {
        success: true,
        data: {
          user,
          userData,
        },
      };
    } catch (error: unknown) {
      const authError = AuthenticationError.fromFirebaseError(error);
      return {
        success: false,
        error: {
          code: authError.code,
          message: authError.message,
          technical: authError.technical,
        } as any,
      };
    }
  }

  async signOut(): Promise<AuthResponse> {
    try {
      await signOut(this.auth);
      return { success: true };
    } catch (error: unknown) {
      const authError = AuthenticationError.fromFirebaseError(error);
      return {
        success: false,
        error: {
          code: authError.code,
          message: authError.message,
          technical: authError.technical,
        } as any,
      };
    }
  }

  async getCurrentUserData(): Promise<UserData | null> {
    const user = this.auth.currentUser;
    if (!user) return null;

    try {
      const docRef = doc(this.db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        ...data,
        uid: user.uid,
        createdAt: this.formatTimestamp(data.createdAt),
        updatedAt: this.formatTimestamp(data.updatedAt),
        lastLoginAt: this.formatTimestamp(data.lastLoginAt),
      } as UserData;
    } catch (error) {
      console.error("Error getting user data:", error);
      return null;
    }
  }
}
