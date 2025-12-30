@echo off
echo ========================================
echo Budget Tracker - Interactive Setup
echo ========================================
echo.
echo This script will help you set up the database step by step.
echo.
echo BEFORE YOU CONTINUE:
echo.
echo 1. Close Prisma Studio if it's open (http://localhost:5555)
echo 2. Close any database tools (DBeaver, pgAdmin, etc.)
echo 3. Close other terminals connected to this database
echo.
echo Press any key when ready...
pause >nul
echo.

echo [1/6] Checking for Prisma Studio...
netstat -ano | findstr ":5555" >nul 2>&1
if %errorlevel% equ 0 (
    echo WARNING: Port 5555 is in use - Prisma Studio might be running
    echo Please close it and press any key...
    pause >nul
)
echo OK - No Prisma Studio detected
echo.

echo [2/6] Installing bcryptjs...
call npm install bcryptjs
if errorlevel 1 (
    echo ERROR: Failed to install bcryptjs
    pause
    exit /b 1
)
echo.

echo [3/6] Generating Prisma Client...
call npx prisma generate
if errorlevel 1 (
    echo ERROR: Failed to generate Prisma Client
    pause
    exit /b 1
)
echo.

echo [4/6] Waiting for database connections to close...
echo (Waiting 5 seconds...)
timeout /t 5 >nul
echo.

echo [5/6] Syncing schema to database...
echo This uses 'db push' (safe for Supabase Free Tier)
echo.
call npx prisma db push --accept-data-loss
if errorlevel 1 (
    echo.
    echo ERROR: Database sync failed
    echo.
    echo This usually means there are still active connections.
    echo.
    echo Try this:
    echo 1. Go to Supabase Dashboard
    echo 2. Wait 30 seconds
    echo 3. Run this script again
    echo.
    pause
    exit /b 1
)
echo.

echo [6/6] Running seed...
call npm run seed
if errorlevel 1 (
    echo ERROR: Seed failed
    pause
    exit /b 1
)
echo.

echo ========================================
echo SUCCESS! Database is ready!
echo ========================================
echo.
echo Created:
echo - 5 tables
echo - Test user: test@example.com / testpassword123
echo - 9 categories  
echo - 1 active period
echo.
echo Next: Verify in Supabase Table Editor
echo https://supabase.com/dashboard
echo.
pause
