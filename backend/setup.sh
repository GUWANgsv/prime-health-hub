#!/bin/bash

set -e

echo "=========================================="
echo "Smart Healthcare Backend Setup"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SERVICES=("auth-service" "patient-service" "doctor-service" "appointment-service" "notification-service" "ai-service" "gateway-service")

# Step 1: Create .env files
echo -e "${BLUE}Step 1: Creating .env files from examples...${NC}"
for service in "${SERVICES[@]}"; do
  if [ ! -f "$service/.env" ]; then
    cp "$service/.env.example" "$service/.env"
    echo -e "${GREEN}✓${NC} Created $service/.env"
  else
    echo -e "${YELLOW}⚠${NC} $service/.env already exists, skipping..."
  fi
done
echo ""

# Step 2: Install dependencies
echo -e "${BLUE}Step 2: Installing dependencies...${NC}"
for service in "${SERVICES[@]}"; do
  echo ""
  echo "Installing $service dependencies..."
  (cd "$service" && npm install)
  echo -e "${GREEN}✓${NC} $service ready"
done
echo ""

# Step 3: Verify installations
echo -e "${BLUE}Step 3: Verifying installations...${NC}"
all_ready=true
for service in "${SERVICES[@]}"; do
  if [ -d "$service/node_modules" ]; then
    echo -e "${GREEN}✓${NC} $service/node_modules"
  else
    echo -e "${RED}✗${NC} $service/node_modules missing"
    all_ready=false
  fi
done
echo ""

# Step 4: Summary
echo -e "${BLUE}Step 4: Setup Summary${NC}"
if [ "$all_ready" = true ]; then
  echo -e "${GREEN}✓ All services ready!${NC}"
  echo ""
  echo -e "${BLUE}Next steps:${NC}"
  echo "1. Edit .env files with your credentials:"
  for service in "${SERVICES[@]}"; do
    echo "   - $service/.env"
  done
  echo ""
  echo "2. Start services (each in a terminal):"
  echo "   Gateway:      cd gateway-service && npm run dev"
  echo "   Auth:         cd auth-service && npm run dev"
  echo "   Patient:      cd patient-service && npm run dev"
  echo "   Doctor:       cd doctor-service && npm run dev"
  echo "   Appointment:  cd appointment-service && npm run dev"
  echo "   Notification: cd notification-service && npm run dev"
  echo "   AI:           cd ai-service && npm run dev"
  echo ""
  echo "3. Test gateway health:"
  echo "   curl http://localhost:4000/health"
  echo ""
  echo "4. View API documentation in README.md"
else
  echo -e "${YELLOW}⚠ Some services have issues. Check output above.${NC}"
  exit 1
fi
