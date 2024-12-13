
  import { 
    collection,
    doc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    serverTimestamp,
    getDoc
  } from 'firebase/firestore';
  import { db, auth } from '../config/firebase';
import { Pet } from '../types/pet';
  
  export class PetService {
    private collection = 'pets';
  
    async getPets(): Promise<Pet[]> {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error('User not authenticated');
  
        const petsQuery = query(
          collection(db, this.collection),
          where('userId', '==', user.uid)
        );
  
        const querySnapshot = await getDocs(petsQuery);
        return querySnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        })) as Pet[];
      } catch (error) {
        console.error('Error getting pets:', error);
        throw error;
      }
    }
  
    async addPet(pet: Omit<Pet, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<Pet> {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error('User not authenticated');
  
        const duplicateQuery = query(
          collection(db, this.collection),
          where('userId', '==', user.uid),
          where('name', '==', pet.name)
        );
        const duplicateCheck = await getDocs(duplicateQuery);
        if (!duplicateCheck.empty) {
          throw new Error('A pet with this name already exists');
        }
  
        const docRef = await addDoc(collection(db, this.collection), {
          ...pet,
          userId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
  
        const newPet = await getDoc(docRef);
        return {
          ...newPet.data(),
          id: docRef.id,
        } as Pet;
      } catch (error) {
        console.error('Error adding pet:', error);
        throw error;
      }
    }
  
    async updatePet(id: string, pet: Partial<Omit<Pet, 'id' | 'createdAt' | 'userId'>>): Promise<Pet> {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error('User not authenticated');
  
        const petDoc = await getDoc(doc(db, this.collection, id));
        if (!petDoc.exists()) throw new Error('Pet not found');
        if (petDoc.data()?.userId !== user.uid) throw new Error('Unauthorized');
  
        if (pet.name) {
          const duplicateQuery = query(
            collection(db, this.collection),
            where('userId', '==', user.uid),
            where('name', '==', pet.name)
          );
          const duplicateCheck = await getDocs(duplicateQuery);
          const duplicate = duplicateCheck.docs.find(doc => doc.id !== id);
          if (duplicate) {
            throw new Error('A pet with this name already exists');
          }
        }
  
        await updateDoc(doc(db, this.collection, id), {
          ...pet,
          updatedAt: serverTimestamp(),
        });
  
        const updatedPet = await getDoc(doc(db, this.collection, id));
        return {
          ...updatedPet.data(),
          id,
        } as Pet;
      } catch (error) {
        console.error('Error updating pet:', error);
        throw error;
      }
    }
  
    async deletePet(id: string): Promise<void> {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error('User not authenticated');
  
        const petDoc = await getDoc(doc(db, this.collection, id));
        if (!petDoc.exists()) throw new Error('Pet not found');
        if (petDoc.data()?.userId !== user.uid) throw new Error('Unauthorized');
  
        await deleteDoc(doc(db, this.collection, id));
      } catch (error) {
        console.error('Error deleting pet:', error);
        throw error;
      }
    }
  
    async searchPets(searchQuery: string): Promise<Pet[]> {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error('User not authenticated');
  
        const petsQuery = query(
          collection(db, this.collection),
          where('userId', '==', user.uid)
        );
  
        const querySnapshot = await getDocs(petsQuery);
        const pets = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        })) as Pet[];
  
        return pets.filter(pet => 
          pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pet.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      } catch (error) {
        console.error('Error searching pets:', error);
        throw error;
      }
    }
  }
  
  