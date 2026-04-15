# Suwaya Project Setup Guide

This guide is for teammates who download the project from GitHub and want to run it exactly the same way.

## 1. Prerequisites

Install these first:
- Node.js 22+
- npm 10+
- Git
- Docker Desktop (for Docker method)
- kubectl + Kubernetes cluster (for K8s method)

Accounts and keys needed:
- MongoDB Atlas connection strings
- Google Gemini API key
- SMTP account credentials (Gmail app password recommended)
- PayHere credentials (if payment flow is used)

## 2. Download Project

Clone and enter project:

```bash
git clone <YOUR_REPO_URL>
cd suwaya
```

Project structure expected:
- backend
- frontend
- .gitignore
- SETUP.md

## 3. Backend Setup

Move to backend:

```bash
cd backend
```

### Windows setup

```bat
setup.bat
```

### Linux/macOS setup

```bash
chmod +x setup.sh
./setup.sh
```

What this does:
- Copies each .env.example to .env if missing
- Installs npm dependencies in all 7 services

## 4. Configure Environment Files

After setup, edit these files:
- backend/gateway-service/.env
- backend/auth-service/.env
- backend/patient-service/.env
- backend/doctor-service/.env
- backend/appointment-service/.env
- backend/notification-service/.env
- backend/ai-service/.env

Required values by service:

### gateway-service/.env

```env
PORT=4000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/gateway-db
JWT_SECRET=replace_with_a_strong_secret
AUTH_SERVICE_URL=http://localhost:4001
PATIENT_SERVICE_URL=http://localhost:4002
DOCTOR_SERVICE_URL=http://localhost:4003
APPOINTMENT_SERVICE_URL=http://localhost:4004
NOTIFICATION_SERVICE_URL=http://localhost:4005
AI_SERVICE_URL=http://localhost:4006
```

### auth-service/.env

```env
PORT=4001
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/auth-db
JWT_SECRET=replace_with_a_strong_secret
```

### patient-service/.env

```env
PORT=4002
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/patient-db
JWT_SECRET=replace_with_a_strong_secret
```

### doctor-service/.env

```env
PORT=4003
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/doctor-db
JWT_SECRET=replace_with_a_strong_secret
```

### appointment-service/.env

```env
PORT=4004
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/appointment-db
JWT_SECRET=replace_with_a_strong_secret
DOCTOR_SERVICE_URL=http://localhost:4003
PATIENT_SERVICE_URL=http://localhost:4002
AUTH_SERVICE_URL=http://localhost:4001
FRONTEND_URL=http://localhost:5173
GATEWAY_PUBLIC_URL=http://localhost:4000
PAYHERE_MERCHANT_ID=replace_with_payhere_merchant_id
PAYHERE_MERCHANT_SECRET=replace_with_payhere_merchant_secret
PAYHERE_CURRENCY=LKR
PAYHERE_NOTIFY_URL=http://localhost:4000/api/appointments/payhere/notify
```

### notification-service/.env

```env
PORT=4005
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/notification-db
JWT_SECRET=replace_with_a_strong_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@example.com
SMTP_PASS=your_email_app_password
EMAIL_FROM=Smart Healthcare <your_email@example.com>
```

### ai-service/.env

```env
PORT=4006
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/ai-db
JWT_SECRET=replace_with_a_strong_secret
GEMINI_API_KEY=replace_with_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash
GEMINI_API_VERSION=v1beta
```

## 5. Start Backend (Local Dev)

From backend folder:

### Windows (open all services in separate terminals)


.\start-all.bat

### Linux/macOS

```bash
chmod +x start-all.sh
./start-all.sh
```

If needed, start manually in separate terminals:

```bash
cd gateway-service && npm run dev
cd auth-service && npm run dev
cd patient-service && npm run dev
cd doctor-service && npm run dev
cd appointment-service && npm run dev
cd notification-service && npm run dev
cd ai-service && npm run dev
```

Backend health check:

```bash
curl http://localhost:4000/health
```

## 6. Frontend Setup

Open new terminal from project root:

```bash
cd frontend
npm install
```

Create frontend env file:

- frontend/.env

with:

```env
VITE_API_BASE_URL=http://localhost:4000
```

Run frontend:

```bash
npm run dev
```

Frontend URL:
- http://localhost:5173

## 7. Docker Setup (Alternative)

From project root:

```bash
cd backend
docker-compose up -d
```

Check containers:

```bash
docker-compose ps
```

Stop:

```bash
docker-compose down
```

Notes:
- Docker compose uses service-to-service URLs inside the Docker network.
- Set sensitive values through shell env before running compose when needed, such as JWT_SECRET, SMTP_USER, SMTP_PASS, GEMINI_API_KEY.

## 8. Kubernetes Setup (Alternative)

From project root:

```bash
cd backend
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-secrets.yaml
kubectl apply -f k8s/02-configmap.yaml
kubectl apply -f k8s/03-mongodb.yaml
kubectl apply -f k8s/04-services-and-deployments.yaml
kubectl apply -f k8s/05-ingress.yaml
```

Verify:

```bash
kubectl get pods -n smart-healthcare
kubectl get svc -n smart-healthcare
kubectl get ingress -n smart-healthcare
```

Before apply:
- Update image names in backend/k8s/04-services-and-deployments.yaml
- Update secrets in backend/k8s/01-secrets.yaml

## 9. Quick Troubleshooting

If ports are busy:
- 4000 to 4006 must be free
- 5173 must be free for frontend

If MongoDB Atlas fails:
- Check username/password
- Check IP allowlist in Atlas
- Check db name in URI

If notifications fail:
- Use Gmail app password, not Gmail account password

If frontend cannot call backend:
- Ensure frontend/.env has VITE_API_BASE_URL=http://localhost:4000
- Ensure gateway service is running

## 10. What to Commit to GitHub

Commit these:
- All source code
- Dockerfile files
- backend/docker-compose.yml
- backend/k8s YAML files
- setup scripts (.bat and .sh)
- .env.example files
- this SETUP.md

Do not commit:
- .env files
- node_modules
- local build outputs
- secrets

Your .gitignore already covers these local/sensitive files.
