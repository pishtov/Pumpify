import subprocess
import time
import shutil
import sys
import os

# ============================================================
# PUMPIFY DEVELOPMENT LAUNCHER
# ============================================================

PROJECT = r"G:\workspace\Pumpify"
AVD_NAME = "Pixel_10_Pro_XL"
PACKAGE_NAME = "com.anonymous.Pumpify"


# ============================================================
# COLORS
# ============================================================

CYAN = "\033[96m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
WHITE = "\033[97m"
RESET = "\033[0m"


# ============================================================
# HELPERS
# ============================================================

def print_status(message, color=WHITE):
    print(f"{color}{message}{RESET}")


def run_adb(*args):
    try:
        return subprocess.run(
            ["adb", *args],
            capture_output=True,
            text=True,
            creationflags=subprocess.CREATE_NO_WINDOW
        )
    except FileNotFoundError:
        print_status("ADB was not found.", RED)
        sys.exit(1)


def emulator_running():
    result = run_adb("get-state")
    return result.returncode == 0 and "device" in result.stdout


def kill_process_on_port(port):
    """Kill any process already listening on the given TCP port.

    Needed because terminating the expo_process on Ctrl+C only kills the
    outer npx.cmd process on Windows, not the Metro/node process it spawns.
    That leaves an orphaned server holding the port, so the next run either
    fails to bind or silently shifts ports while the app keeps a stale
    bundler URL cached.
    """
    try:
        result = subprocess.run(
            ["netstat", "-ano"],
            capture_output=True,
            text=True,
            creationflags=subprocess.CREATE_NO_WINDOW
        )
    except FileNotFoundError:
        return

    pids = set()

    for line in result.stdout.splitlines():
        parts = line.split()

        if len(parts) >= 5 and parts[0] == "TCP" and f":{port}" in parts[1] and parts[3] == "LISTENING":
            pids.add(parts[-1])

    for pid in pids:
        subprocess.run(
            ["taskkill", "/F", "/T", "/PID", pid],
            capture_output=True,
            text=True,
            creationflags=subprocess.CREATE_NO_WINDOW
        )


def android_booted():
    result = run_adb(
        "shell",
        "getprop",
        "sys.boot_completed"
    )

    return result.stdout.strip() == "1"


# ============================================================
# VISUAL BANNER
# ============================================================

def show_banner():
    os.system("cls")

    print()
    print("=" * 64)
    print()
    print("                      P U M P I F Y")
    print("                 Development Launcher")
    print()
    print("=" * 64)
    print()


# ============================================================
# OPEN VS CODE
# ============================================================

def open_vscode():
    print_status(
        "[1/4] Opening Visual Studio Code...",
        CYAN
    )

    code_path = shutil.which("code")

    if not code_path:
        print_status(
            "      VS Code command 'code' was not found.",
            RED
        )
        return

    # Prevent VS Code logs from flooding this terminal.
    subprocess.Popen(
        [code_path, PROJECT],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        creationflags=subprocess.CREATE_NO_WINDOW
    )

    print_status(
        "      VS Code opened.",
        GREEN
    )


# ============================================================
# START EMULATOR
# ============================================================

def start_emulator():
    emulator_path = os.path.join(
        os.environ["LOCALAPPDATA"],
        "Android",
        "Sdk",
        "emulator",
        "emulator.exe"
    )

    if not os.path.exists(emulator_path):
        print_status(
            "Could not find Android Emulator:",
            RED
        )
        print(emulator_path)
        sys.exit(1)

    print_status(
        "[2/4] Starting Android Emulator...",
        CYAN
    )

    subprocess.Popen(
        [
            emulator_path,
            "-avd",
            AVD_NAME
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        creationflags=subprocess.CREATE_NO_WINDOW
    )


# ============================================================
# WAIT FOR ANDROID
# ============================================================

def wait_for_emulator():

    print_status(
        "      Waiting for emulator...",
        YELLOW
    )

    dots = 0

    while not emulator_running():

        print(".", end="", flush=True)

        time.sleep(2)

        dots += 1

        if dots % 25 == 0:
            print()

    print()

    print_status(
        "      Android device detected!",
        GREEN
    )

    print_status(
        "      Waiting for Android to finish booting...",
        YELLOW
    )

    dots = 0

    while not android_booted():

        print(".", end="", flush=True)

        time.sleep(2)

        dots += 1

        if dots % 25 == 0:
            print()

    print()

    print_status(
        "      Android is ready!",
        GREEN
    )


# ============================================================
# START EXPO
# ============================================================

def start_expo():

    print_status(
        "[3/4] Starting Expo development server...",
        CYAN
    )

    # Clear out any orphaned Metro server left over from a previous
    # session that wasn't fully killed (see kill_process_on_port).
    kill_process_on_port(8081)

    print()

    print("-" * 64)
    print(" Expo development server")
    print("-" * 64)
    print()

    # Find npx on Windows.
    npx_path = (
        shutil.which("npx.cmd")
        or shutil.which("npx")
    )

    if not npx_path:
        print_status(
            "ERROR: npx was not found.",
            RED
        )
        return None

    # IMPORTANT:
    # Do NOT use CREATE_NO_WINDOW here.
    # Expo will use this same CMD window so you can
    # see Metro logs and use Expo keyboard commands.
    expo_process = subprocess.Popen(
        [
            npx_path,
            "expo",
            "start",
            "--dev-client"
        ],
        cwd=PROJECT,
        creationflags=subprocess.CREATE_NEW_PROCESS_GROUP
    )

    return expo_process


def stop_expo(expo_process):
    """Kill the full Expo/Metro process tree, not just npx.cmd itself."""
    subprocess.run(
        ["taskkill", "/F", "/T", "/PID", str(expo_process.pid)],
        capture_output=True,
        text=True,
        creationflags=subprocess.CREATE_NO_WINDOW
    )


# ============================================================
# LAUNCH PUMPIFY
# ============================================================

def launch_app():

    print_status(
        "[4/4] Launching Pumpify...",
        CYAN
    )

    # Give Expo a moment to initialize Metro.
    time.sleep(4)

    result = run_adb(
        "shell",
        "monkey",
        "-p",
        PACKAGE_NAME,
        "1"
    )

    if result.returncode == 0:

        print_status(
            "      Pumpify launched!",
            GREEN
        )

    else:

        print_status(
            "      Could not launch Pumpify.",
            RED
        )

        if result.stderr:
            print(result.stderr)


# ============================================================
# MAIN
# ============================================================

def main():

    show_banner()

    # --------------------------------------------------------
    # Check ADB
    # --------------------------------------------------------

    if not shutil.which("adb"):

        print_status(
            "ERROR: ADB was not found in PATH.",
            RED
        )

        print()
        input("Press Enter to exit...")
        return

    # --------------------------------------------------------
    # Open VS Code
    # --------------------------------------------------------

    open_vscode()

    print()

    # --------------------------------------------------------
    # Start emulator if necessary
    # --------------------------------------------------------

    if emulator_running():

        print_status(
            "[2/4] Android Emulator is already running.",
            GREEN
        )

    else:

        start_emulator()

    # --------------------------------------------------------
    # Wait for Android
    # --------------------------------------------------------

    wait_for_emulator()

    print()

    # --------------------------------------------------------
    # Start Expo
    # --------------------------------------------------------

    expo_process = start_expo()

    if expo_process is None:

        input("Press Enter to exit...")
        return

    # --------------------------------------------------------
    # Launch installed development build
    # --------------------------------------------------------

    launch_app()

    print()
    print("=" * 64)
    print()
    print(" Pumpify development environment is ready.")
    print()
    print(" VS Code      : OPEN")
    print(" Android      : READY")
    print(" Expo/Metro   : RUNNING")
    print(" Pumpify      : LAUNCHED")
    print()
    print("=" * 64)
    print()

    # Keep Python alive while Expo is running.
    # Expo owns the terminal and displays its normal logs.
    try:

        expo_process.wait()

    except KeyboardInterrupt:

        print()
        print_status(
            "Stopping Pumpify development session...",
            YELLOW
        )

        stop_expo(expo_process)

    print()
    print("=" * 64)
    print()
    print(" Development session ended.")
    print()
    print("=" * 64)
    print()

    input("Press Enter to exit...")


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":
    main()