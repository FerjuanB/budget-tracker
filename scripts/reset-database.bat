@echo off
echo ========================================
echo Budget Tracker - Database Reset
echo (Supabase Free Tier Compatible)
echo ========================================
echo.

REM Change to project root directory
cd /d "%~dp0.."
echo Working directory: %CD%
echo.

echo WARNING: This will DELETE all existing data!
echo.
set /p confirm="Type 'yes' to continue: "
if /i not "%confirm%"=="yes" (
    echo Operation cancelled.
    pause
    exit /b 0
)
echo.

echo [1/5] Installing bcryptjs...
call npm install bcryptjs
if errorlevel 1 (
    echo ERROR: Failed to install bcryptjs
    pause
    exit /b 1
)
echo.

echo [2/5] Generating Prisma Client...
call npx prisma generate
if errorlevel 1 (
    echo ERROR: Failed to generate Prisma Client
    pause
    exit /b 1
)
echo.

echo [3/5] Waiting for active connections to close...
timeout /t 3 >nul
echo.

echo [4/5] Syncing schema to database...
echo NOTE: Using 'db push' for Supabase Free Tier
call npx prisma db push --force-reset --accept-data-loss
if errorlevel 1 (
    echo ERROR: Database sync failed
    echo.
    echo Troubleshooting:
    echo 1. Close Prisma Studio if open
    echo 2. Check .env has DATABASE_URL and DIRECT_URL
    echo 3. Verify Supabase is active
    echo 4. Wait 30 seconds and try again
    pause
    exit /b 1
)
echo.

echo [5/5] Running seed...
call npm run seed
if errorlevel 1 (
    echo ERROR: Seed failed
    pause
    exit /b 1
)
echo.

echo ========================================
echo Database reset completed successfully!
echo ========================================
echo.
echo Created:
echo - 5 tables (users, categories, periods, budget_additions, expenses)
echo - Test user: test@example.com / testpassword123
echo - 9 default categories
echo - 1 active period
echo.
echo Verify in Supabase Table Editor
echo.
pause
