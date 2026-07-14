terraform {
  backend "s3" {
    bucket         = "dancingissogood-terraform-state-914115115192"
    key            = "production/infrastructure.tfstate"
    region         = "us-east-1"
    dynamodb_table = "dancingissogood-terraform-locks"
    encrypt        = true
  }
}
