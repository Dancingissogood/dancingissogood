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
- Bounded local container logs to prevent the fixed-size server disk from filling silently.
- A `$35` monthly budget plus EC2 status, RDS storage, and RDS CPU-credit alarms.

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
```

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
