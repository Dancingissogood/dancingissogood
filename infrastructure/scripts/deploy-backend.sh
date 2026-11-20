#!/usr/bin/env bash
set -euo pipefail

# shellcheck source=deploy-common.sh
source "$(dirname "$0")/deploy-common.sh"

# The image is tagged with the HEAD commit, so the build must match HEAD exactly.
if [[ -n "$(git -C "${REPOSITORY_ROOT}" status --porcelain)" ]]; then
  echo "Refusing deployment: the working tree has uncommitted or untracked changes." >&2
  git -C "${REPOSITORY_ROOT}" status --short >&2
  exit 1
fi

IMAGE_TAG="${1:-$(git -C "${REPOSITORY_ROOT}" rev-parse --short=12 HEAD)-$(date -u +%Y%m%d%H%M%S)}"
validate_image_tag "${IMAGE_TAG}"

verify_aws_account
load_terraform_outputs

aws_cli ecr get-login-password \
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

  image_index="$(aws_cli ecr batch-get-image \
    --repository-name "${ECR_REPOSITORY_NAME}" \
    --image-ids imageTag="${image_tag}" \
    --accepted-media-types application/vnd.oci.image.index.v1+json \
    --query 'images[0].imageManifest' \
    --output text)"

  jq -er '.manifests[] | select(.platform.os == "linux" and .platform.architecture == "arm64") | .digest' \
    <<<"${image_index}"
}

wait_for_image_scan() {
  local image_digest="$1"
  local image_tag="$2"
  local attempt
  local scan_result
  local scan_status

  for attempt in $(seq 1 60); do
    if scan_result="$(aws_cli ecr describe-image-scan-findings \
      --repository-name "${ECR_REPOSITORY_NAME}" \
      --image-id imageDigest="${image_digest}" \
      --output json 2>&1)"; then
      scan_status="$(jq -r '.imageScanStatus.status' <<<"${scan_result}")"

      if [[ "${scan_status}" == "COMPLETE" ]]; then
        printf '%s\n' "${scan_result}"
        return 0
      fi

      if [[ "${scan_status}" != "IN_PROGRESS" ]]; then
        echo "Refusing deployment: ${image_tag} image scan ended with status ${scan_status}." >&2
        return 1
      fi
    elif [[ "${scan_result}" != *"ScanNotFoundException"* ]]; then
      echo "Unable to read the ${image_tag} image scan: ${scan_result}" >&2
      return 1
    fi

    sleep 5
  done

  echo "Refusing deployment: ${image_tag} image scan did not complete within five minutes." >&2
  return 1
}

for image_tag in "runtime-${IMAGE_TAG}" "migration-${IMAGE_TAG}"; do
  image_digest="$(resolve_arm64_digest "${image_tag}")"
  SCAN_FINDINGS="$(wait_for_image_scan "${image_digest}" "${image_tag}")"
  CRITICAL_FINDINGS="$(jq -r '.imageScanFindings.findingSeverityCounts.CRITICAL // 0' <<<"${SCAN_FINDINGS}")"

  if [[ "${CRITICAL_FINDINGS}" != "0" ]]; then
    echo "Refusing deployment: ${image_tag} has ${CRITICAL_FINDINGS} critical image findings." >&2
    exit 1
  fi
done

run_remote_deploy "${IMAGE_TAG}" true
check_public_health "${IMAGE_TAG}"
echo "Roll back with: infrastructure/scripts/rollback-backend.sh <previous-image-tag>"
