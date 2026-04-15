@echo off

echo Starting Smart Healthcare Backend Services...
echo.
echo Make sure MongoDB is running and .env files are configured!
echo.
echo Starting 7 services in separate terminal windows...
echo.

REM Start each service in a new terminal window
start "Gateway Service (4000)" cmd /k "cd gateway-service && npm run dev"
start "Auth Service (4001)" cmd /k "cd auth-service && npm run dev"
start "Patient Service (4002)" cmd /k "cd patient-service && npm run dev"
start "Doctor Service (4003)" cmd /k "cd doctor-service && npm run dev"
start "Appointment Service (4004)" cmd /k "cd appointment-service && npm run dev"
start "Notification Service (4005)" cmd /k "cd notification-service && npm run dev"
start "AI Service (4006)" cmd /k "cd ai-service && npm run dev"

echo.
echo All services are starting...
echo.
echo Gateway available at: http://localhost:4000
echo.
echo Test gateway health: curl http://localhost:4000/health
echo.
