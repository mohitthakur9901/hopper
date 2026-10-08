#!/bin/bash
# ─────────────────────────────────────────────────────────────
# HopperAudit – Build & Push Docker image to ECR, then deploy
# Usage: ./deploy.sh
# ─────────────────────────────────────────────────────────────
set -euo pipefail

REGION="${AWS_REGION:-us-east-1}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REPO="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/hopperaudit-prod-api"
IMAGE_TAG="${IMAGE_TAG:-latest}"

echo "══════════════════════════════════════════════════════════"
echo "  HopperAudit Deploy"
echo "  Account:  ${ACCOUNT_ID}"
echo "  Region:   ${REGION}"
echo "  Image:    ${ECR_REPO}:${IMAGE_TAG}"
echo "══════════════════════════════════════════════════════════"

# 1. Authenticate Docker with ECR
echo "→ Logging into ECR..."
aws ecr get-login-password --region "${REGION}" | \
  docker login --username AWS --password-stdin "${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"

# 2. Build the Docker image
echo "→ Building Docker image..."
cd "$(dirname "$0")/.."
docker build -t "${ECR_REPO}:${IMAGE_TAG}" .

# 3. Push to ECR
echo "→ Pushing image to ECR..."
docker push "${ECR_REPO}:${IMAGE_TAG}"

# 4. Force new ECS deployment
echo "→ Updating ECS service..."
aws ecs update-service \
  --cluster hopperaudit-prod-cluster \
  --service hopperaudit-prod-api \
  --force-new-deployment \
  --region "${REGION}" \
  --no-cli-pager

echo ""
echo "✅ Deployment triggered! Monitor at:"
echo "   https://${REGION}.console.aws.amazon.com/ecs/v2/clusters/hopperaudit-prod-cluster/services"
