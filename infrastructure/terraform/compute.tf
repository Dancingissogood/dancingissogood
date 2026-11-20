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
    api_domain = var.api_domain
  })

  # The AMI comes from the "latest AL2023" SSM parameter and user_data only
  # bootstraps the host. Changing either would stop/start or replace the
  # instance, so both are ignored here. OS refreshes and bootstrap changes are
  # deliberate operations: `terraform apply -replace=aws_instance.backend`.
  # Deployment logic lives in infrastructure/scripts/remote-deploy.sh instead.
  lifecycle {
    ignore_changes = [ami, user_data]
  }

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
