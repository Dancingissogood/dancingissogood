# Production infrastructure

This directory provisions the backend in AWS account `914115115192`, region `us-east-1`.

## Architecture

- One ARM `t4g.micro` EC2 instance running the Fastify API and Caddy in containers.
- One private, encrypted, single-AZ `db.t4g.micro` RDS PostgreSQL 17 instance.
- Two public subnets and two isolated database subnets across two availability zones.
- No NAT gateway, load balancer, SSH ingress, bastion, or WAF.
- AWS Systems Manager for administration and deployment.
- ECR with immutable tags, scan-on-push, and a ten-image retention limit.
- RDS-managed migration credentials and a separate least-privilege runtime database role.
- Clerk, Stripe, and runtime database credentials in free Standard SSM parameters.
- Backend container logs shipped to CloudWatch Logs (`/dancingissogood-prod/backend`, 14-day retention); other containers keep bounded local logs so the fixed-size disk cannot fill silently.
- A `$35` monthly budget plus EC2 status, RDS storage, RDS CPU-credit, and API uptime alarms.

Single-AZ RDS is the deliberate low-cost availability tradeoff. Seven days of automated backups, encryption, deletion protection, and Terraform `prevent_destroy` protect the data, but this configuration does not provide automatic cross-AZ failover.

## Provisioning order

All commands must use the dedicated profile:

```bash
export AWS_PROFILE=dancingissogood-prod
export AWS_REGION=us-east-1
aws sts get-caller-identity
```

The account must be `914115115192`.

1. Create remote Terraform state:

```bash
terraform -chdir=infrastructure/bootstrap init
terraform -chdir=infrastructure/bootstrap plan -out=bootstrap.tfplan
terraform -chdir=infrastructure/bootstrap apply bootstrap.tfplan
```

2. Create `infrastructure/terraform/terraform.tfvars` from the example and set the notification email.

3. Initialize and review production infrastructure:

```bash
terraform -chdir=infrastructure/terraform init
terraform -chdir=infrastructure/terraform plan -out=production.tfplan
terraform -chdir=infrastructure/terraform apply production.tfplan
```

4. Create a Porkbun `A` record for `api.dancingissogood.com` using:

```bash
terraform -chdir=infrastructure/terraform output api_elastic_ip
```

5. Finish the Clerk production instance and Stripe live account. Create the Stripe webhook endpoint at `https://api.dancingissogood.com/v1/webhooks/stripe` for:

```txt
checkout.session.completed
checkout.session.async_payment_succeeded
checkout.session.async_payment_failed
checkout.session.expired
charge.refunded
charge.dispute.created
charge.dispute.closed
```

   Optionally, in the Clerk production instance, add a webhook endpoint at `https://api.dancingissogood.com/v1/webhooks/clerk` subscribed to `user.deleted`. It removes a deleted user's personal data from the database. Its signing secret is the optional prompt in the next step.

6. Store live credentials without putting them in Terraform state or shell history. This also creates the runtime database credential once without printing it:

```bash
infrastructure/scripts/configure-production-secrets.sh
```

7. Build, scan, migrate, provision least-privilege database access, synchronize the live $100 pass, deploy, and verify the backend:

```bash
infrastructure/scripts/deploy-backend.sh
```

8. Set Vercel `BACKEND_URL` to `https://api.dancingissogood.com` and redeploy the landing project.

The notification recipient must confirm the AWS SNS subscription email after provisioning.

## Deployments

`deploy-backend.sh` refuses to run with uncommitted or untracked changes (images are tagged with the HEAD commit). It builds and pushes the `runtime-<tag>` and `migration-<tag>` images, rejects critical scan findings, then ships `infrastructure/scripts/remote-deploy.sh` to the host over SSM `send-command` and runs it. The deploy logic is versioned in this repository and sent fresh on every deploy; the host keeps nothing but the bootstrap from user data. The script waits up to 35 minutes for the SSM command, always prints the remote stdout/stderr (SSM truncates each to 24,000 characters), and exits non-zero on failure. The final health check uses the `api_domain` Terraform output, or `API_DOMAIN` if set.

On the host, `remote-deploy.sh` takes a deploy lock, verifies the AWS account, reads secrets from Secrets Manager and SSM SecureStrings at deploy time, runs `prisma migrate deploy` and runtime-role provisioning, syncs the Stripe pass, starts a hardened candidate container, and replaces the running backend only after the candidate reports healthy.

### Migration rule: expand/contract

Migrations run **before** the new candidate starts, while the current container keeps serving traffic, and rollbacks never run migrations. Every migration must therefore be backward compatible with the version that is currently running:

- Expand first: add nullable columns, new tables, or new indexes. Deploy code that uses them.
- Contract later, in a separate deploy after no running or rollback-target version needs them: drop or rename columns, add `NOT NULL`, tighten constraints.
- Never rename or drop something the current release still reads or writes.

### Rollback

ECR tags are immutable, so re-running `deploy-backend.sh` with an old tag fails at push. Roll back with:

```bash
infrastructure/scripts/rollback-backend.sh <image-tag>
```

`<image-tag>` is the tag printed by a previous deploy (for example `0123456789ab-20261120120000`; a `runtime-` prefix is accepted). The script verifies `runtime-<image-tag>` exists in ECR (and lists recent tags if not), then runs the same remote deploy **without building, pushing, migrating, or provisioning the database role**. Only the last ten images are kept in ECR.

### Logs

The backend container uses the Docker `awslogs` driver; each deploy writes to the `backend-<image-tag>` stream in the `backend_log_group_name` output's log group.

## Instance lifecycle

`aws_instance.backend` ignores changes to `ami` and `user_data`. The AMI comes from the "latest Amazon Linux 2023" SSM parameter, and changing user data makes AWS stop and start the instance, so without this a routine apply could replace or restart the server. Consequences:

- OS/AMI refreshes and user-data (host bootstrap) changes are deliberate operations, never a side effect of `terraform apply`. To perform one, schedule downtime, temporarily set `disable_api_termination = false`, apply, then run `terraform apply -replace=aws_instance.backend`, restore termination protection, and redeploy the backend.
- User data only bootstraps the host (Docker, jq, Caddyfile). Deploy behavior lives in `infrastructure/scripts/remote-deploy.sh`. The obsolete `/opt/dancingissogood/deploy.sh` on hosts created before this change is no longer used.

## Uptime alarm

A Route 53 HTTPS health check polls `https://<api_domain>/health/ready` and the `dancingissogood-prod-api-health` alarm emails the operations SNS topic after three failed minutes. **While the EC2 instance is intentionally stopped to save costs, this alarm will be in ALARM and will send a notification**; that is expected. The health check costs roughly $1–3/month.
