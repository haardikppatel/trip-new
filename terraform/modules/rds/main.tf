variable "identifier" { type = string }
variable "engine_version" { type = string }
variable "instance_class" { type = string }
variable "allocated_storage" { type = number }
variable "db_name" { type = string }
variable "username" { type = string }
variable "password" { type = string }
variable "vpc_security_group_ids" { type = list(string) }
variable "subnet_ids" { type = list(string) }
variable "multi_az" { type = bool }

resource "aws_db_subnet_group" "main" {
  name       = "${var.identifier}-subnet-group"
  subnet_ids = var.subnet_ids
}

resource "aws_db_instance" "main" {
  identifier             = var.identifier
  engine                 = "postgres"
  engine_version         = var.engine_version
  instance_class         = var.instance_class
  allocated_storage      = var.allocated_storage
  db_name                = var.db_name
  username               = var.username
  password               = var.password
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = var.vpc_security_group_ids
  multi_az               = var.multi_az
  skip_final_snapshot    = true
  storage_encrypted      = true
}

output "endpoint" {
  value = aws_db_instance.main.endpoint
}
