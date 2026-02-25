aws_region = "us-east-1"
environment = "dev"
vpc_cidr = "10.0.0.0/16"
public_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnets = ["10.0.10.0/24", "10.0.20.0/24"]
azs = ["us-east-1a", "us-east-1b"]

eks_node_instance_types = ["t3.medium"]
eks_desired_capacity = 2
eks_min_capacity = 1
eks_max_capacity = 3

rds_instance_class = "db.t3.micro"
redis_node_type = "cache.t3.micro"
mq_instance_type = "mq.t3.micro"
