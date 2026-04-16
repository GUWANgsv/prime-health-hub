# Kubernetes Deployment Guide

## What was added

- Namespace: 00-namespace.yaml
- Secrets: 01-secrets.yaml
- ConfigMap: 02-configmap.yaml
- MongoDB PVC, Deployment, Service: 03-mongodb.yaml
- All backend Deployments and Services: 04-services-and-deployments.yaml
- Ingress to gateway: 05-ingress.yaml

## Before apply

1. Build and push images, then replace image names in 04-services-and-deployments.yaml.
2. Update 01-secrets.yaml values for JWT, MONGO_URI, SMTP, and Gemini.
3. Make sure your cluster has an ingress controller (nginx) if you use 05-ingress.yaml.

## MongoDB options

- MongoDB Atlas (recommended): set MONGO_URI in 01-secrets.yaml to your Atlas URI and skip 03-mongodb.yaml.
- In-cluster MongoDB: keep 03-mongodb.yaml and use mongodb://root:password@mongodb:27017/healthcare?authSource=admin as MONGO_URI.

## Apply order

kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-secrets.yaml
kubectl apply -f k8s/02-configmap.yaml
kubectl apply -f k8s/03-mongodb.yaml   # only for in-cluster MongoDB
kubectl apply -f k8s/04-services-and-deployments.yaml
kubectl apply -f k8s/05-ingress.yaml

## Apply order for MongoDB Atlas

kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-secrets.yaml
kubectl apply -f k8s/02-configmap.yaml
kubectl apply -f k8s/04-services-and-deployments.yaml
kubectl apply -f k8s/05-ingress.yaml

## Quick checks

kubectl get pods -n smart-healthcare
kubectl get svc -n smart-healthcare
kubectl get ingress -n smart-healthcare
kubectl describe pods -n smart-healthcare
kubectl logs deployment/gateway-service -n smart-healthcare

## Dry-run validation

kubectl apply --dry-run=client -f k8s/00-namespace.yaml -f k8s/01-secrets.yaml -f k8s/02-configmap.yaml -f k8s/03-mongodb.yaml -f k8s/04-services-and-deployments.yaml -f k8s/05-ingress.yaml
