// App.tsx
import { NavigationContainer } from "@react-navigation/native";
import React from "react";
import { SafeAreaView, StatusBar } from "react-native";
import { PetProvider } from "./src/context/PetContext";
import { NavigationWrapper } from "./src/navigation/navigation";
import { AuthProvider } from "./src/context/AuthContext";

const App: React.FC = () => {
  return (
    <NavigationContainer>
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle="dark-content" />
        <AuthProvider>
          <PetProvider>
            <NavigationWrapper />
          </PetProvider>
        </AuthProvider>
      </SafeAreaView>
    </NavigationContainer>
  );
};

export default App;
