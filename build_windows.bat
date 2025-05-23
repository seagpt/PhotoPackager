@echo off
setlocal

echo PhotoPackager Windows Build Script
echo --------------------------------

REM --- Configuration ---
set SPEC_FILE=photo_packager_windows.spec
set VENV_PATH=venv_windows\Scripts\activate.bat
set APP_NAME=PhotoPackager

REM --- Cleanup ---
echo Cleaning up old build artifacts...
if exist build rmdir /s /q build
if exist dist rmdir /s /q dist
REM Keep the spec file, do not delete it: if exist *.spec del /q *.spec 
echo Cleanup complete.

REM --- Main Build Process ---
echo Starting build...

REM Activate virtual environment
if exist "%VENV_PATH%" (
    echo Activating virtual environment: %VENV_PATH%
    call "%VENV_PATH%"
) else (
    echo Warning: Virtual environment not found at %VENV_PATH%. Using system Python.
    REM Consider exiting if venv is strictly required:
    REM echo Error: Virtual environment %VENV_PATH% not found. Please create and provision it.
    REM exit /b 1
)

REM Check for Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Python executable not found in PATH or venv. Cannot proceed.
    exit /b 1
)

REM Check for Spec file
if not exist "%SPEC_FILE%" (
    echo Error: PyInstaller spec file not found: %SPEC_FILE%
    exit /b 1
)

REM Run PyInstaller with the spec file
echo Running PyInstaller with %SPEC_FILE%...
python -m PyInstaller %SPEC_FILE%

if errorlevel 1 (
    echo Error: PyInstaller failed.
    exit /b 1
)

REM Check for output (standard output for a spec file is dist/APP_NAME from spec)
if not exist "dist\%APP_NAME%\%APP_NAME%.exe" (
    echo Error: PyInstaller did not create the .exe bundle in dist\%APP_NAME%
    echo Please check the 'name' parameter within your .spec file's EXE and COLLECT sections.
    exit /b 1
)
echo PyInstaller completed successfully.

REM Deactivate virtual environment (if activated)
if defined VIRTUAL_ENV (
    type deactivate >nul 2>nul
    if %errorlevel% equ 0 (
        echo Deactivating virtual environment.
        call deactivate
    )
)

echo --------------------------------
echo Build complete!
echo Output: %CD%\dist\%APP_NAME%\%APP_NAME%.exe
echo --------------------------------

endlocal
exit /b 0
