resource "aws_db_instance" "postgres" {
  identifier = local.name_prefix

  engine         = "postgres"
  engine_version = "17"
  instance_class = var.rds_instance_class
  db_name        = "dancingissogood"
  username       = "app_admin"
  port           = 5432

  manage_master_user_password = true

  # Create the database from a snapshot (keeps all production data) instead of empty.
  # Only used when the database is first created; see var.restore_snapshot_identifier.
  snapshot_identifier = var.restore_snapshot_identifier

  allocated_storage     = var.rds_allocated_storage_gb
  max_allocated_storage = var.rds_max_allocated_storage_gb
  storage_type          = "gp3"
  storage_encrypted     = true

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.database.id]
  publicly_accessible    = false
  multi_az               = false

  auto_minor_version_upgrade   = true
  backup_retention_period      = 7
  backup_window                = "07:00-08:00"
  maintenance_window           = "sun:08:00-sun:09:00"
  copy_tags_to_snapshot        = true
  deletion_protection          = true
  performance_insights_enabled = false
  monitoring_interval          = 0

  apply_immediately   = false
  skip_final_snapshot = false
  # Dated so a future teardown never collides with an existing snapshot name
  # (e.g. the dancingissogood-prod-final snapshot this database is restored from).
  final_snapshot_identifier = "${local.name_prefix}-final-${formatdate("YYYYMMDDhhmm", plantimestamp())}"

  lifecycle {
    prevent_destroy = true
    # These only matter at creation. After a restore AWS may report the database name
    # and username differently from this file, and a changed snapshot setting would
    # otherwise ask Terraform to replace (wipe) the database.
    # The final snapshot name is fixed when the database is created.
    ignore_changes = [db_name, final_snapshot_identifier, snapshot_identifier, username]
  }

  tags = {
    Name = local.name_prefix
  }
}
