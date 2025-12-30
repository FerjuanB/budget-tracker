@echo off
echo ========================================
echo Budget Tracker - Setup Dependencies
echo ========================================
echo.

REM Change to project root directory
cd /d "%~dp0.."
echo Working directory: %CD%
echo.

echo Installing bcryptjs for password hashing...
call npm install bcryptjs
if errorlevel 1 (
    echo ERROR: Failed to install bcryptjs
    pause
    exit /b 1
)

echo.
echo ========================================
echo Dependencies installed successfully!
echo ========================================
pause
