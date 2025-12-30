@echo off
echo ========================================
echo Budget Tracker - Database Migration
echo ========================================
echo.

REM Change to project root directory
cd /d "%~dp0.."
echo Working directory: %CD%
echo.

echo This will create/update tables without deleting data.
echo For a FULL RESET, use reset-database.bat instead.
echo.
pause
echo.

echo [1/4] Installing/verifying bcryptjs...
call npm install bcryptjs
echo.

echo [2/4] Verifying schema.prisma exists...
if not exist "prisma\schema.prisma" (
    echo ERROR: prisma\schema.prisma not found!
    echo Current directory: %CD%
    pause
    exit /b 1
)
echo Schema found: prisma\schema.prisma
echo.

echo [3/4] Generating Prisma Client...
call npx prisma generate
if errorlevel 1 (
    echo ERROR: Failed to generate Prisma Client
    pause
    exit /b 1
)
echo.

echo [4/4] Running database migration...
call npx prisma migrate dev --name update_schema --skip-seed
if errorlevel 1 (
    echo ERROR: Migration failed
    pause
    exit /b 1
)
echo.

echo [5/5] Verifying migration...
call npx prisma migrate status
echo.

echo ========================================
echo Migration completed successfully!
echo ========================================
echo.
echo To add test data, run: npm run seed
echo To check tables: npx prisma studio
echo.
pause
