import { createStackNavigator } from "@react-navigation/stack";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "../hooks/useAuth";
import LoginScreen from "../screens/LoginScreen";
import MainScreen from "../screens/MainScreen";
import SignUpScreen from "../screens/SignupScreen";
import { RootStackParamList } from "../types";
import React from "react";

const Stack = createStackNavigator<RootStackParamList>();

const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
    <ActivityIndicator size="large" color="#4CAF50" />
  </View>
);

export const NavigationWrapper = () => {
  const { user, userData, initializing } = useAuth();

  if (initializing) {
    return <LoadingScreen />;
  }

  const isAuthenticated = !!user && !!userData;

  return (
    <Stack.Navigator>
      {!isAuthenticated ? (
        // Auth Stack
        <>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SignUp"
            component={SignUpScreen}
            options={{ headerShown: false }}
          />
        </>
      ) : (
        // App Stack - Only accessible when authenticated
        <Stack.Screen
          name="Main"
          component={MainScreen}
          options={{
            headerShown: true,
            title: "Pet Manager",
            headerStyle: {
              backgroundColor: "#4CAF50",
            },
            headerTintColor: "#fff",
            headerTitleStyle: {
              fontWeight: "bold",
            },
          }}
        />
      )}
    </Stack.Navigator>
  );
};
