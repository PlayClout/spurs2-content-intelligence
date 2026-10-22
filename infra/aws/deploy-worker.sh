#!/usr/bin/env bash
# Build the worker image (ARM64 for Fargate Graviton), push to ECR tagged with the git SHA, register a new task
# definition revision pointing at that exact tag, and roll the ECS service. Immutable tags: no ":latest" in prod.
#   bash infra/aws/deploy-worker.sh            (uses AWS profile clout-ci)
set -euo pipefail
cd "$(dirname "$0")/../.."
export HOME=/Users/stu
PROFILE=${AWS_PROFILE_NAME:-clout-ci}; REGION=us-east-1; ACCT=271825827331
REPO=$ACCT.dkr.ecr.$REGION.amazonaws.com/spurs2-worker
TAG=$(git rev-parse --short HEAD)
[ -z "$(git status --porcelain -- pipeline shared scripts data Dockerfile.worker package.json package-lock.json)" ] || { echo "refusing: uncommitted worker changes (image tag must match a commit)"; exit 1; }

aws ecr get-login-password --profile "$PROFILE" --region $REGION | docker login --username AWS --password-stdin $ACCT.dkr.ecr.$REGION.amazonaws.com >/dev/null
docker build --platform linux/arm64 -f Dockerfile.worker -t "$REPO:$TAG" .
docker push "$REPO:$TAG"

sed "s#spurs2-worker:[A-Za-z0-9._-]*\"#spurs2-worker:$TAG\"#" infra/aws/worker-taskdef.json > /tmp/spurs2-taskdef.json
REV=$(aws ecs register-task-definition --profile "$PROFILE" --region $REGION --cli-input-json file:///tmp/spurs2-taskdef.json --query 'taskDefinition.revision' --output text)
rm -f /tmp/spurs2-taskdef.json
aws ecs update-service --profile "$PROFILE" --region $REGION --cluster spurs2 --service worker --task-definition "spurs2-worker:$REV" --force-new-deployment --query 'service.deployments[0].[taskDefinition,rolloutState]' --output text
echo "deployed $TAG as spurs2-worker:$REV; watch: aws ecs wait services-stable --cluster spurs2 --services worker --profile $PROFILE --region $REGION"
