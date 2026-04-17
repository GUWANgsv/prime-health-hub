SMART HEALTHCARE SYSTEM - LECTURER RUN GUIDE

This file explains how to run the project in 4 ways:
1) Backend services (local)
2) Frontend
3) Docker
4) Kubernetes (basic)

--------------------------------------------------
1. Prerequisites
--------------------------------------------------
Install these first:
- Node.js 22+
- npm 10+
- Git
- Docker Desktop (for Docker mode)
- kubectl + a Kubernetes cluster (for Kubernetes mode)

You also need:
- MongoDB Atlas URI (or in-cluster MongoDB for K8s)
- Gemini API key
- SMTP credentials (for notifications)
- PayHere credentials (if payment flow is tested)


--------------------------------------------------
2. Project Setup (first time only)
--------------------------------------------------
From project root:

Windows:
  cd backend
  setup.bat

Linux/macOS:
  cd backend
  chmod +x setup.sh
  ./setup.sh

Then edit .env files for all backend services:
- backend/gateway-service/.env
- backend/auth-service/.env
- backend/patient-service/.env
- backend/doctor-service/.env
- backend/appointment-service/.env
- backend/notification-service/.env
- backend/ai-service/.env

Important:
- Keep JWT_SECRET aligned across services.
- Set all required URLs and credentials.


--------------------------------------------------
3. How to Run Backend Services (Local Development)
--------------------------------------------------
Open terminal in backend folder:

  cd backend

Windows (auto start script):
  start-all.bat

Linux/macOS:
  chmod +x start-all.sh
  ./start-all.sh

Manual option (7 separate terminals):
  cd gateway-service && npm run dev
  cd auth-service && npm run dev
  cd patient-service && npm run dev
  cd doctor-service && npm run dev
  cd appointment-service && npm run dev
  cd notification-service && npm run dev
  cd ai-service && npm run dev

Health check:
  curl http://localhost:4000/health

Expected ports:
- Gateway: 4000
- Auth: 4001
- Patient: 4002
- Doctor: 4003
- Appointment: 4004
- Notification: 4005
- AI: 4006


--------------------------------------------------
4. How to Run Frontend
--------------------------------------------------
Open a new terminal from project root:

  cd frontend
  npm install

Create frontend .env file:
- frontend/.env

Add:
  VITE_API_BASE_URL=http://localhost:4000

Run frontend:
  npm run dev

Open in browser:
  http://localhost:5173


--------------------------------------------------
5. How to Run with Docker
--------------------------------------------------
From project root:

  cd backend
  copy .env.example .env

(If Linux/macOS use: cp .env.example .env)

Edit backend/.env with real values (especially MONGO_URI and secrets), then run:

  docker-compose up -d

Check status:
  docker-compose ps

Check logs:
  docker-compose logs -f

Stop:
  docker-compose down

Note:
- In this project, Docker mode expects cloud MongoDB (Atlas URI in backend/.env).


--------------------------------------------------
6. Kubernetes Deployment (Basic Steps)
--------------------------------------------------
Folder:
- backend/k8s/

Basic flow:
1) Build and push all service Docker images.
2) Update image names/tags in:
   - backend/k8s/04-services-and-deployments.yaml
3) Update secrets in:
   - backend/k8s/01-secrets.yaml
4) Apply manifests in order:

  kubectl apply -f backend/k8s/00-namespace.yaml
  kubectl apply -f backend/k8s/01-secrets.yaml
  kubectl apply -f backend/k8s/02-configmap.yaml
  kubectl apply -f backend/k8s/03-mongodb.yaml
  kubectl apply -f backend/k8s/04-services-and-deployments.yaml
  kubectl apply -f backend/k8s/05-ingress.yaml

If using MongoDB Atlas, skip 03-mongodb.yaml.

Quick checks:
  kubectl get pods -n smart-healthcare
  kubectl get svc -n smart-healthcare
  kubectl get ingress -n smart-healthcare
  kubectl logs deployment/gateway-service -n smart-healthcare

Optional local access with port-forward:
  kubectl port-forward -n smart-healthcare svc/gateway-service 4000:4000


--------------------------------------------------
7. Lecturer Quick Run Recommendation
--------------------------------------------------
Fastest for evaluation:
1) Start backend with Docker or local scripts.
2) Start frontend with npm run dev.
3) Open http://localhost:5173
4) Test:
   - Register Patient
   - Register Doctor
   - Login
   - Patient books appointment
   - Doctor confirms appointment
   - Admin reviews operations

This demonstrates end-to-end system flow clearly.
