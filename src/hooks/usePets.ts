import { useCallback, useContext } from "react";
import { PetContext } from "../context/PetContext";
import { Pet } from "../types/pet";



export const usePets = () => {
  const context = useContext(PetContext);

  if (!context) {
    throw new Error("usePetContext must be used within a PetProvider");
  }

  const { 
    pets,
    loading,
    error,
    addPet: addPetContext,
    updatePet: updatePetContext, 
    deletePet: deletePetContext,
    searchPets: searchPetsContext
  } = context;

  const addPet = useCallback(async (petData: Pet) => {
    return addPetContext(petData);
  }, [addPetContext]);

  const updatePet = useCallback(async (
    id: string,
    petData: Pet
  ) => {
    return updatePetContext(id, petData);
  }, [updatePetContext]);

  const deletePet = useCallback(async (id: string) => {
    return deletePetContext(id);
  }, [deletePetContext]);

  const searchPets = useCallback(async (query: string) => {
    return searchPetsContext(query);
  }, [searchPetsContext]);

  return {
    pets,
    loading,
    error,
    addPet,
    updatePet,
    deletePet, 
    searchPets
  };
};