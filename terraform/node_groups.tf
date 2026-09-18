# ==============================================================================
# Managed EKS Worker Node Group
# Private Subnets, Auto-scaling for 4,000+ Users, IMDSv2 Enforced
# ==============================================================================

# Launch Template enforcing IMDSv2 & Encrypted EBS Volumes
resource "aws_launch_template" "node" {
  name_prefix   = "${var.cluster_name}-node-template-"
  image_id      = "" # Handled dynamically by EKS AMI resolution
  instance_type = var.node_instance_types[0]

  # Enforce IMDSv2 to eliminate SSRF-based metadata and credential theft vectors
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required" # IMDSv2 Strict Requirement
    http_put_response_hop_limit = 1          # Prevents container traversal to host metadata
    instance_metadata_tags      = "disabled"
  }

  block_device_mappings {
    device_name = "/dev/xvda"

    ebs {
      volume_size           = 80
      volume_type           = "gp3"
      encrypted             = true
      kms_key_id            = aws_kms_key.eks_secrets.arn
      delete_on_termination = true
    }
  }

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "${var.cluster_name}-node"
    }
  }
}

resource "aws_eks_node_group" "main" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "${var.cluster_name}-primary-workers"
  node_role_arn   = aws_iam_role.node.arn
  subnet_ids      = aws_subnet.private[*].id

  scaling_config {
    desired_size = var.node_desired_size
    max_size     = var.node_max_size
    min_size     = var.node_min_size
  }

  update_config {
    max_unavailable_percentage = 25
  }

  launch_template {
    id      = aws_launch_template.node.id
    version = "$Latest"
  }

  instance_types = var.node_instance_types
  capacity_type  = "ON_DEMAND"

  labels = {
    role        = "worker"
    environment = var.environment
  }

  depends_on = [
    aws_iam_role_policy_attachment.node_AmazonEKSWorkerNodePolicy,
    aws_iam_role_policy_attachment.node_AmazonEKS_CNI_Policy,
    aws_iam_role_policy_attachment.node_AmazonEC2ContainerRegistryReadOnly,
  ]

  tags = {
    Name = "${var.cluster_name}-node-group"
  }
}
