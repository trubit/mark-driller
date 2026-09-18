# ==============================================================================
# MarkDriller Production Terraform Infrastructure as Code (IaC)
# Cloud Provider: AWS (EKS, VPC, IAM, Security Groups)
# Security: KMS Envelope Encryption, Private Subnets, IMDSv2, Zero Static Keys
# ==============================================================================

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.60.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.31.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0.0"
    }
  }

  # Remote State Management with S3 and DynamoDB State Locking
  # Sensitive values in state are protected via KMS Server-Side Encryption
  backend "s3" {
    bucket         = "markdriller-terraform-state-prod"
    key            = "platform/production.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "markdriller-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "MarkDriller"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Security    = "Hardened-Production"
    }
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}
