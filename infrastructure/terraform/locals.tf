locals {
  name_prefix = "dancingissogood-prod"

  common_tags = {
    Application = "dancingissogood"
    Environment = "production"
    ManagedBy   = "terraform"
  }

  public_subnet_cidrs = [
    "10.42.0.0/24",
    "10.42.1.0/24",
  ]

  database_subnet_cidrs = [
    "10.42.10.0/24",
    "10.42.11.0/24",
  ]
}
