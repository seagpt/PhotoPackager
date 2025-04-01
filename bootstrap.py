#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Universal Environment Bootstrap Script for Python Projects (v3.0.0)

Purpose:
    This script verifies and sets up the required Python environment before running
    the main application. It:
      1. Checks that Python is at least a minimum version.
      2. Ensures a virtual environment (venv) is active, or guides the user to create one.
      3. Optionally updates pip.
      4. Reads the project's requirements.txt.
      5. Checks for installed packages using a generic method (via importlib.metadata).
      6. Prompts to install any missing dependencies.
      7. Uses caching (based on requirements.txt hash and Python version) to skip work on subsequent runs.
      8. Offers an initial prompt to skip checks.
      
Usage:
    Typically invoked at the start of the main project via:
        subprocess.check_call([sys.executable, "bootstrap.py"])
        
Copyright (c) 2025 Steven Seagondollar, DropShock Digital LLC
License: MIT License (see LICENSE.md for full details)
"""

# --- Standard Library Imports ---
import sys
import subprocess
import os
import platform
import hashlib
import configparser
import time
import logging
from pathlib import Path
from typing import List, Tuple, Optional
import importlib.metadata  # For checking installed packages (Python 3.8+)

# ----------------------------------------
# --- Constants & Configuration ---
# ----------------------------------------

# ANSI color codes for clear, consistent output
YELLOW: str = "\033[93m"
RED: str = "\033[91m"
GREEN: str = "\033[92m"
BOLD: str = "\033[1m"
RESET: str = "\033[0m"

# Configuration parameters
MIN_PYTHON_VERSION: Tuple[int, int, int] = (3, 8, 0)  # Minimum required Python version
VENV_DIR_NAME: str = "venv"                           # Name of the virtual environment directory
REQUIREMENTS_FILE: str = "requirements.txt"         # Dependency file name
CACHE_FILE_NAME: str = ".bootstrap_cache"           # Cache file name (should be gitignored)
TOTAL_STEPS: int = 6                                  # Total numbered steps (excluding the optional skip prompt)

# Set up basic logging (warnings and errors)
logging.basicConfig(
    level=logging.WARNING,
    format="%(asctime)s [%(levelname)-7s] [bootstrap] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger(__name__)

# ----------------------------------------
# --- Helper Functions ---
# ----------------------------------------

def _calculate_req_hash(req_path: Path) -> Optional[str]:
    """
    Calculates the SHA256 hash of the requirements.txt file.
    This hash is used to determine if the dependencies have changed.
    """
    if not req_path.is_file():
        logger.debug(f"Requirements file not found: {req_path}")
        return None
    try:
        hasher = hashlib.sha256()
        with open(req_path, "rb") as f:
            while chunk := f.read(8192):
                hasher.update(chunk)
        hash_value = hasher.hexdigest()
        logger.debug(f"Requirements hash: {hash_value[:8]}...")
        return hash_value
    except Exception as e:
        logger.error(f"Error calculating requirements hash: {e}", exc_info=True)
        return None

def _read_cache(cache_path: Path) -> Tuple[Optional[str], Optional[str]]:
    """
    Reads the cache file for the stored requirements hash and Python version.
    Returns (hash, python_version) if available.
    """
    if not cache_path.is_file():
        logger.debug("Cache file does not exist.")
        return None, None
    try:
        parser = configparser.ConfigParser()
        with open(cache_path, 'r', encoding='utf-8') as cf:
            parser.read_file(cf)
        if 'Cache' not in parser:
            logger.warning("Cache file missing 'Cache' section.")
            return None, None
        req_hash = parser.get('Cache', 'RequirementsHash', fallback=None)
        py_version = parser.get('Cache', 'PythonVersion', fallback=None)
        logger.debug(f"Cache read: Hash={req_hash[:8] if req_hash else 'None'}; Python={py_version}")
        return req_hash, py_version
    except Exception as e:
        logger.error(f"Error reading cache: {e}", exc_info=True)
        return None, None

def _write_cache(cache_path: Path, req_hash: Optional[str], python_version: str) -> None:
    """
    Writes the current requirements hash and Python version to the cache file.
    """
    if req_hash is None:
        logger.debug("No requirements hash; cache not written.")
        if cache_path.exists():
            try:
                cache_path.unlink()
                logger.debug("Old cache file removed.")
            except Exception as e:
                logger.warning(f"Could not remove old cache: {e}")
        return
    try:
        parser = configparser.ConfigParser()
        parser['Cache'] = {
            'RequirementsHash': req_hash,
            'PythonVersion': python_version,
            'Timestamp': time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }
        with open(cache_path, 'w', encoding='utf-8') as cf:
            parser.write(cf)
        logger.info("Cache updated successfully.")
    except Exception as e:
        logger.error(f"Error writing cache: {e}", exc_info=True)

def _clean_pkg_name(pkg_spec: str) -> Optional[str]:
    """
    Cleans a package specification line by removing version specifiers,
    markers, and comments. Returns the base package name.
    """
    line = pkg_spec.strip()
    if not line or line.startswith('#'):
        return None
    # Remove inline comments and markers
    line = line.split('#')[0].split(';')[0]
    # Remove version specifiers (==, >=, <=, ~=, >, <)
    for spec in ['==', '>=', '<=', '~=', '>', '<']:
        if spec in line:
            line = line.split(spec)[0]
    # Remove extras (e.g. package[extra])
    if '[' in line:
        line = line.split('[')[0]
    return line.strip() or None

def is_package_installed(pkg_spec: str) -> bool:
    """
    Checks whether the given package (from requirements.txt) is installed.
    Uses importlib.metadata to check installation by the cleaned package name.
    """
    pkg_name = _clean_pkg_name(pkg_spec)
    if not pkg_name:
        logger.debug(f"Skipping non-package line: {pkg_spec}")
        return True  # Non-package line is ignored
    logger.debug(f"Checking installation status for: {pkg_name}")
    try:
        importlib.metadata.distribution(pkg_name)
        return True
    except importlib.metadata.PackageNotFoundError:
        return False
    except Exception as e:
        logger.warning(f"Error checking package {pkg_name}: {e}")
        return False

def print_activation_help() -> None:
    """
    Prints instructions for activating the virtual environment, tailored to the OS.
    """
    is_win = platform.system() == "Windows"
    venv_path = Path(VENV_DIR_NAME)
    folder = 'Scripts' if is_win else 'bin'
    activation = venv_path / folder / ('Activate.ps1' if is_win else 'activate')
    print(f"\n{YELLOW}{BOLD}-- Activate Virtual Environment --{RESET}")
    if is_win:
        print(f"CMD: {venv_path / folder / 'activate.bat'}")
        print(f"PowerShell: .\\{activation}")
        try:
            result = subprocess.run(["powershell", "-Command", "Get-ExecutionPolicy"],
                                    capture_output=True, text=True, timeout=3)
            if "Restricted" in result.stdout:
                print(f"\n{RED}{BOLD}⚠ PS Policy Alert:{RESET}")
                print(f"If activation fails, run: {BOLD}Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process{RESET}")
        except Exception:
            print(f"{YELLOW}Unable to determine PowerShell execution policy.{RESET}")
    else:
        print(f"Shell: source {activation}")
    print(f"Look for '({VENV_DIR_NAME})' in your prompt when active.")

# ----------------------------------------
# --- Core Check Functions ---
# ----------------------------------------

def check_python_version() -> str:
    """
    STEP 1: Verify that the running Python interpreter meets the minimum version.
    Exits if not.
    """
    print(f"{YELLOW}{BOLD}[STEP 1/{TOTAL_STEPS}] Checking Python Version...{RESET}")
    current = sys.version_info[:3]
    current_str = f"{current[0]}.{current[1]}.{current[2]}"
    if current < MIN_PYTHON_VERSION:
        required = ".".join(map(str, MIN_PYTHON_VERSION))
        print(f"{RED}{BOLD}ERROR: Python {current_str} is too old. Requires {required}+.{RESET}")
        sys.exit(1)
    print(f"{GREEN}[STEP 1/{TOTAL_STEPS}] ✓ Python version {current_str} is acceptable.{RESET}")
    return current_str

def check_virtualenv() -> None:
    """
    STEP 2: Ensure that the script is running inside a virtual environment.
    If not, prompt the user to create one or to proceed globally (not recommended).
    """
    print(f"{YELLOW}{BOLD}[STEP 2/{TOTAL_STEPS}] Checking Virtual Environment...{RESET}")
    if hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
        print(f"{GREEN}[STEP 2/{TOTAL_STEPS}] ✓ Running inside a venv ('{Path(sys.prefix).name}').{RESET}")
        return
    # Not in a venv: prompt the user.
    print(f"{YELLOW}{BOLD}WARNING: Not running in a virtual environment!{RESET}")
    while True:
        choice = input(f"{YELLOW}Create a venv '{VENV_DIR_NAME}' now? [Y/n]: {RESET}").strip().lower()
        if choice in ('y', ''):
            print(f"{YELLOW}Creating venv '{VENV_DIR_NAME}'...{RESET}")
            try:
                subprocess.check_call([sys.executable, "-m", "venv", VENV_DIR_NAME])
            except Exception as e:
                print(f"{RED}{BOLD}ERROR: Venv creation failed: {e}{RESET}")
                sys.exit(1)
            print(f"{GREEN}{BOLD}✓ Venv created successfully!{RESET}")
            print_activation_help()
            print(f"{YELLOW}Please activate your venv and re-run the script.{RESET}")
            sys.exit(0)
        elif choice == 'n':
            while True:
                proceed = input(f"{YELLOW}Proceed without venv? (Not Recommended) [y/N]: {RESET}").strip().lower()
                if proceed in ('y',):
                    print(f"{YELLOW}Proceeding globally as per user choice...{RESET}")
                    return
                elif proceed in ('n', ''):
                    print(f"{RED}Aborting. Virtual environment is required for best practice.{RESET}")
                    print_activation_help()
                    sys.exit(1)
                else:
                    print(f"{RED}Invalid input. Please type 'y' or 'n'.{RESET}")
        else:
            print(f"{RED}Invalid input. Please type 'y' or 'n'.{RESET}")

def check_and_update_pip() -> None:
    """
    STEP 4: Check if pip is outdated and, if so, prompt the user to upgrade.
    """
    print(f"{YELLOW}{BOLD}[STEP 4/{TOTAL_STEPS}] Checking pip version...{RESET}")
    try:
        result = subprocess.run(
            [sys.executable, "-m", "pip", "list", "--outdated", "--format=json"],
            capture_output=True, text=True, timeout=30
        )
        if result.returncode == 0 and result.stdout:
            import json
            outdated = json.loads(result.stdout)
            for pkg in outdated:
                if pkg.get("name", "").lower() == "pip":
                    current_ver = pkg.get('version', '?')
                    latest_ver = pkg.get('latest_version', '?')
                    print(f"{YELLOW}pip is outdated ({current_ver} -> {latest_ver}).{RESET}")
                    while True:
                        answer = input(f"{YELLOW}Upgrade pip to {latest_ver}? [Y/n]: {RESET}").strip().lower()
                        if answer in ('y', ''):
                            print(f"{YELLOW}Upgrading pip...{RESET}")
                            subprocess.check_call([sys.executable, "-m", "pip", "install", "--upgrade", "pip"])
                            print(f"{GREEN}✓ pip upgraded successfully.{RESET}")
                            break
                        elif answer == 'n':
                            print(f"{YELLOW}Skipping pip upgrade.{RESET}")
                            break
                        else:
                            print(f"{RED}Invalid input. Enter 'y' or 'n'.{RESET}")
                    break
        else:
            print(f"{YELLOW}Could not check pip status. Continuing...{RESET}")
    except Exception as e:
        logger.warning(f"Pip check error: {e}")
        print(f"{YELLOW}Error checking pip version. Continuing...{RESET}")
    print(f"{GREEN}[STEP 4/{TOTAL_STEPS}] ✓ pip check complete.{RESET}")

def read_requirements() -> List[str]:
    """
    Reads the requirements file and returns a list of requirement strings.
    Ignores comments and blank lines.
    """
    req_path = Path(REQUIREMENTS_FILE)
    if not req_path.is_file():
        print(f"{YELLOW}No {REQUIREMENTS_FILE} found; skipping dependency checks.{RESET}")
        return []
    try:
        with open(req_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
        reqs = [line.strip() for line in lines if line.strip() and not line.strip().startswith("#")]
        return reqs
    except Exception as e:
        logger.error(f"Error reading {REQUIREMENTS_FILE}: {e}", exc_info=True)
        return []

def check_and_install_dependencies() -> bool:
    """
    STEPS 5 & 6: Checks all packages in requirements.txt using importlib.metadata.
    If any package is missing, prompts the user to install it.
    Returns True if all dependencies are met or installed; False otherwise.
    """
    reqs = read_requirements()
    if not reqs:
        print(f"{GREEN}[STEP 5/{TOTAL_STEPS}] ✓ No dependencies to check.{RESET}")
        print(f"{GREEN}[STEP 6/{TOTAL_STEPS}] ✓ Nothing to install.{RESET}")
        return True

    print(f"{YELLOW}{BOLD}[STEP 5/{TOTAL_STEPS}] Checking dependencies...{RESET}")
    missing = [req for req in reqs if not is_package_installed(req)]
    print(f"{GREEN}[STEP 5/{TOTAL_STEPS}] Dependency check complete.{RESET}")
    if not missing:
        print(f"{GREEN}[STEP 6/{TOTAL_STEPS}] ✓ All dependencies are installed.{RESET}")
        return True

    # List the cleaned package names for user clarity
    missing_names = [ _clean_pkg_name(req) for req in missing if _clean_pkg_name(req)]
    print(f"{YELLOW}Missing packages: {BOLD}{', '.join(missing_names)}{RESET}")
    while True:
        answer = input(f"{YELLOW}Install missing dependencies? [Y/n]: {RESET}").strip().lower()
        if answer in ('y', ''):
            break
        elif answer == 'n':
            print(f"{RED}Aborting dependency installation. Required dependencies missing.{RESET}")
            return False
        else:
            print(f"{RED}Invalid input. Please type 'y' or 'n'.{RESET}")

    print(f"{YELLOW}{BOLD}[STEP 6/{TOTAL_STEPS}] Installing missing dependencies...{RESET}")
    install_failed = False
    for req in missing:
        pkg_name = _clean_pkg_name(req)
        if not pkg_name:
            continue
        print(f"{YELLOW}Installing {pkg_name}...{RESET}")
        try:
            subprocess.check_call(
                [sys.executable, "-m", "pip", "install", pkg_name],
                stdout=subprocess.DEVNULL, stderr=subprocess.PIPE
            )
            print(f"{GREEN}✓ {pkg_name} installed successfully.{RESET}")
        except subprocess.CalledProcessError as e:
            print(f"{RED}{BOLD}ERROR: Failed to install {pkg_name}.{RESET}")
            if e.stderr:
                try:
                    err = e.stderr.decode(errors='ignore')
                    print(f"{RED}pip error output:\n{err}{RESET}")
                except Exception:
                    pass
            install_failed = True
        except Exception as e:
            print(f"{RED}{BOLD}ERROR: Unexpected error installing {pkg_name}: {e}{RESET}")
            install_failed = True

    if install_failed:
        print(f"{RED}{BOLD}[STEP 6/{TOTAL_STEPS}] ✗ Dependency installation failed.{RESET}")
        return False
    else:
        print(f"{GREEN}{BOLD}[STEP 6/{TOTAL_STEPS}] ✓ All missing dependencies installed.{RESET}")
        return True

# ----------------------------------------
# --- Main Execution Block ---
# ----------------------------------------

if __name__ == "__main__":
    # --- Optional Skip Prompt ---
    print(f"{YELLOW}This script checks Python version, venv, pip, and dependencies.{RESET}")
    while True:
        choice = input(f"{YELLOW}Perform environment checks now? [Y/n]: {RESET}").strip().lower()
        if choice in ('n'):
            print(f"{GREEN}Skipping environment checks by user request.{RESET}")
            sys.exit(0)
        elif choice in ('y', ''):
            print(f"{GREEN}Proceeding with environment checks...{RESET}")
            break
        else:
            print(f"{RED}Invalid input. Please enter 'y' or 'n'.{RESET}")

    print(f"{YELLOW}{'-'*60}{RESET}")
    start_time = time.time()
    success = False
    req_path = Path(REQUIREMENTS_FILE)
    cache_path = Path(CACHE_FILE_NAME)

    try:
        # STEP 1: Check Python Version
        py_version = check_python_version()

        # STEP 2: Check or Create Virtual Environment
        check_virtualenv()

        # STEP 3: Check Cache
        print(f"{YELLOW}{BOLD}[STEP 3/{TOTAL_STEPS}] Checking environment cache...{RESET}")
        cached_hash, cached_py = _read_cache(cache_path)
        current_hash = _calculate_req_hash(req_path)
        # Compare major.minor version strings for Python
        current_py_short = ".".join(py_version.split('.')[:2])
        cached_py_short = ".".join(cached_py.split('.')[:2]) if cached_py else None

        if (cached_hash is not None and current_hash is not None and cached_hash == current_hash and
            cached_py_short == current_py_short):
            print(f"{GREEN}[STEP 3/{TOTAL_STEPS}] ✓ Cache valid. Skipping pip and dependency checks.{RESET}")
            success = True
        else:
            if cached_hash or cached_py:
                print(f"{YELLOW}Cache outdated or mismatched. Running full checks...{RESET}")
            else:
                print(f"{YELLOW}No valid cache found. Running full checks...{RESET}")

            # STEP 4: Check and Update pip
            check_and_update_pip()

            # STEPS 5 & 6: Check and Install Dependencies
            if check_and_install_dependencies():
                success = True
                _write_cache(cache_path, current_hash, py_version)
            else:
                success = False

        print(f"{YELLOW}{'-'*60}{RESET}")
        elapsed = time.time() - start_time
        if success:
            print(f"{GREEN}{BOLD}--- Environment Setup Complete ({elapsed:.2f}s) ---{RESET}")
            sys.exit(0)
        else:
            print(f"{RED}{BOLD}--- Bootstrap Failed ({elapsed:.2f}s) ---{RESET}")
            sys.exit(1)
    except KeyboardInterrupt:
        print(f"\n{YELLOW}Bootstrap interrupted by user. Exiting.{RESET}")
        sys.exit(1)
    except Exception as ex:
        print(f"\n{RED}{BOLD}--- Bootstrap Critical Error ---{RESET}")
        print(f"{RED}{ex}{RESET}")
        logger.critical("Critical error in bootstrap:", exc_info=True)
        sys.exit(1)
