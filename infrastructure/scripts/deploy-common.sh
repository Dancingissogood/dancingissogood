# Shared helpers for deploy-backend.sh and rollback-backend.sh. Source only.
# shellcheck shell=bash

EXPECTED_ACCOUNT_ID="914115115192"
AWS_PROFILE_NAME="${AWS_PROFILE:-dancingissogood-prod}"
AWS_REGION_NAME="${AWS_REGION:-us-east-1}"
SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$(cd "${SCRIPTS_DIR}/../terraform" && pwd)"
REPOSITORY_ROOT="$(cd "${SCRIPTS_DIR}/../.." && pwd)"
# Generous: migrations + image pulls + candidate health check on a t4g.micro.
REMOTE_EXECUTION_TIMEOUT_SECONDS=1800
REMOTE_WAIT_TIMEOUT_SECONDS=2100

aws_cli() {
  aws --profile "${AWS_PROFILE_NAME}" --region "${AWS_REGION_NAME}" "$@"
}

validate_image_tag() {
  if [[ ! "$1" =~ ^[A-Za-z0-9_.-]+$ ]]; then
    echo "Image tag may contain only letters, numbers, periods, underscores, and hyphens." >&2
    exit 1
  fi
}

verify_aws_account() {
  local actual_account_id
  actual_account_id="$(aws_cli sts get-caller-identity --query Account --output text)"

  if [[ "${actual_account_id}" != "${EXPECTED_ACCOUNT_ID}" ]]; then
    echo "Refusing deployment: expected AWS account ${EXPECTED_ACCOUNT_ID}, received ${actual_account_id}." >&2
    exit 1
  fi
}

terraform_output_raw() {
  terraform -chdir="${TERRAFORM_DIR}" output -raw "$1"
}

load_terraform_outputs() {
  ECR_REPOSITORY="$(terraform_output_raw ecr_repository_url)"
  ECR_REPOSITORY_NAME="${ECR_REPOSITORY#*/}"
  INSTANCE_ID="$(terraform_output_raw backend_instance_id)"
  REGISTRY="${EXPECTED_ACCOUNT_ID}.dkr.ecr.${AWS_REGION_NAME}.amazonaws.com"
  HEALTHCHECK_DOMAIN="${API_DOMAIN:-$(terraform_output_raw api_domain)}"

  if ! DEPLOY_CONFIG="$(terraform -chdir="${TERRAFORM_DIR}" output -json backend_deploy_config)" \
    || [[ -z "${DEPLOY_CONFIG}" || "${DEPLOY_CONFIG}" == "null" ]]; then
    echo "Terraform output backend_deploy_config is missing. Run terraform apply first (see infrastructure/README.md)." >&2
    exit 1
  fi
}

deploy_config_value() {
  jq -er --arg key "$1" '.[$key]' <<<"${DEPLOY_CONFIG}"
}

# Prints NAME='value' for a value that is safe to single-quote in a shell.
shell_assignment() {
  local name="$1"
  local value="$2"

  if [[ -z "${value}" || "${value}" == *"'"* || "${value}" =~ [[:cntrl:]] ]]; then
    echo "Refusing deployment: ${name} is empty or contains unsupported characters." >&2
    exit 1
  fi

  printf "%s='%s'" "${name}" "${value}"
}

# run_remote_deploy IMAGE_TAG RUN_MIGRATIONS(true|false)
# Ships remote-deploy.sh through SSM, waits for it, and always prints its output.
run_remote_deploy() {
  local image_tag="$1"
  local run_migrations="$2"
  local database_secret_arn=""
  local assignments script_base64 remote_command command_parameters command_id

  if [[ "${run_migrations}" == "true" ]]; then
    database_secret_arn="$(terraform_output_raw database_secret_arn)"
  fi

  assignments="$(shell_assignment IMAGE_TAG "${image_tag}")"
  assignments+=" $(shell_assignment RUN_MIGRATIONS "${run_migrations}")"
  assignments+=" $(shell_assignment AWS_ACCOUNT_ID "${EXPECTED_ACCOUNT_ID}")"
  assignments+=" $(shell_assignment AWS_REGION "$(deploy_config_value aws_region)")"
  assignments+=" $(shell_assignment REPOSITORY_URL "${ECR_REPOSITORY}")"
  assignments+=" $(shell_assignment DATABASE_HOST "$(deploy_config_value database_host)")"
  assignments+=" $(shell_assignment DATABASE_PORT "$(deploy_config_value database_port)")"
  assignments+=" $(shell_assignment DATABASE_NAME "$(deploy_config_value database_name)")"
  assignments+=" $(shell_assignment PARAMETER_PREFIX "$(deploy_config_value parameter_prefix)")"
  assignments+=" $(shell_assignment CORS_ORIGINS "$(deploy_config_value cors_origins)")"
  assignments+=" $(shell_assignment LANDING_URL "$(deploy_config_value landing_url)")"
  assignments+=" $(shell_assignment LOG_GROUP_NAME "$(deploy_config_value log_group_name)")"
  if [[ -n "${database_secret_arn}" ]]; then
    assignments+=" $(shell_assignment DATABASE_SECRET_ARN "${database_secret_arn}")"
  fi

  script_base64="$(base64 <"${SCRIPTS_DIR}/remote-deploy.sh" | tr -d '\n')"

  # AWS-RunShellScript already runs as root.
  remote_command="set -eu
script=\"\$(mktemp /run/dancingissogood-remote-deploy.XXXXXX)\"
trap 'rm -f \"\$script\"' EXIT
printf '%s' '${script_base64}' | base64 -d > \"\$script\"
env ${assignments} bash \"\$script\""

  command_parameters="$(jq -nc \
    --arg command "${remote_command}" \
    --arg timeout "${REMOTE_EXECUTION_TIMEOUT_SECONDS}" \
    '{commands: ($command | split("\n")), executionTimeout: [$timeout]}')"

  command_id="$(aws_cli ssm send-command \
    --instance-ids "${INSTANCE_ID}" \
    --document-name AWS-RunShellScript \
    --comment "Deploy Dancing Is So Good backend ${image_tag}" \
    --parameters "${command_parameters}" \
    --query Command.CommandId \
    --output text)"

  echo "SSM command ${command_id} sent to ${INSTANCE_ID}; waiting for it to finish..."
  wait_for_command "${command_id}"
}

wait_for_command() {
  local command_id="$1"
  local deadline=$((SECONDS + REMOTE_WAIT_TIMEOUT_SECONDS))
  local invocation="" status="Pending"

  while true; do
    if invocation="$(aws_cli ssm get-command-invocation \
      --command-id "${command_id}" \
      --instance-id "${INSTANCE_ID}" \
      --output json 2>&1)"; then
      status="$(jq -r '.Status' <<<"${invocation}")"
      case "${status}" in
        Pending | InProgress | Delayed | Cancelling) ;;
        *) break ;;
      esac
    elif [[ "${invocation}" != *"InvocationDoesNotExist"* ]]; then
      echo "Unable to read SSM command ${command_id}: ${invocation}" >&2
      return 1
    fi

    if ((SECONDS >= deadline)); then
      echo "Timed out after ${REMOTE_WAIT_TIMEOUT_SECONDS}s waiting for SSM command ${command_id} (last status: ${status})." >&2
      break
    fi
    sleep 10
  done

  if [[ "${invocation}" == "{"* ]]; then
    echo "----- remote stdout -----"
    jq -r '.StandardOutputContent // ""' <<<"${invocation}"
    echo "----- remote stderr -----"
    jq -r '.StandardErrorContent // ""' <<<"${invocation}"
    echo "-------------------------"
  fi

  if [[ "${status}" != "Success" ]]; then
    echo "Remote deployment did not succeed (status: ${status}, SSM command ${command_id})." >&2
    return 1
  fi
}

check_public_health() {
  local image_tag="$1"

  curl --fail --silent --show-error --max-time 15 \
    --retry 3 --retry-delay 5 --retry-all-errors \
    "https://${HEALTHCHECK_DOMAIN}/health/ready"
  printf '\nBackend %s is healthy at https://%s.\n' "${image_tag}" "${HEALTHCHECK_DOMAIN}"
}
