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
import * as ImagePicker from "expo-image-picker";
import { Formik } from "formik";
import * as Yup from "yup";
import { RootStackParamList } from "../types";
import { usePets } from "../hooks/usePets";
import { Pet } from "../types/pet";
import { Picker } from "@react-native-picker/picker";

type MainScreenNavigationProp = StackNavigationProp<RootStackParamList, "Main">;

const PetSchema = Yup.object().shape({
  name: Yup.string().required("Name is required"),
  age: Yup.string().required("Age is required"),
  category: Yup.string().required("Category is required"),
  breed: Yup.string().required("Breed is required"),
  description: Yup.string(),
  photo: Yup.string(),
});

const petCategories = ["Dog", "Cat", "Bird", "Other"];

const MainScreen: React.FC = () => {
  const navigation = useNavigation<MainScreenNavigationProp>();
  const { signOut, userData, user } = useAuth();
  const { pets, loading, error, addPet, updatePet, deletePet, searchPets } = usePets();
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    if (searchQuery || categoryFilter) {
      searchPets(searchQuery);
    }
  }, [searchQuery, categoryFilter]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
      Alert.alert("Error", "Failed to sign out. Please try again.");
    }
  };

  const handleSubmit = async (
    values: Omit<Pet, "id" | "createdAt" | "updatedAt" | "userId">,
    { resetForm }: { resetForm: () => void }
  ) => {
    try {
      if (editingPet) {
        await updatePet(editingPet.id!, values);
        Alert.alert("Success", "Pet updated successfully");
      } else {
        await addPet(values);
        Alert.alert("Success", "Pet added successfully");
      }
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
                await deletePet(id);
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
    [deletePet]
  );

  const pickImage = async (
    setFieldValue: (field: string, value: any) => void
  ) => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
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
      (categoryFilter === "" || pet.category === categoryFilter)
  );

  const renderPetItem = useCallback(
    ({ item }: { item: Pet }) => (
      <View style={styles.petItem}>
        {item.photo && (
          <Image
            source={{ uri: item.photo }}
            style={styles.petPhoto}
          />
        )}
        <Text style={styles.petName}>{item.name}</Text>
        <Text style={styles.petInfo}>Age: {item.age}</Text>
        <Text style={styles.petInfo}>Category: {item.category}</Text>
        <Text style={styles.petInfo}>Breed: {item.breed}</Text>
        {item.description && (
          <Text style={styles.petDescription} numberOfLines={2}>
            {item.description}
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
            onPress={() => handleDelete(item.id!)}
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

  if (!user || !userData) {
    return (
      <View style={styles.centerContainer}>
        <Text>No user data found. Please log in again.</Text>
        <TouchableOpacity onPress={handleSignOut} style={styles.button}>
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
          <Picker
            selectedValue={categoryFilter}
            onValueChange={(itemValue) => setCategoryFilter(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="All Categories" value="" />
            {petCategories.map((category) => (
              <Picker.Item key={category} label={category} value={category} />
            ))}
          </Picker>
        </View>

        <Formik
          initialValues={
            editingPet || { name: "", age: "", category: "", breed: "", description: "", photo: "" }
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

              <Picker
                selectedValue={values.category}
                onValueChange={(itemValue) => setFieldValue("category", itemValue)}
                style={[
                  styles.input,
                  touched.category && errors.category && styles.inputError,
                ]}
              >
                <Picker.Item label="Select Category" value="" />
                {petCategories.map((category) => (
                  <Picker.Item key={category} label={category} value={category} />
                ))}
              </Picker>
              {touched.category && errors.category && (
                <Text style={styles.errorText}>{errors.category}</Text>
              )}

              <TextInput
                style={[
                  styles.input,
                  touched.breed && errors.breed && styles.inputError,
                ]}
                value={values.breed}
                onChangeText={handleChange("breed")}
                onBlur={handleBlur("breed")}
                placeholder="Pet Breed"
              />
              {touched.breed && errors.breed && (
                <Text style={styles.errorText}>{errors.breed}</Text>
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
                style={styles.submitButton}
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
              keyExtractor={(item) => item.id!}
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
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  signOutButton: {
    backgroundColor: "#f44336",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
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
    padding: 12,
    borderRadius: 25,
    marginBottom: 8,
    fontSize: 16,
  },
  picker: {
    backgroundColor: "#fff",
    marginBottom: 8,
    borderRadius: 25,
  },
  formContainer: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 15,
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
    borderRadius: 25,
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
    borderRadius: 25,
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
    borderRadius: 15,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: "#4CAF50",
    padding: 16,
    borderRadius: 25,
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
    borderRadius: 15,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  petPhoto: {
    width: "100%",
    height: 150,
    borderRadius: 10,
    marginBottom: 8,
  },
  petName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#333",
  },
  petInfo: {
    fontSize: 16,
    marginBottom: 2,
    color: "#666",
  },
  petDescription: {
    fontSize: 14,
    color: "#888",
    marginTop: 4,
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  editButton: {
    backgroundColor: "#2196F3",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
  },
  deleteButton: {
    backgroundColor: "#f44336",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  errorText: {
    color: "#f44336",
    marginBottom: 8,
    fontSize: 14,
  },
  emptyListText: {
    textAlign: "center",
    fontSize: 18,
    color: "#666",
    marginTop: 20,
  },
});

export default MainScreen;

