Sure — I'd also make it a little more professional and minimal.

# Pumpify

Pumpify is a fitness application for tracking workout routines, creating systems, and building consistent habits.

> **Status:** In active development.

## Features

Planned and developing features include:

* Create and manage workout routines
* Organize exercises into structured workouts
* Track workouts and progress
* Build and maintain fitness habits
* Create systems that encourage consistency
* View activity and progress over time

## Tech Stack

* React Native
* Expo SDK 57
* Expo Development Build
* JavaScript
* Android / Native Android
* Metro

## Getting Started

### Prerequisites

Make sure you have the following installed:

* Node.js
* Android Studio
* Android SDK
* Android SDK Platform-Tools (`adb`)
* JDK 17 or later

You will also need an Android device with USB debugging enabled or an Android emulator.

### Installation

Clone the repository:

```bash
git clone https://github.com/pishtov/Pumpify.git
cd Pumpify
```

Install dependencies:

```bash
npm install
```

### Running the Application

For the first native Android build:

```bash
npx expo run:android
```

This builds and installs the Pumpify development build on a connected Android device.

After the development build has been installed, start the development server:

```bash
npx expo start --dev-client
```

Then open the Pumpify development build on your device.

### Development

For normal development:

```bash
npx expo start --dev-client
```

A native rebuild may be required after installing native dependencies or changing native Android configuration:

```bash
npx expo run:android
```

## Roadmap

Pumpify is currently under active development.

* [ ] Workout routine creation
* [ ] Exercise library
* [ ] Workout tracking
* [ ] Habit tracking
* [ ] Progress statistics
* [ ] Workout history
* [ ] Personal goals
* [ ] Improved UI/UX
* [ ] Production Android build

## Contributing

Pumpify is currently a personal project under active development.

Contribution guidelines may be added as the project grows.

## License

This project is licensed under the MIT License.

---

Built by [pishtov](https://github.com/pishtov)
