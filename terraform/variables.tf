variable "aws_region" {
  description = "AWS region for infrastructure provisioning"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment name"
  type        = string
  default     = "production"
  validation {
    condition     = contains(["production", "staging", "development"], var.environment)
    error_message = "Environment must be one of: production, staging, development."
  }
}

variable "cluster_name" {
  description = "Name of the managed EKS Kubernetes cluster"
  type        = string
  default     = "markdriller-prod-eks"
}

variable "cluster_version" {
  description = "Kubernetes control plane version"
  type        = string
  default     = "1.31"
}

variable "vpc_cidr" {
  description = "CIDR block for the dedicated Virtual Private Cloud"
  type        = string
  default     = "10.100.0.0/16"
}

variable "node_instance_types" {
  description = "EC2 instance types for EKS worker nodes (engineered for 4,000+ concurrent users)"
  type        = list(string)
  default     = ["m6i.xlarge", "m5.xlarge"]
}

variable "node_min_size" {
  description = "Minimum number of worker nodes in the auto-scaling group"
  type        = number
  default     = 3
}

variable "node_max_size" {
  description = "Maximum number of worker nodes to absorb peak examination load (4,000+ users)"
  type        = number
  default     = 12
}

variable "node_desired_size" {
  description = "Desired baseline number of worker nodes"
  type        = number
  default     = 4
}
