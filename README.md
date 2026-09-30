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

### Development Launcher (Windows)

`start_setup.py` starts the whole development environment with a single command. It is written for Windows and expects the development build to already be installed on the emulator (see [Running the Application](#running-the-application)).

```bash
python start_setup.py
```

The launcher runs these steps:

1. Opens the project in Visual Studio Code.
2. Starts the Android Emulator, unless one is already running, and waits until Android has finished booting.
3. Force-stops any leftover Pumpify process on the emulator. A restored Quick Boot snapshot can keep the app attached to a dead Metro server, which breaks Fast Refresh.
4. Frees port `8081` if an orphaned Metro server from a previous session is still holding it.
5. Starts Expo with `npx expo start --dev-client --android`. Expo opens Pumpify itself once Metro is ready and sets up `adb reverse`, so the app always connects to the current server.
6. Waits for Metro to answer on `http://127.0.0.1:8081/status` (up to 120 seconds) and reports whether Metro is running and whether Pumpify was opened.

Expo keeps the terminal, so Metro logs and Expo keyboard commands work as usual. Press `Ctrl+C` to stop the whole Expo/Metro process tree and end the session.

**Requirements:** Python 3, plus `adb`, `code` and `npx` available in your `PATH`. The emulator is expected at `%LOCALAPPDATA%\Android\Sdk\emulator\emulator.exe`.

**Configuration:** the following constants at the top of `start_setup.py` are specific to one machine and should be edited for yours:

| Constant | Description |
| --- | --- |
| `PROJECT` | Absolute path to the Pumpify project folder |
| `AVD_NAME` | Name of the Android Virtual Device to start |
| `PACKAGE_NAME` | Android package name of the app (`com.anonymous.Pumpify`) |

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
