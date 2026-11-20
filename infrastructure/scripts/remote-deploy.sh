#!/bin/bash
# Runs ON the backend EC2 host (as root, via SSM send-command). It is shipped
# fresh by deploy-backend.sh / rollback-backend.sh on every deploy, so changes
# here take effect without touching the instance's user_data.
#
# All inputs come from environment variables:
#   IMAGE_TAG            image tag suffix (runtime-<tag>, migration-<tag>)
#   RUN_MIGRATIONS       "true" for deploys, "false" for rollbacks
#   AWS_ACCOUNT_ID       expected AWS account
#   AWS_REGION
#   REPOSITORY_URL       ECR repository URL
#   DATABASE_SECRET_ARN  RDS-managed master credential (only when migrating)
#   DATABASE_HOST, DATABASE_PORT, DATABASE_NAME
#   PARAMETER_PREFIX     SSM SecureString prefix for runtime secrets
#   CORS_ORIGINS, LANDING_URL
#   LOG_GROUP_NAME       CloudWatch Logs group for the backend container
set -euo pipefail

exec 9>/var/lock/dancingissogood-deploy.lock
flock -n 9 || {
  echo "Another deployment is already running."
  exit 1
}

IMAGE_TAG="${IMAGE_TAG:?IMAGE_TAG is required}"
RUN_MIGRATIONS="${RUN_MIGRATIONS:?RUN_MIGRATIONS is required}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:?AWS_ACCOUNT_ID is required}"
AWS_REGION="${AWS_REGION:?AWS_REGION is required}"
REPOSITORY_URL="${REPOSITORY_URL:?REPOSITORY_URL is required}"
DATABASE_HOST="${DATABASE_HOST:?DATABASE_HOST is required}"
DATABASE_PORT="${DATABASE_PORT:?DATABASE_PORT is required}"
DATABASE_NAME="${DATABASE_NAME:?DATABASE_NAME is required}"
PARAMETER_PREFIX="${PARAMETER_PREFIX:?PARAMETER_PREFIX is required}"
CORS_ORIGINS="${CORS_ORIGINS:?CORS_ORIGINS is required}"
LANDING_URL="${LANDING_URL:?LANDING_URL is required}"
LOG_GROUP_NAME="${LOG_GROUP_NAME:?LOG_GROUP_NAME is required}"

if [[ ! "${IMAGE_TAG}" =~ ^[A-Za-z0-9_.-]+$ ]]; then
  echo "Invalid image tag." >&2
  exit 1
fi

if [[ "${RUN_MIGRATIONS}" != "true" && "${RUN_MIGRATIONS}" != "false" ]]; then
  echo "RUN_MIGRATIONS must be true or false." >&2
  exit 1
fi

RUNTIME_IMAGE="${REPOSITORY_URL}:runtime-${IMAGE_TAG}"
MIGRATION_IMAGE="${REPOSITORY_URL}:migration-${IMAGE_TAG}"
APP_DIR=/opt/dancingissogood
DB_CA_PATH=/app/certs/rds-global-bundle.pem
MIGRATION_ENV="$(mktemp /run/dancingissogood-migration.XXXXXX)"

cleanup() {
  rm -f "${MIGRATION_ENV}"
}
trap cleanup EXIT

ACTUAL_ACCOUNT_ID="$(aws sts get-caller-identity --region "${AWS_REGION}" --query Account --output text)"
if [[ "${ACTUAL_ACCOUNT_ID}" != "${AWS_ACCOUNT_ID}" ]]; then
  echo "Refusing deployment: expected AWS account ${AWS_ACCOUNT_ID}, received ${ACTUAL_ACCOUNT_ID}." >&2
  exit 1
fi

aws ecr get-login-password --region "${AWS_REGION}" \
  | docker login --username AWS --password-stdin "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

docker pull "${RUNTIME_IMAGE}"
if [[ "${RUN_MIGRATIONS}" == "true" ]]; then
  docker pull "${MIGRATION_IMAGE}"
fi

get_parameter() {
  aws ssm get-parameter \
    --region "${AWS_REGION}" \
    --name "${PARAMETER_PREFIX}/$1" \
    --with-decryption \
    --query Parameter.Value \
    --output text
}

uri_encode() {
  jq -rn --arg value "$1" '$value | @uri'
}

umask 077

RUNTIME_DB_PASSWORD="$(get_parameter runtime_database_password)"

if [[ "${RUN_MIGRATIONS}" == "true" ]]; then
  DATABASE_SECRET_ARN="${DATABASE_SECRET_ARN:?DATABASE_SECRET_ARN is required when migrating}"
  DB_SECRET="$(aws secretsmanager get-secret-value \
    --region "${AWS_REGION}" \
    --secret-id "${DATABASE_SECRET_ARN}" \
    --query SecretString \
    --output text)"
  DB_USERNAME="$(jq -er '.username' <<<"${DB_SECRET}")"
  DB_PASSWORD="$(jq -er '.password' <<<"${DB_SECRET}")"
  DB_USERNAME_ENCODED="$(uri_encode "${DB_USERNAME}")"
  DB_PASSWORD_ENCODED="$(uri_encode "${DB_PASSWORD}")"

  {
    printf '%s\n' "DATABASE_URL=postgresql://${DB_USERNAME_ENCODED}:${DB_PASSWORD_ENCODED}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}?sslmode=verify-full&sslrootcert=${DB_CA_PATH}"
    printf '%s\n' "DATABASE_CA_CERT_PATH=${DB_CA_PATH}"
    printf '%s\n' "RUNTIME_DATABASE_PASSWORD=${RUNTIME_DB_PASSWORD}"
  } > "${MIGRATION_ENV}"
  unset DB_SECRET DB_USERNAME DB_PASSWORD DB_USERNAME_ENCODED DB_PASSWORD_ENCODED
fi

CLERK_PUBLISHABLE_KEY="$(get_parameter clerk_publishable_key)"
CLERK_SECRET_KEY="$(get_parameter clerk_secret_key)"
STRIPE_SECRET_KEY="$(get_parameter stripe_secret_key)"
STRIPE_WEBHOOK_SECRET="$(get_parameter stripe_webhook_secret)"
# Optional: enables the Clerk user.deleted webhook (personal data removal) once configured.
CLERK_WEBHOOK_SIGNING_SECRET="$(get_parameter clerk_webhook_signing_secret 2>/dev/null || true)"
RUNTIME_DB_PASSWORD_ENCODED="$(uri_encode "${RUNTIME_DB_PASSWORD}")"

{
  printf '%s\n' "NODE_ENV=production"
  printf '%s\n' "PORT=3001"
  printf '%s\n' "DATABASE_URL=postgresql://app_runtime:${RUNTIME_DB_PASSWORD_ENCODED}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}?sslmode=verify-full&sslrootcert=${DB_CA_PATH}"
  printf '%s\n' "DATABASE_CA_CERT_PATH=${DB_CA_PATH}"
  printf '%s\n' "DATABASE_POOL_MAX=5"
  printf '%s\n' "CORS_ORIGINS=${CORS_ORIGINS}"
  printf '%s\n' "LANDING_URL=${LANDING_URL}"
  printf '%s\n' "CLERK_PUBLISHABLE_KEY=${CLERK_PUBLISHABLE_KEY}"
  printf '%s\n' "CLERK_SECRET_KEY=${CLERK_SECRET_KEY}"
  printf '%s\n' "STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}"
  printf '%s\n' "STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}"
  if [[ -n "${CLERK_WEBHOOK_SIGNING_SECRET}" ]]; then
    printf '%s\n' "CLERK_WEBHOOK_SIGNING_SECRET=${CLERK_WEBHOOK_SIGNING_SECRET}"
  fi
} > "${APP_DIR}/backend.env"

unset CLERK_PUBLISHABLE_KEY CLERK_SECRET_KEY CLERK_WEBHOOK_SIGNING_SECRET STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET
unset RUNTIME_DB_PASSWORD RUNTIME_DB_PASSWORD_ENCODED

docker network inspect dancingissogood >/dev/null 2>&1 \
  || docker network create dancingissogood >/dev/null

if [[ "${RUN_MIGRATIONS}" == "true" ]]; then
  # Migrations run while the current container keeps serving traffic, so they
  # must stay backward compatible with it (expand/contract).
  docker run --rm \
    --name dancingissogood-migration \
    --network dancingissogood \
    --env-file "${MIGRATION_ENV}" \
    --read-only \
    --tmpfs /tmp:rw,noexec,nosuid,size=64m \
    --tmpfs /home/node:rw,noexec,nosuid,size=32m \
    --security-opt no-new-privileges \
    --cap-drop ALL \
    --pids-limit 128 \
    "${MIGRATION_IMAGE}"

  docker run --rm \
    --name dancingissogood-database-role \
    --network dancingissogood \
    --env-file "${MIGRATION_ENV}" \
    --read-only \
    --tmpfs /tmp:rw,noexec,nosuid,size=64m \
    --security-opt no-new-privileges \
    --cap-drop ALL \
    --pids-limit 128 \
    "${MIGRATION_IMAGE}" \
    node packages/db/dist/src/provision-runtime-role.js
else
  echo "Rollback mode: skipping database migrations and role provisioning."
fi

docker run --rm \
  --name dancingissogood-pass-sync \
  --network dancingissogood \
  --env-file "${APP_DIR}/backend.env" \
  --read-only \
  --tmpfs /tmp:rw,noexec,nosuid,size=64m \
  --security-opt no-new-privileges \
  --cap-drop ALL \
  --pids-limit 128 \
  --memory 256m \
  --memory-swap 320m \
  "${RUNTIME_IMAGE}" \
  node backend/dist/src/scripts/sync-stripe-pass.js

docker rm -f backend-candidate >/dev/null 2>&1 || true
docker run -d \
  --name backend-candidate \
  --restart unless-stopped \
  --network dancingissogood \
  --env-file "${APP_DIR}/backend.env" \
  --log-driver awslogs \
  --log-opt awslogs-region="${AWS_REGION}" \
  --log-opt awslogs-group="${LOG_GROUP_NAME}" \
  --log-opt awslogs-stream="backend-${IMAGE_TAG}" \
  --log-opt mode=non-blocking \
  --log-opt max-buffer-size=4m \
  --read-only \
  --tmpfs /tmp:rw,noexec,nosuid,size=64m \
  --security-opt no-new-privileges \
  --cap-drop ALL \
  --pids-limit 128 \
  --memory 640m \
  --memory-swap 768m \
  "${RUNTIME_IMAGE}" >/dev/null

for attempt in {1..30}; do
  HEALTH="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}starting{{end}}' backend-candidate)"
  if [[ "${HEALTH}" == "healthy" ]]; then
    break
  fi
  if [[ "${HEALTH}" == "unhealthy" || "${attempt}" == "30" ]]; then
    docker logs backend-candidate >&2 || true
    docker rm -f backend-candidate >/dev/null 2>&1 || true
    echo "Candidate ${IMAGE_TAG} failed its health check; the previous backend is still serving." >&2
    exit 1
  fi
  sleep 2
done

docker rm -f backend >/dev/null 2>&1 || true
docker rename backend-candidate backend

if [[ "$(docker inspect --format '{{.State.Running}}' caddy 2>/dev/null || true)" == "true" ]]; then
  docker exec caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
else
  docker rm -f caddy >/dev/null 2>&1 || true
  docker run -d \
    --name caddy \
    --restart unless-stopped \
    --network dancingissogood \
    -p 80:80 \
    -p 443:443 \
    -v "${APP_DIR}/caddy/Caddyfile:/etc/caddy/Caddyfile:ro" \
    -v caddy_data:/data \
    -v caddy_config:/config \
    --read-only \
    --tmpfs /tmp:rw,noexec,nosuid,size=32m \
    --security-opt no-new-privileges \
    --cap-drop ALL \
    --cap-add NET_BIND_SERVICE \
    --pids-limit 64 \
    --memory 128m \
    --memory-swap 160m \
    caddy:2.10.2-alpine@sha256:8dbca3525dd8dce671e495665a0eb297a83ec87ee30f373947d0ea93115949db >/dev/null
fi

docker image prune -f --filter "until=168h" >/dev/null
echo "Deployment ${IMAGE_TAG} completed."
