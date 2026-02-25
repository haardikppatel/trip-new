terraform {
  backend "s3" {
    bucket         = "tripaxis-terraform-state"
    key            = "dev/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "tripaxis-terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
}

module "networking" {
  source          = "../../modules/networking"
  environment     = var.environment
  vpc_cidr        = var.vpc_cidr
  public_subnets  = var.public_subnets
  private_subnets = var.private_subnets
  azs             = var.azs
}

module "eks" {
  source              = "../../modules/eks"
  cluster_name        = "${var.environment}-cluster"
  vpc_id              = module.networking.vpc_id
  subnet_ids          = module.networking.private_subnet_ids
  node_instance_types = var.eks_node_instance_types
  desired_capacity    = var.eks_desired_capacity
  min_capacity        = var.eks_min_capacity
  max_capacity        = var.eks_max_capacity
}

resource "aws_security_group" "rds" {
  name_prefix = "${var.environment}-rds-sg"
  vpc_id      = module.networking.vpc_id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }
}

module "rds" {
  source                 = "../../modules/rds"
  identifier             = "${var.environment}-db"
  engine_version         = "16.1"
  instance_class         = var.rds_instance_class
  allocated_storage      = 20
  db_name                = "tripaxis"
  username               = var.db_username
  password               = var.db_password
  vpc_security_group_ids = [aws_security_group.rds.id]
  subnet_ids             = module.networking.private_subnet_ids
  multi_az               = false
}

resource "aws_security_group" "redis" {
  name_prefix = "${var.environment}-redis-sg"
  vpc_id      = module.networking.vpc_id

  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }
}

module "redis" {
  source             = "../../modules/redis"
  cluster_id         = "${var.environment}-redis"
  node_type          = var.redis_node_type
  num_cache_nodes    = 1
  subnet_ids         = module.networking.private_subnet_ids
  security_group_ids = [aws_security_group.redis.id]
}

resource "aws_security_group" "mq" {
  name_prefix = "${var.environment}-mq-sg"
  vpc_id      = module.networking.vpc_id

  ingress {
    from_port   = 5671
    to_port     = 5671
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }
}

module "mq" {
  source             = "../../modules/mq"
  broker_name        = "${var.environment}-rabbitmq"
  engine_type        = "RabbitMQ"
  engine_version     = "3.11.20"
  host_instance_type = var.mq_instance_type
  security_groups    = [aws_security_group.mq.id]
  subnet_ids         = [module.networking.private_subnet_ids[0]]
  mq_username        = var.mq_username
  mq_password        = var.mq_password
}
