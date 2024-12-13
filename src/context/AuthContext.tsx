import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "firebase/auth";
import React, { createContext, useCallback, useEffect, useState } from "react";
import { FirebaseAuthService } from "../services/auth/FirebaseAuthService";
import { AuthResponse, UserData } from "../types/auth";
import { STORAGE_KEYS } from "../constants/storage";

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  initializing: boolean;
  isLoggedIn: boolean;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signUp: (email: string, password: string, displayName: string) => Promise<AuthResponse>;
  refreshUserData: () => Promise<void>;
  isAuthorized: (requiredRoles?: string[]) => boolean;
  signOut: () => Promise<AuthResponse>;
}



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
    await AsyncStorage.multiRemove([STORAGE_KEYS.USER_DATA, STORAGE_KEYS.AUTH_USER]);
  }, []);

  const persistAuthState = async (authUser: User | null, authUserData: UserData | null) => {
    if (authUser && authUserData) {
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.AUTH_USER, JSON.stringify(authUser)],
        [STORAGE_KEYS.USER_DATA, JSON.stringify(authUserData)]
      ]);
    } else {
      await clearAuthState();
    }
  };

  const loadPersistedAuthState = async () => {
    try {
      const [persistedUser, persistedUserData] = await AsyncStorage.multiGet([
        STORAGE_KEYS.AUTH_USER,
        STORAGE_KEYS.USER_DATA
      ]);
      
      if (persistedUser[1] && persistedUserData[1]) {
        setUser(JSON.parse(persistedUser[1]));
        setUserData(JSON.parse(persistedUserData[1]));
      }
    } catch (error) {
      console.error("Error loading persisted auth state:", error);
      await clearAuthState();
    }
  };

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
        await persistAuthState(user, data);
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

  const signIn = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      setLoading(true);
      const response = await authService.signIn(email, password);
      
      if (response.success && response.data) {
        setUser(response.data.user);
        setUserData(response.data.userData);
        await persistAuthState(response.data.user, response.data.userData);
      }
      
      return response as AuthResponse;
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
      
      if (response.success && response.data) {
        setUser(response.data.user);
        setUserData(response.data.userData);
        await persistAuthState(response.data.user, response.data.userData);
      }
      
      return response as AuthResponse;
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

  useEffect(() => {
    const initializeAuth = async () => {
      await loadPersistedAuthState();
      
      const unsubscribe = authService.getAuth().onAuthStateChanged(async (authUser) => {
        setUser(authUser);
        
        if (authUser) {
          await refreshUserData();
        } else {
          await clearAuthState();
        }
        
        setInitializing(false);
        setLoading(false);
      });

      return unsubscribe;
    };

    initializeAuth();
  }, []);

  const contextValue: AuthContextType = {
    user,
    userData,
    loading,
    initializing,
    isLoggedIn: !!user && !!userData,
    signIn,
    signUp,
    refreshUserData,
    isAuthorized: useCallback((requiredRoles?: string[]): boolean => {
      if (!user || !userData) return false;
      if (!requiredRoles || requiredRoles.length === 0) return true;
      return requiredRoles.includes(userData.role);
    }, [user, userData]),
    signOut,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};