output "cluster_name" {
  description = "EKS Cluster Name"
  value       = aws_eks_cluster.main.name
}

output "cluster_endpoint" {
  description = "EKS Cluster API Endpoint"
  value       = aws_eks_cluster.main.endpoint
}

output "cluster_security_group_id" {
  description = "Security group ID attached to the EKS cluster"
  value       = aws_security_group.cluster.id
}

output "vpc_id" {
  description = "Virtual Private Cloud ID"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "List of private subnet IDs where worker nodes reside"
  value       = aws_subnet.private[*].id
}

output "public_subnet_ids" {
  description = "List of public subnet IDs for external load balancers"
  value       = aws_subnet.public[*].id
}

output "oidc_provider_arn" {
  description = "ARN of the OIDC Provider for Kubernetes Service Accounts"
  value       = aws_iam_openid_connect_provider.eks.arn
}
