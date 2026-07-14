output "aws_account_id" {
  description = "AWS account Terraform verified before provisioning."
  value       = data.aws_caller_identity.current.account_id
}

output "api_domain" {
  description = "Backend API hostname."
  value       = var.api_domain
}

output "api_elastic_ip" {
  description = "Create an A record for api_domain pointing to this address."
  value       = aws_eip.backend.public_ip
}

output "backend_instance_id" {
  value = aws_instance.backend.id
}

output "database_endpoint" {
  value = aws_db_instance.postgres.endpoint
}

output "database_secret_arn" {
  value     = aws_db_instance.postgres.master_user_secret[0].secret_arn
  sensitive = true
}

output "ecr_repository_url" {
  value = aws_ecr_repository.backend.repository_url
}

output "runtime_parameter_names" {
  value = [
    "${var.secret_parameter_prefix}/clerk_publishable_key",
    "${var.secret_parameter_prefix}/clerk_secret_key",
    "${var.secret_parameter_prefix}/runtime_database_password",
    "${var.secret_parameter_prefix}/stripe_secret_key",
    "${var.secret_parameter_prefix}/stripe_webhook_secret",
  ]
}
