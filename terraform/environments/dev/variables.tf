variable "aws_region" { type = string }
variable "environment" { type = string }
variable "vpc_cidr" { type = string }
variable "public_subnets" { type = list(string) }
variable "private_subnets" { type = list(string) }
variable "azs" { type = list(string) }

variable "eks_node_instance_types" { type = list(string) }
variable "eks_desired_capacity" { type = number }
variable "eks_min_capacity" { type = number }
variable "eks_max_capacity" { type = number }

variable "rds_instance_class" { type = string }
variable "db_username" { type = string }
variable "db_password" { type = string }

variable "redis_node_type" { type = string }

variable "mq_instance_type" { type = string }
variable "mq_username" { type = string }
variable "mq_password" { type = string }
