variable "cluster_id" { type = string }
variable "node_type" { type = string }
variable "num_cache_nodes" { type = number }
variable "subnet_ids" { type = list(string) }
variable "security_group_ids" { type = list(string) }

resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.cluster_id}-subnet-group"
  subnet_ids = var.subnet_ids
}

resource "aws_elasticache_cluster" "main" {
  cluster_id           = var.cluster_id
  engine               = "redis"
  node_type            = var.node_type
  num_cache_nodes      = var.num_cache_nodes
  parameter_group_name = "default.redis7"
  engine_version       = "7.0"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = var.security_group_ids
}

output "cache_nodes" {
  value = aws_elasticache_cluster.main.cache_nodes
}
