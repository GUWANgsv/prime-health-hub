@echo off
setlocal enabledelayedexpansion

echo.
echo ==========================================
echo Smart Healthcare Backend Setup
echo ==========================================
echo.

set SERVICES=auth-service patient-service doctor-service appointment-service notification-service ai-service gateway-service

REM Step 1: Create .env files
echo [STEP 1] Creating .env files from examples...
for %%S in (%SERVICES%) do (
  if not exist "%%S\.env" (
    copy "%%S\.env.example" "%%S\.env" >nul
    echo   [OK] Created %%S\.env
  ) else (
    echo   [SKIP] %%S\.env already exists
  )
)
echo.

REM Step 2: Install dependencies
echo [STEP 2] Installing dependencies...
for %%S in (%SERVICES%) do (
  echo.
  echo Installing %%S dependencies...
  cd %%S
  call npm install
  cd ..
  echo   [OK] %%S ready
)
echo.

REM Step 3: Verify installations
echo [STEP 3] Verifying installations...
setlocal enabledelayedexpansion
set all_ready=true
for %%S in (%SERVICES%) do (
  if exist "%%S\node_modules" (
    echo   [OK] %%S\node_modules
  ) else (
    echo   [ERROR] %%S\node_modules missing
    set all_ready=false
  )
)
echo.

REM Step 4: Summary
echo [STEP 4] Setup Summary
if "%all_ready%"=="true" (
  echo.
  echo [SUCCESS] All services ready!
  echo.
  echo Next steps:
  echo.
  echo 1. Edit .env files with your credentials:
  for %%S in (%SERVICES%) do (
    echo    - %%S\.env
  )
  echo.
  echo 2. Start services (each in a terminal):
  echo    Gateway:      cd gateway-service ^&^& npm run dev
  echo    Auth:         cd auth-service ^&^& npm run dev
  echo    Patient:      cd patient-service ^&^& npm run dev
  echo    Doctor:       cd doctor-service ^&^& npm run dev
  echo    Appointment:  cd appointment-service ^&^& npm run dev
  echo    Notification: cd notification-service ^&^& npm run dev
  echo    AI:           cd ai-service ^&^& npm run dev
  echo.
  echo 3. Test gateway health:
  echo    curl http://localhost:4000/health
  echo.
  echo 4. View API documentation in README.md
) else (
  echo.
  echo [WARNING] Some services have issues. Check output above.
  exit /b 1
)
echo.
