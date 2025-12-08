@echo off
setlocal enabledelayedexpansion
color 0A
title Blog Scraper - Control Panel

:MAIN_MENU
cls
echo.
echo ========================================
echo   BLOG SCRAPER - CONTROL PANEL
echo ========================================
echo.
echo   [1] Start Development Server (npm run dev)
echo   [2] Seed Websites (npm run seed)
echo   [3] Setup Database (npm run setup-db)
echo   [4] Test Scraper (npm run test-scraper)
echo   [5] Test All Websites (npm run test-all)
echo   [6] Update Websites (npm run update-websites)
echo   [7] Build for Production (npm run build)
echo   [8] Install Dependencies (npm install)
echo   [9] Check Prisma Status
echo   [0] Exit
echo.
echo ========================================
set /p choice="Select an option (0-9): "

if "%choice%"=="1" goto START_DEV
if "%choice%"=="2" goto SEED
if "%choice%"=="3" goto SETUP_DB
if "%choice%"=="4" goto TEST_SCRAPER
if "%choice%"=="5" goto TEST_ALL
if "%choice%"=="6" goto UPDATE_WEBSITES
if "%choice%"=="7" goto BUILD
if "%choice%"=="8" goto INSTALL
if "%choice%"=="9" goto PRISMA_STATUS
if "%choice%"=="0" goto EXIT
goto INVALID

:START_DEV
cls
echo ========================================
echo   Starting Development Server
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    goto MAIN_MENU
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo [INFO] Installing dependencies first...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install dependencies
        pause
        goto MAIN_MENU
    )
    echo.
)

REM Check if .env exists
if not exist ".env" (
    echo [WARNING] .env file not found!
    echo The application requires DATABASE_URL to be set in .env file
    echo.
)

REM Stop any existing processes on port 3000
echo [INFO] Checking port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING 2^>nul') do (
    echo [INFO] Stopping existing server on port 3000...
    taskkill /F /PID %%a >nul 2>&1
    timeout /t 1 /nobreak >nul
)

echo [INFO] Starting Next.js development server...
echo [INFO] Server will open in a new window
echo.
start "Next.js Dev Server" cmd /k "npm run dev"

timeout /t 3 /nobreak >nul
echo [SUCCESS] Development server starting...
echo [INFO] Opening browser in 2 seconds...
timeout /t 2 /nobreak >nul
start http://localhost:3000

echo.
echo ========================================
echo   Server URLs:
echo   Main Site: http://localhost:3000
echo   Admin Panel: http://localhost:3000/admin
echo ========================================
echo.
pause
goto MAIN_MENU

:SEED
cls
echo ========================================
echo   Seeding Websites
echo ========================================
echo.
echo [INFO] This will add pre-configured websites to your database
echo.
pause
call npm run seed
echo.
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Websites seeded successfully!
) else (
    echo [ERROR] Failed to seed websites
    echo Make sure your database is running and configured correctly
)
echo.
pause
goto MAIN_MENU

:SETUP_DB
cls
echo ========================================
echo   Setting Up Database
echo ========================================
echo.
echo [INFO] This will run database migrations and setup
echo.
pause
call npm run setup-db
echo.
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Database setup completed!
) else (
    echo [ERROR] Database setup failed
    echo Check your DATABASE_URL in .env file
)
echo.
pause
goto MAIN_MENU

:TEST_SCRAPER
cls
echo ========================================
echo   Testing Scraper
echo ========================================
echo.
call npm run test-scraper
echo.
pause
goto MAIN_MENU

:TEST_ALL
cls
echo ========================================
echo   Testing All Websites
echo ========================================
echo.
call npm run test-all
echo.
pause
goto MAIN_MENU

:UPDATE_WEBSITES
cls
echo ========================================
echo   Updating Websites
echo ========================================
echo.
call npm run update-websites
echo.
pause
goto MAIN_MENU

:BUILD
cls
echo ========================================
echo   Building for Production
echo ========================================
echo.
echo [INFO] This may take a few minutes...
echo.
call npm run build
echo.
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Build completed!
    echo [INFO] Run 'npm start' to start production server
) else (
    echo [ERROR] Build failed
)
echo.
pause
goto MAIN_MENU

:INSTALL
cls
echo ========================================
echo   Installing Dependencies
echo ========================================
echo.
call npm install
echo.
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Dependencies installed!
) else (
    echo [ERROR] Installation failed
)
echo.
pause
goto MAIN_MENU

:PRISMA_STATUS
cls
echo ========================================
echo   Prisma Status
echo ========================================
echo.
echo [INFO] Generating Prisma Client...
call npx prisma generate
echo.
echo [INFO] Checking database connection...
call npx prisma db pull
echo.
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Database connection OK
) else (
    echo [ERROR] Cannot connect to database
    echo Check your DATABASE_URL in .env file
)
echo.
pause
goto MAIN_MENU

:INVALID
cls
echo.
echo [ERROR] Invalid option. Please select 0-9
echo.
timeout /t 2 /nobreak >nul
goto MAIN_MENU

:EXIT
cls
echo.
echo ========================================
echo   Thank you for using Blog Scraper!
echo ========================================
echo.
timeout /t 2 /nobreak >nul
exit /b 0
