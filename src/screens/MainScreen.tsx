import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useAuth } from "../hooks/useAuth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { Formik } from "formik";
import * as Yup from "yup";
import { RootStackParamList } from "../types";
import { UserData } from "../types/auth";

type MainScreenNavigationProp = StackNavigationProp<RootStackParamList, "Main">;

interface Pet {
  id: string;
  name: string;
  age: string;
  description?: string;
  photo?: string;
}

const PetSchema = Yup.object().shape({
  name: Yup.string().required("Name is required"),
  age: Yup.string().required("Age is required"),
  description: Yup.string(),
  photo: Yup.string(),
});

const MainScreen: React.FC = () => {
  const navigation = useNavigation<MainScreenNavigationProp>();
  const { signOut } = useAuth();
  const [user, setUser] = useState<UserData | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [ageFilter, setAgeFilter] = useState("");

  useEffect(() => {
    const initializeScreen = async () => {
      await checkAuth();
      await loadPets();
      setLoading(false);
    };
    initializeScreen();
  }, []);

  const checkAuth = async () => {
    const userData = await AsyncStorage.getItem("userData");
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      navigation.replace("Login");
    }
  };

  const loadPets = async () => {
    try {
      const storedPets = await AsyncStorage.getItem("pets");
      if (storedPets) {
        setPets(JSON.parse(storedPets));
      }
    } catch (error) {
      console.error("Failed to load pets:", error);
      Alert.alert("Error", "Failed to load pets. Please try again.");
    }
  };

  const savePets = async (updatedPets: Pet[]) => {
    try {
      await AsyncStorage.setItem("pets", JSON.stringify(updatedPets));
    } catch (error) {
      console.error("Failed to save pets:", error);
      Alert.alert("Error", "Failed to save pets. Please try again.");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      await AsyncStorage.removeItem("userData");
      navigation.replace("Login");
    } catch (error) {
      console.error("Sign out error:", error);
      Alert.alert("Error", "Failed to sign out. Please try again.");
    }
  };

  const handleSubmit = async (
    values: Omit<Pet, "id">,
    { resetForm }: { resetForm: () => void }
  ) => {
    try {
      let updatedPets: Pet[];
      if (editingPet) {
        updatedPets = pets.map((pet) =>
          pet.id === editingPet.id ? { ...pet, ...values, id: pet.id } : pet
        );
        Alert.alert("Success", "Pet updated successfully");
      } else {
        const newPet: Pet = { ...values, id: Date.now().toString() };
        updatedPets = [...pets, newPet];
        Alert.alert("Success", "Pet added successfully");
      }
      setPets(updatedPets);
      await savePets(updatedPets);
      resetForm();
      setEditingPet(null);
    } catch (error) {
      console.error("Pet operation error:", error);
      Alert.alert("Error", "Failed to save pet. Please try again.");
    }
  };

  const handleDelete = useCallback(
    (id: string) => {
      Alert.alert(
        "Confirm Delete",
        "Are you sure you want to delete this pet?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                const updatedPets = pets.filter((pet) => pet.id !== id);
                setPets(updatedPets);
                await savePets(updatedPets);
                Alert.alert("Success", "Pet deleted successfully");
              } catch (error) {
                console.error("Delete pet error:", error);
                Alert.alert("Error", "Failed to delete pet. Please try again.");
              }
            },
          },
        ]
      );
    },
    [pets]
  );

  const pickImage = async (
    setFieldValue: (field: string, value: any) => void
  ) => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert(
        "Permission Required",
        "You need to grant camera roll permissions to upload photos."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setFieldValue("photo", result.assets[0].uri);
    }
  };

  const filteredPets = pets.filter(
    (pet) =>
      pet.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (ageFilter === "" || pet.age === ageFilter)
  );

  const renderPetItem = useCallback(
    ({ item }: { item: Pet }) => (
      <View style={styles.petItem}>
        {item.photo && (
          <Image source={{ uri: item.photo }} style={styles.petPhoto} />
        )}
        <Text style={styles.petName}>Name: {item.name}</Text>
        <Text style={styles.petAge}>Age: {item.age}</Text>
        {item.description && (
          <Text style={styles.petDescription}>
            Description: {item.description}
          </Text>
        )}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={() => setEditingPet(item)}
            style={styles.editButton}
          >
            <Text style={styles.buttonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDelete(item.id)}
            style={styles.deleteButton}
          >
            <Text style={styles.buttonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    ),
    [handleDelete]
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Text>No user data found. Please log in again.</Text>
        <TouchableOpacity
          onPress={() => navigation.replace("Login")}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Welcome, {user.displayName}</Text>
          <TouchableOpacity
            onPress={handleSignOut}
            style={styles.signOutButton}
          >
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search pets by name"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Filter by age"
            value={ageFilter}
            onChangeText={setAgeFilter}
            keyboardType="numeric"
          />
        </View>

        <Formik
          initialValues={
            editingPet || { name: "", age: "", description: "", photo: "" }
          }
          validationSchema={PetSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({
            handleChange,
            handleBlur,
            handleSubmit,
            setFieldValue,
            values,
            errors,
            touched,
          }) => (
            <View style={styles.formContainer}>
              <TextInput
                style={[
                  styles.input,
                  touched.name && errors.name && styles.inputError,
                ]}
                value={values.name}
                onChangeText={handleChange("name")}
                onBlur={handleBlur("name")}
                placeholder="Pet Name"
              />
              {touched.name && errors.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}

              <TextInput
                style={[
                  styles.input,
                  touched.age && errors.age && styles.inputError,
                ]}
                value={values.age}
                onChangeText={handleChange("age")}
                onBlur={handleBlur("age")}
                placeholder="Pet Age"
                keyboardType="numeric"
              />
              {touched.age && errors.age && (
                <Text style={styles.errorText}>{errors.age}</Text>
              )}

              <TextInput
                style={[styles.input, styles.textArea]}
                value={values.description}
                onChangeText={handleChange("description")}
                onBlur={handleBlur("description")}
                placeholder="Pet Description"
                multiline
                numberOfLines={4}
              />

              <TouchableOpacity
                style={styles.photoButton}
                onPress={() => pickImage(setFieldValue)}
              >
                <Text style={styles.photoButtonText}>
                  {values.photo ? "Change Photo" : "Add Photo"}
                </Text>
              </TouchableOpacity>

              {values.photo && (
                <Image
                  source={{ uri: values.photo }}
                  style={styles.previewPhoto}
                />
              )}

              <TouchableOpacity
                style={styles.button}
                onPress={() => handleSubmit()}
              >
                <Text style={styles.buttonText}>
                  {editingPet ? "Update Pet" : "Add Pet"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Formik>

        <View style={styles.listContainer}>
          {filteredPets.length > 0 ? (
            <FlatList
              data={filteredPets}
              keyExtractor={(item) => item.id}
              renderItem={renderPetItem}
            />
          ) : (
            <Text style={styles.emptyListText}>
              No pets found. Add your first pet!
            </Text>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollViewContent: {
    flexGrow: 1,
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  signOutButton: {
    backgroundColor: "#f44336",
    padding: 8,
    borderRadius: 5,
  },
  signOutButtonText: {
    color: "white",
    fontWeight: "600",
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 5,
    marginBottom: 8,
  },
  formContainer: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    marginBottom: 16,
    borderRadius: 5,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  inputError: {
    borderColor: "#f44336",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  photoButton: {
    backgroundColor: "#2196F3",
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 16,
  },
  photoButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  previewPhoto: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
    borderRadius: 5,
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#4CAF50",
    padding: 16,
    borderRadius: 5,
    elevation: 2,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
  listContainer: {
    flex: 1,
  },
  petItem: {
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  petPhoto: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
    borderRadius: 5,
    marginBottom: 8,
  },
  petName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  petAge: {
    fontSize: 16,
    marginBottom: 4,
  },
  petDescription: {
    fontSize: 14,
    color: "#666",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
  },
  editButton: {
    backgroundColor: "#2196F3",
    padding: 8,
    borderRadius: 5,
    marginRight: 8,
    minWidth: 70,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButton: {
    backgroundColor: "#f44336",
    padding: 8,
    borderRadius: 5,
    minWidth: 70,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "#f44336",
    marginBottom: 8,
    fontSize: 14,
  },
  emptyListText: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
    marginTop: 20,
  },
});

export default MainScreen;
