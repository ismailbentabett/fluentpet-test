## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Xcode (for iOS development, Mac only)
- Android Studio (for Android development)
- Expo Go app on your mobile device (for testing)

### Installation

1. Clone the repository:

`git clone <repository-url>`
`cd pet-manager`

2. Install dependencies:

`npm install`

### Running the App

#### On iOS Simulator:

1. Install Xcode from the Mac App Store
2. Install iOS Simulator:
   - Open Xcode
   - Go to Xcode > Preferences > Components
   - Download a simulator
3. Run the app:
   `npm run ios`

#### On Android Emulator:

1. Install Android Studio
2. Set up an Android Virtual Device (AVD):
   - Open Android Studio
   - Go to Tools > Device Manager
   - Click "Create Device"
   - Select a device (e.g., Pixel 4)
   - Download and select an Android version
3. Run the app:
   `npm run android`

#### On Physical Device:

- Scan the QR code with Expo Go (Android)
- Scan the QR code with Camera app (iOS)
