#!/usr/bin/env bash
set -euo pipefail

EXPECTED_ACCOUNT_ID="914115115192"
AWS_PROFILE_NAME="${AWS_PROFILE:-dancingissogood-prod}"
AWS_REGION_NAME="${AWS_REGION:-us-east-1}"
TERRAFORM_DIR="$(cd "$(dirname "$0")/../terraform" && pwd)"
REPOSITORY_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
IMAGE_TAG="${1:-$(git -C "${REPOSITORY_ROOT}" rev-parse --short=12 HEAD)-$(date -u +%Y%m%d%H%M%S)}"

if [[ ! "${IMAGE_TAG}" =~ ^[A-Za-z0-9_.-]+$ ]]; then
  echo "Image tag may contain only letters, numbers, periods, underscores, and hyphens." >&2
  exit 1
fi

ACTUAL_ACCOUNT_ID="$(aws sts get-caller-identity \
  --profile "${AWS_PROFILE_NAME}" \
  --region "${AWS_REGION_NAME}" \
  --query Account \
  --output text)"

if [[ "${ACTUAL_ACCOUNT_ID}" != "${EXPECTED_ACCOUNT_ID}" ]]; then
  echo "Refusing deployment: expected AWS account ${EXPECTED_ACCOUNT_ID}, received ${ACTUAL_ACCOUNT_ID}." >&2
  exit 1
fi

ECR_REPOSITORY="$(terraform -chdir="${TERRAFORM_DIR}" output -raw ecr_repository_url)"
INSTANCE_ID="$(terraform -chdir="${TERRAFORM_DIR}" output -raw backend_instance_id)"
REGISTRY="${EXPECTED_ACCOUNT_ID}.dkr.ecr.${AWS_REGION_NAME}.amazonaws.com"

aws ecr get-login-password \
  --profile "${AWS_PROFILE_NAME}" \
  --region "${AWS_REGION_NAME}" \
  | docker login --username AWS --password-stdin "${REGISTRY}"

docker buildx build \
  --platform linux/arm64 \
  --target runtime \
  --tag "${ECR_REPOSITORY}:runtime-${IMAGE_TAG}" \
  --push \
  "${REPOSITORY_ROOT}"

docker buildx build \
  --platform linux/arm64 \
  --target migration \
  --tag "${ECR_REPOSITORY}:migration-${IMAGE_TAG}" \
  --push \
  "${REPOSITORY_ROOT}"

resolve_arm64_digest() {
  local image_tag="$1"
  local image_index

  image_index="$(aws ecr batch-get-image \
    --profile "${AWS_PROFILE_NAME}" \
    --region "${AWS_REGION_NAME}" \
    --repository-name "dancingissogood/backend" \
    --image-ids imageTag="${image_tag}" \
    --accepted-media-types application/vnd.oci.image.index.v1+json \
    --query 'images[0].imageManifest' \
    --output text)"

  jq -er '.manifests[] | select(.platform.os == "linux" and .platform.architecture == "arm64") | .digest' \
    <<<"${image_index}"
}

for image_tag in "runtime-${IMAGE_TAG}" "migration-${IMAGE_TAG}"; do
  image_digest="$(resolve_arm64_digest "${image_tag}")"

  aws ecr wait image-scan-complete \
    --profile "${AWS_PROFILE_NAME}" \
    --region "${AWS_REGION_NAME}" \
    --repository-name "dancingissogood/backend" \
    --image-id imageDigest="${image_digest}"

  CRITICAL_FINDINGS="$(aws ecr describe-image-scan-findings \
    --profile "${AWS_PROFILE_NAME}" \
    --region "${AWS_REGION_NAME}" \
    --repository-name "dancingissogood/backend" \
    --image-id imageDigest="${image_digest}" \
    --query 'imageScanFindings.findingSeverityCounts.CRITICAL' \
    --output text)"

  if [[ "${CRITICAL_FINDINGS}" != "None" && "${CRITICAL_FINDINGS}" != "0" ]]; then
    echo "Refusing deployment: ${image_tag} has ${CRITICAL_FINDINGS} critical image findings." >&2
    exit 1
  fi
done

COMMAND_PARAMETERS="$(jq -nc --arg command "sudo /opt/dancingissogood/deploy.sh '${IMAGE_TAG}'" '{commands:[$command]}')"
COMMAND_ID="$(aws ssm send-command \
  --profile "${AWS_PROFILE_NAME}" \
  --region "${AWS_REGION_NAME}" \
  --instance-ids "${INSTANCE_ID}" \
  --document-name AWS-RunShellScript \
  --comment "Deploy Dancing Is So Good backend ${IMAGE_TAG}" \
  --parameters "${COMMAND_PARAMETERS}" \
  --query Command.CommandId \
  --output text)"

aws ssm wait command-executed \
  --profile "${AWS_PROFILE_NAME}" \
  --region "${AWS_REGION_NAME}" \
  --command-id "${COMMAND_ID}" \
  --instance-id "${INSTANCE_ID}"

aws ssm get-command-invocation \
  --profile "${AWS_PROFILE_NAME}" \
  --region "${AWS_REGION_NAME}" \
  --command-id "${COMMAND_ID}" \
  --instance-id "${INSTANCE_ID}" \
  --query '{Status:Status,Output:StandardOutputContent,Errors:StandardErrorContent}' \
  --output json

curl --fail --silent --show-error --max-time 15 "https://api.dancingissogood.com/health/ready"
printf '\nBackend deployment %s is healthy.\n' "${IMAGE_TAG}"
