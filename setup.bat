@echo off
setlocal EnableDelayedExpansion
title Pumpify Development Environment

cls

cd /d G:\workspace\Pumpify

echo  [ %time:~0,8% ] Initializing workspace...
timeout /t 1 /nobreak >nul

echo.
echo  SYSTEM
echo  ------------------------------------------------------------
echo  Workspace       %CD%

for /f "delims=" %%A in ('node --version 2^>nul') do set NODE_VERSION=%%A
echo  Node            !NODE_VERSION!

for /f "delims=" %%A in ('java -version 2^>^&1 ^| findstr /i "version"') do set JAVA_VERSION=%%A
echo  Java            !JAVA_VERSION!

echo.

echo  PROJECT
echo  ------------------------------------------------------------

for /f "tokens=2 delims=:, " %%A in ('findstr /i "\"name\"" package.json') do (
    set PROJECT_NAME=%%A
    goto :projectfound
)

:projectfound
echo  Package         !PROJECT_NAME!

for /f "tokens=2 delims=:, " %%A in ('findstr /i "\"expo\"" package.json') do (
    set EXPO_VERSION=%%A
    goto :expofound
)

:expofound
echo  Expo            !EXPO_VERSION!

echo.

echo  GIT
echo  ------------------------------------------------------------

for /f "delims=" %%A in ('git branch --show-current 2^>nul') do set GIT_BRANCH=%%A
echo  Branch          !GIT_BRANCH!

for /f "delims=" %%A in ('git rev-parse --short HEAD 2^>nul') do set GIT_COMMIT=%%A
echo  Commit          !GIT_COMMIT!

echo.

echo  ANDROID
echo  ------------------------------------------------------------

set DEVICE_FOUND=0

for /f "skip=1 tokens=1,2" %%A in ('adb devices 2^>nul') do (
    if "%%B"=="device" (
        echo  Device          %%A
        set DEVICE_FOUND=1
    )
)

if "!DEVICE_FOUND!"=="0" (
    echo  Device          No device detected
)

echo.

echo  ------------------------------------------------------------
echo.
echo  [ %time:~0,8% ] Opening VS Code...

start "" code G:\workspace\Pumpify

timeout /t 1 /nobreak >nul

echo  [ %time:~0,8% ] Starting Expo development server...
echo.
echo  ============================================================
echo.
echo       Metro is starting in a separate terminal.
echo       Open Pumpify on your Android device.
echo.
echo  ============================================================
echo.

start "Pumpify - Expo" cmd /k "cd /d G:\workspace\Pumpify && npx expo start --dev-client"

echo.
echo  Launcher complete.
echo.
timeout /t 3 /nobreak >nul

endlocal
exit