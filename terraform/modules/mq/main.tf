variable "broker_name" { type = string }
variable "engine_type" { type = string }
variable "engine_version" { type = string }
variable "host_instance_type" { type = string }
variable "security_groups" { type = list(string) }
variable "subnet_ids" { type = list(string) }
variable "mq_username" { type = string }
variable "mq_password" { type = string }

resource "aws_mq_broker" "main" {
  broker_name        = var.broker_name
  engine_type        = var.engine_type
  engine_version     = var.engine_version
  host_instance_type = var.host_instance_type
  security_groups    = var.security_groups
  subnet_ids         = var.subnet_ids

  user {
    username = var.mq_username
    password = var.mq_password
  }
}

output "endpoints" {
  value = aws_mq_broker.main.instances[0].endpoints
}
