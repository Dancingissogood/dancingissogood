resource "aws_instance" "backend" {
  ami           = data.aws_ssm_parameter.amazon_linux_2023_arm64.value
  instance_type = var.ec2_instance_type
  subnet_id     = aws_subnet.public[0].id

  vpc_security_group_ids = [aws_security_group.backend.id]
  iam_instance_profile   = aws_iam_instance_profile.backend.name

  disable_api_termination = true
  ebs_optimized           = true
  monitoring              = false

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
    instance_metadata_tags      = "disabled"
  }

  credit_specification {
    cpu_credits = "standard"
  }

  root_block_device {
    encrypted             = true
    delete_on_termination = true
    volume_size           = 12
    volume_type           = "gp3"
  }

  user_data = templatefile("${path.module}/templates/user-data.sh.tftpl", {
    api_domain          = var.api_domain
    aws_account_id      = data.aws_caller_identity.current.account_id
    aws_region          = var.aws_region
    cors_origins        = join(",", var.allowed_frontend_origins)
    database_host       = aws_db_instance.postgres.address
    database_name       = aws_db_instance.postgres.db_name
    database_port       = aws_db_instance.postgres.port
    database_secret_arn = aws_db_instance.postgres.master_user_secret[0].secret_arn
    landing_url         = var.landing_url
    parameter_prefix    = var.secret_parameter_prefix
    repository_url      = aws_ecr_repository.backend.repository_url
  })

  tags = {
    Name = "${local.name_prefix}-backend"
  }
}

resource "aws_eip" "backend" {
  domain            = "vpc"
  network_interface = aws_instance.backend.primary_network_interface_id

  tags = {
    Name = "${local.name_prefix}-backend"
  }
}
