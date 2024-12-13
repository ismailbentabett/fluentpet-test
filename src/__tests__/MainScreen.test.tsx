/* import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { useAuth } from '../hooks/useAuth';
import { usePets } from '../hooks/usePets';
import MainScreen from '../screens/MainScreen';

jest.mock('../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../hooks/usePets', () => ({
  usePets: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

// Mock ImagePicker
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: {
    Images: 'Images',
  },
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
}));

describe('MainScreen', () => {
  const mockUser = { displayName: 'Test User' };
  const mockPets = [
    { id: '1', name: 'Fluffy', age: '3', category: 'Cat', breed: 'Persian' },
    { id: '2', name: 'Buddy', age: '5', category: 'Dog', breed: 'Labrador' },
  ];

  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      userData: {},
      signOut: jest.fn(),
    });

    (usePets as jest.Mock).mockReturnValue({
      pets: mockPets,
      loading: false,
      error: null,
      addPet: jest.fn(),
      updatePet: jest.fn(),
      deletePet: jest.fn(),
      searchPets: jest.fn(),
    });
  });

  it('renders correctly', () => {
    const { getByText, getAllByText } = render(<MainScreen />);
    expect(getByText(`Welcome, ${mockUser.displayName}`)).toBeTruthy();
    expect(getByText('Sign Out')).toBeTruthy();
    expect(getAllByText('Fluffy')).toBeTruthy();
    expect(getAllByText('Buddy')).toBeTruthy();
  });

  it('allows searching for pets', async () => {
    const { getByPlaceholderText, getByText, queryByText } = render(<MainScreen />);
    const searchInput = getByPlaceholderText('Search pets by name');
    fireEvent.changeText(searchInput, 'Fluffy');
    await waitFor(() => {
      expect(getByText('Fluffy')).toBeTruthy();
      expect(queryByText('Buddy')).toBeNull();
    });
  });

  it('allows adding a new pet', async () => {
    const { getByPlaceholderText, getByText } = render(<MainScreen />);
    const nameInput = getByPlaceholderText('Pet Name');
    const ageInput = getByPlaceholderText('Pet Age');
    const breedInput = getByPlaceholderText('Pet Breed');
    
    fireEvent.changeText(nameInput, 'Max');
    fireEvent.changeText(ageInput, '2');
    fireEvent.changeText(breedInput, 'Golden Retriever');
    
    const addButton = getByText('Add Pet');
    fireEvent.press(addButton);

    await waitFor(() => {
      expect(usePets().addPet).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Max',
        age: '2',
        breed: 'Golden Retriever',
      }));
    });
  });

  it('allows deleting a pet', async () => {
    const { getAllByText } = render(<MainScreen />);
    const deleteButtons = getAllByText('Delete');
    fireEvent.press(deleteButtons[0]);

    await waitFor(() => {
      expect(usePets().deletePet).toHaveBeenCalledWith('1');
    });
  });

  it('displays loading indicator when loading', () => {
    (usePets as jest.Mock).mockReturnValue({
      ...usePets(),
      loading: true,
    });

    const { getByTestId } = render(<MainScreen />);
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('displays error message when there is no user data', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      userData: null,
      signOut: jest.fn(),
    });

    const { getByText } = render(<MainScreen />);
    expect(getByText('No user data found. Please log in again.')).toBeTruthy();
  });

  it('allows editing a pet', async () => {
    const { getAllByText, getByPlaceholderText, getByText } = render(<MainScreen />);
    const editButtons = getAllByText('Edit');
    fireEvent.press(editButtons[0]);

    const nameInput = getByPlaceholderText('Pet Name');
    fireEvent.changeText(nameInput, 'Fluffy Updated');

    const updateButton = getByText('Update Pet');
    fireEvent.press(updateButton);

    await waitFor(() => {
      expect(usePets().updatePet).toHaveBeenCalledWith('1', expect.objectContaining({
        name: 'Fluffy Updated',
      }));
    });
  });

  it('allows filtering pets by category', async () => {
    const { getByTestId, queryByText } = render(<MainScreen />);
    const picker = getByTestId('category-picker');
    fireEvent(picker, 'onValueChange', 'Cat');

    await waitFor(() => {
      expect(queryByText('Fluffy')).toBeTruthy();
      expect(queryByText('Buddy')).toBeNull();
    });
  });
});

 */