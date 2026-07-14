#!/usr/bin/env bash
set -euo pipefail

EXPECTED_ACCOUNT_ID="914115115192"
AWS_PROFILE_NAME="${AWS_PROFILE:-dancingissogood-prod}"
AWS_REGION_NAME="${AWS_REGION:-us-east-1}"
PARAMETER_PREFIX="/dancingissogood/production"

ACTUAL_ACCOUNT_ID="$(aws sts get-caller-identity \
  --profile "${AWS_PROFILE_NAME}" \
  --region "${AWS_REGION_NAME}" \
  --query Account \
  --output text)"

if [[ "${ACTUAL_ACCOUNT_ID}" != "${EXPECTED_ACCOUNT_ID}" ]]; then
  echo "Refusing to write secrets: expected AWS account ${EXPECTED_ACCOUNT_ID}, received ${ACTUAL_ACCOUNT_ID}." >&2
  exit 1
fi

read_secret() {
  local prompt="$1"
  local variable_name="$2"
  local value

  read -r -s -p "${prompt}: " value
  printf '\n'

  if [[ -z "${value}" ]]; then
    echo "${prompt} cannot be empty." >&2
    exit 1
  fi

  printf -v "${variable_name}" '%s' "${value}"
}

read_secret "Clerk production publishable key" CLERK_PUBLISHABLE_KEY
read_secret "Clerk production secret key" CLERK_SECRET_KEY
read_secret "Stripe live restricted or secret key" STRIPE_SECRET_KEY
read_secret "Stripe live webhook signing secret" STRIPE_WEBHOOK_SECRET

[[ "${CLERK_PUBLISHABLE_KEY}" == pk_live_* ]] || {
  echo "Clerk publishable key must be a production pk_live_ key." >&2
  exit 1
}
[[ "${CLERK_SECRET_KEY}" == sk_live_* ]] || {
  echo "Clerk secret key must be a production sk_live_ key." >&2
  exit 1
}
[[ "${STRIPE_SECRET_KEY}" == rk_live_* || "${STRIPE_SECRET_KEY}" == sk_live_* ]] || {
  echo "Stripe key must be a live rk_live_ or sk_live_ server key." >&2
  exit 1
}
[[ "${STRIPE_WEBHOOK_SECRET}" == whsec_* ]] || {
  echo "Stripe webhook signing secret must start with whsec_." >&2
  exit 1
}

put_secret() {
  local name="$1"
  local value="$2"

  aws ssm put-parameter \
    --profile "${AWS_PROFILE_NAME}" \
    --region "${AWS_REGION_NAME}" \
    --name "${PARAMETER_PREFIX}/${name}" \
    --type SecureString \
    --tier Standard \
    --value "${value}" \
    --overwrite \
    --output json >/dev/null
}

put_secret clerk_publishable_key "${CLERK_PUBLISHABLE_KEY}"
put_secret clerk_secret_key "${CLERK_SECRET_KEY}"
put_secret stripe_secret_key "${STRIPE_SECRET_KEY}"
put_secret stripe_webhook_secret "${STRIPE_WEBHOOK_SECRET}"

RUNTIME_PASSWORD_PARAMETER="${PARAMETER_PREFIX}/runtime_database_password"
if ! aws ssm get-parameter \
  --profile "${AWS_PROFILE_NAME}" \
  --region "${AWS_REGION_NAME}" \
  --name "${RUNTIME_PASSWORD_PARAMETER}" \
  --query Parameter.Name \
  --output text >/dev/null 2>&1; then
  RUNTIME_DATABASE_PASSWORD="$(openssl rand -hex 32)"
  put_secret runtime_database_password "${RUNTIME_DATABASE_PASSWORD}"
  unset RUNTIME_DATABASE_PASSWORD
fi

unset CLERK_PUBLISHABLE_KEY CLERK_SECRET_KEY STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET
echo "Production credentials stored in AWS account ${ACTUAL_ACCOUNT_ID} as Standard SecureString parameters."
