variable "aws_region" {
  description = "AWS region for all production resources."
  type        = string
  default     = "us-east-1"

  validation {
    condition     = var.aws_region == "us-east-1"
    error_message = "This production stack is intentionally restricted to us-east-1."
  }
}

variable "budget_notification_email" {
  description = "Email address that receives AWS Budget and infrastructure alarm notifications."
  type        = string

  validation {
    condition     = can(regex("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$", var.budget_notification_email))
    error_message = "budget_notification_email must be a valid email address."
  }
}

variable "monthly_budget_usd" {
  description = "Monthly AWS cost budget in USD."
  type        = number
  default     = 35

  validation {
    condition     = var.monthly_budget_usd >= 25 && var.monthly_budget_usd <= 50
    error_message = "monthly_budget_usd must remain between 25 and 50 USD."
  }
}

variable "api_domain" {
  description = "Public hostname for the backend API."
  type        = string
  default     = "api.dancingissogood.com"
}

variable "landing_url" {
  description = "Canonical public website URL used for Stripe redirects."
  type        = string
  default     = "https://dancingissogood.com"
}

variable "allowed_frontend_origins" {
  description = "Exact browser origins allowed to call the backend."
  type        = list(string)
  default = [
    "https://dancingissogood.com",
    "https://www.dancingissogood.com",
  ]
}

variable "ec2_instance_type" {
  description = "ARM EC2 instance size for the backend."
  type        = string
  default     = "t4g.micro"

  validation {
    condition     = contains(["t4g.nano", "t4g.micro"], var.ec2_instance_type)
    error_message = "Only the cost-capped t4g.nano or t4g.micro sizes are allowed."
  }
}

variable "rds_instance_class" {
  description = "RDS PostgreSQL instance class."
  type        = string
  default     = "db.t4g.micro"

  validation {
    condition     = var.rds_instance_class == "db.t4g.micro"
    error_message = "The initial production database is cost-capped at db.t4g.micro."
  }
}

variable "rds_allocated_storage_gb" {
  description = "Initial RDS gp3 storage allocation."
  type        = number
  default     = 20

  validation {
    condition     = var.rds_allocated_storage_gb == 20
    error_message = "Initial RDS storage is fixed at 20 GB for cost control."
  }
}

variable "rds_max_allocated_storage_gb" {
  description = "Hard upper limit for RDS storage autoscaling."
  type        = number
  default     = 30

  validation {
    condition     = var.rds_max_allocated_storage_gb >= 20 && var.rds_max_allocated_storage_gb <= 30
    error_message = "RDS autoscaling must remain capped between 20 and 30 GB."
  }
}

variable "secret_parameter_prefix" {
  description = "SSM Parameter Store path containing runtime application secrets."
  type        = string
  default     = "/dancingissogood/production"
}
