#!/bin/bash

# Docker build and deploy script

echo "Building Smart Healthcare Backend Docker Images..."
echo ""

SERVICES=("auth-service" "patient-service" "doctor-service" "appointment-service" "notification-service" "ai-service" "gateway-service")

# Build all services
for service in "${SERVICES[@]}"; do
  echo "Building $service..."
  docker build -t "healthcare-$service:latest" -f "$service/Dockerfile" "$service/" || {
    echo "Failed to build $service"
    exit 1
  }
done

echo ""
echo "All images built successfully!"
echo ""
echo "To run with docker-compose:"
echo "  docker-compose up"
echo ""
echo "To run individual service:"
echo "  docker run -e PORT=4001 -e MONGO_URI=... -p 4001:4001 healthcare-auth-service:latest"
echo ""
