import React, { createContext, useContext, useEffect, useState } from "react";
import { PetService } from "../services/PetService";
import { Pet } from "../types/pet";
import { useAuth } from "../hooks/useAuth";

type PetContextType = {
  pets: Pet[];
  loading: boolean;
  error: string | null;
  addPet: (
    pet: Omit<Pet, "id" | "createdAt" | "updatedAt" | "userId">
  ) => Promise<void>;
  updatePet: (
    id: string,
    pet: Partial<Omit<Pet, "id" | "createdAt" | "userId">>
  ) => Promise<void>;
  deletePet: (id: string) => Promise<void>;
  searchPets: (query: string) => Promise<void>;
};

export const PetContext = createContext<PetContextType | undefined>(undefined);

export const PetProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const petService = new PetService();
  const { user, userData } = useAuth();

  const fetchPets = async () => {
    if (!user || !userData) {
      setPets([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const pets = await petService.getPets();
      setPets(pets);
    } catch (err: any) {
      setError(err.message || "Failed to fetch pets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPets();
  }, [user, userData]); 

  const addPet = async (
    petData: Omit<Pet, "id" | "createdAt" | "updatedAt" | "userId">
  ) => {
    if (!user || !userData) {
      setError("You must be authenticated to add pets.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const newPet = await petService.addPet(petData);
      setPets((prevPets) => [...prevPets, newPet]);
    } catch (err: any) {
      setError(err.message || "Failed to add pet.");
    } finally {
      setLoading(false);
    }
  };

  const updatePet = async (id: string, updatedPet: Partial<Pet>) => {
    if (!user || !userData) {
      setError("You must be authenticated to update pets.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const updated = await petService.updatePet(id, updatedPet);
      setPets((prevPets) =>
        prevPets.map((pet) => (pet.id === id ? updated : pet))
      );
    } catch (err: any) {
      setError(err.message || "Failed to update pet.");
    } finally {
      setLoading(false);
    }
  };

  const deletePet = async (id: string) => {
    if (!user || !userData) {
      setError("You must be authenticated to delete pets.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await petService.deletePet(id);
      setPets((prevPets) => prevPets.filter((pet) => pet.id !== id));
    } catch (err: any) {
      setError(err.message || "Failed to delete pet.");
    } finally {
      setLoading(false);
    }
  };

  const searchPets = async (query: string) => {
    if (!user || !userData) {
      setError("You must be authenticated to search pets.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const filteredPets = await petService.searchPets(query);
      setPets(filteredPets);
    } catch (err: any) {
      setError(err.message || "Failed to search pets.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PetContext.Provider
      value={{
        pets,
        loading,
        error,
        addPet,
        updatePet,
        deletePet,
        searchPets,
      }}
    >
      {children}
    </PetContext.Provider>
  );
};

export const usePets = () => {
  const context = useContext(PetContext);
  if (!context) {
    throw new Error("usePets must be used within a PetProvider");
  }
  return context;
};