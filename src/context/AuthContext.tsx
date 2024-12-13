import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "firebase/auth";
import React, { createContext, useCallback, useEffect, useState } from "react";
import { FirebaseAuthService } from "../services/auth/FirebaseAuthService";
import { AuthResponse, UserData } from "../types/auth";

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  initializing: boolean;
  isLoggedIn: boolean;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signUp: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<AuthResponse>;
  refreshUserData: () => Promise<void>;
  isAuthorized: (requiredRoles?: string[]) => boolean;
  signOut: () => Promise<AuthResponse>;
}

const STORAGE_KEYS = {
  USER_DATA: "@auth_user_data",
} as const;

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  const authService = new FirebaseAuthService();

  const clearAuthState = useCallback(async () => {
    setUser(null);
    setUserData(null);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
  }, []);

  const refreshUserData = useCallback(async () => {
    if (!user) {
      await clearAuthState();
      return;
    }

    try {
      setLoading(true);
      const data = await authService.getCurrentUserData();
      if (data) {
        setUserData(data);
        await AsyncStorage.setItem(
          STORAGE_KEYS.USER_DATA,
          JSON.stringify(data)
        );
      } else {
        await clearAuthState();
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
      await clearAuthState();
    } finally {
      setLoading(false);
    }
  }, [user, clearAuthState]);

  const isAuthorized = useCallback(
    (requiredRoles?: string[]): boolean => {
      if (!user || !userData) return false;
      if (!requiredRoles || requiredRoles.length === 0) return true;
      return requiredRoles.includes(userData.role);
    },
    [user, userData]
  );

  const signIn = async (
    email: string,
    password: string
  ): Promise<AuthResponse> => {
    try {
      setLoading(true);
      const response = await authService.signIn(email, password);
      return response as any;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    displayName: string
  ): Promise<AuthResponse> => {
    try {
      setLoading(true);
      const response = await authService.signUp(email, password, displayName);
      return response as any;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<AuthResponse> => {
    try {
      setLoading(true);
      const response = await authService.signOut();
      if (response.success) {
        await clearAuthState();
      }
      return response;
    } finally {
      setLoading(false);
    }
  };

  // Load persisted data on mount
  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        const persistedUserData = await AsyncStorage.getItem(
          STORAGE_KEYS.USER_DATA
        );
        if (persistedUserData) {
          setUserData(JSON.parse(persistedUserData));
        }
      } catch (error) {
        console.error("Error loading persisted auth data:", error);
        await clearAuthState();
      }
    };

    loadPersistedData();
  }, [clearAuthState]);

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = authService
      .getAuth()
      .onAuthStateChanged(async (authUser) => {
        setUser(authUser);

        if (authUser) {
          await refreshUserData();
        } else {
          await clearAuthState();
        }

        setInitializing(false);
        setLoading(false);
      });

    return () => {
      unsubscribe();
    };
  }, [refreshUserData, clearAuthState]);

  const contextValue: AuthContextType = {
    user,
    userData,
    loading,
    initializing,
    isLoggedIn: !!user && !!userData,
    signIn,
    signUp,
    refreshUserData,
    isAuthorized,
    signOut,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
