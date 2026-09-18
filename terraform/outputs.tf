output = {
  cluster_name = {
    description = "EKS Cluster Name"
    value       = aws_eks_cluster.main.name
  }
  cluster_endpoint = {
    description = "EKS Cluster API Endpoint"
    value       = aws_eks_cluster.main.endpoint
  }
  cluster_security_group_id = {
    description = "Security group ID attached to the EKS cluster"
    value       = aws_security_group.cluster.id
  }
  vpc_id = {
    description = "Virtual Private Cloud ID"
    value       = aws_vpc.main.id
  }
  private_subnet_ids = {
    description = "List of private subnet IDs where worker nodes reside"
    value       = aws_subnet.private[*].id
  }
  public_subnet_ids = {
    description = "List of public subnet IDs for external load balancers"
    value       = aws_subnet.public[*].id
  }
  oidc_provider_arn = {
    description = "ARN of the OIDC Provider for Kubernetes Service Accounts"
    value       = aws_iam_openid_connect_provider.eks.arn
  }
}
