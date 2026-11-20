#!/usr/bin/env bash
# Redeploys an image tag that already exists in ECR. Builds nothing, pushes
# nothing, and never runs database migrations or role provisioning.
#
# Usage: infrastructure/scripts/rollback-backend.sh <image-tag>
#   <image-tag> is the deploy tag (e.g. 0123456789ab-20261120120000);
#   a leading "runtime-" is accepted and stripped.
set -euo pipefail

# shellcheck source=deploy-common.sh
source "$(dirname "$0")/deploy-common.sh"

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <image-tag>" >&2
  exit 1
fi

IMAGE_TAG="${1#runtime-}"
validate_image_tag "${IMAGE_TAG}"

verify_aws_account
load_terraform_outputs

if ! aws_cli ecr describe-images \
  --repository-name "${ECR_REPOSITORY_NAME}" \
  --image-ids imageTag="runtime-${IMAGE_TAG}" \
  --query 'imageDetails[0].imagePushedAt' \
  --output text >/dev/null; then
  echo "Refusing rollback: runtime-${IMAGE_TAG} does not exist in ${ECR_REPOSITORY_NAME}." >&2
  echo "Recent runtime tags:" >&2
  aws_cli ecr describe-images \
    --repository-name "${ECR_REPOSITORY_NAME}" \
    --query 'reverse(sort_by(imageDetails,&imagePushedAt))[].imageTags[?starts_with(@, `runtime-`)] | []' \
    --output text >&2 || true
  exit 1
fi

echo "Rolling back to runtime-${IMAGE_TAG} (no build, no migrations)."
run_remote_deploy "${IMAGE_TAG}" false
check_public_health "${IMAGE_TAG}"
