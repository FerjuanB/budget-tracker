@echo off
echo ========================================
echo Budget Tracker - Database Setup
echo (Supabase Free Tier Compatible)
echo ========================================
echo.
echo Running from: %CD%
echo.

echo [1/6] Installing bcryptjs...
call npm install bcryptjs
if errorlevel 1 (
    echo ERROR: Failed to install bcryptjs
    pause
    exit /b 1
)
echo.

echo [2/6] Closing any open Prisma Studio connections...
echo (If you have Prisma Studio open, close it now)
timeout /t 3 >nul
echo.

echo [3/6] Generating Prisma Client...
call npx prisma generate
if errorlevel 1 (
    echo ERROR: Failed to generate Prisma Client
    pause
    exit /b 1
)
echo.

echo [4/6] Syncing schema to database (using db push)...
echo NOTE: Using 'db push' instead of 'migrate' for Supabase Free Tier
call npx prisma db push --accept-data-loss
if errorlevel 1 (
    echo ERROR: Database sync failed
    echo.
    echo Troubleshooting:
    echo 1. Close Prisma Studio if it's open
    echo 2. Check DATABASE_URL in .env
    echo 3. Check DIRECT_URL in .env  
    echo 4. Verify Supabase project is active (not paused)
    echo 5. Check internet connection
    pause
    exit /b 1
)
echo.

echo [5/6] Running seed...
call npm run seed
if errorlevel 1 (
    echo ERROR: Seed failed
    pause
    exit /b 1
)
echo.

echo [6/6] Verifying database...
call npx prisma db pull
echo.

echo ========================================
echo SUCCESS! Database is ready!
echo ========================================
echo.
echo Created:
echo - 5 tables (users, categories, periods, budget_additions, expenses)
echo - Test user: test@example.com / testpassword123
echo - 9 default categories
echo - 1 active period
echo.
echo IMPORTANT: This project uses 'db push' for Supabase Free Tier.
echo Migrations are NOT tracked in files (this is normal).
echo.
echo Verify in Supabase Table Editor:
echo https://supabase.com/dashboard
echo.
pause
