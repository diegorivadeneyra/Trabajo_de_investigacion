provider "aws" {
  region  = "us-east-1"
  profile = "default"
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  name    = "crud-api-vpc"
  cidr    = "10.0.0.0/16"
  azs     = ["us-east-1a", "us-east-1b"]
  public_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  enable_dns_hostnames = true
}

resource "aws_security_group" "crud_sg" {
  name        = "crud-api-sg"
  description = "Permitir acceso HTTP"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 8000
    to_port     = 8000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_ecs_cluster" "crud_cluster" {
  name = "crud-api-cluster"
}


resource "aws_ecs_task_definition" "crud_task" {
  family                   = "crud-api-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = "arn:aws:iam::472685703742:role/LabRole"

  container_definitions = jsonencode([
    {
      name      = "crud-container",
      image     = "472685703742.dkr.ecr.us-east-1.amazonaws.com/api-students:latest",
      essential = true,
      portMappings = [{
        containerPort = 8000,
        hostPort      = 8000,
        protocol      = "tcp"
      }]
    }
  ])
}


resource "aws_ecs_service" "crud_service" {
  name            = "crud-api-service"
  cluster         = aws_ecs_cluster.crud_cluster.id
  task_definition = aws_ecs_task_definition.crud_task.arn
  launch_type     = "FARGATE"
  desired_count   = 1

  network_configuration {
    subnets         = module.vpc.public_subnets
    security_groups = [aws_security_group.crud_sg.id]
    assign_public_ip = true
  }
}
