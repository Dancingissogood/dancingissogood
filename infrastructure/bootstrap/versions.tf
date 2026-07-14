terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region              = "us-east-1"
  allowed_account_ids = ["914115115192"]

  default_tags {
    tags = {
      Application = "dancingissogood"
      Environment = "production"
      ManagedBy   = "terraform"
    }
  }
}
