import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';

export class ApiStudentCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Buscar la VPC por defecto
    const vpc = ec2.Vpc.fromLookup(this, 'DefaultVPC', { isDefault: true });

    // Crear el clúster ECS
    const cluster = new ecs.Cluster(this, 'ApiCluster', { vpc });

    // Reutilizar el rol LabRole para evitar errores de permisos
    const labRole = iam.Role.fromRoleArn(this, 'LabRole',
      'arn:aws:iam::472685703742:role/LabRole'
    );

    // Definición de tarea Fargate con imagen desde ECR
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'ApiTaskDef', {
      executionRole: labRole,
      taskRole: labRole,
    });

    const container = taskDefinition.addContainer('ApiContainer', {
      image: ecs.ContainerImage.fromRegistry(
        '472685703742.dkr.ecr.us-east-1.amazonaws.com/api-students:latest'
      ),
      memoryLimitMiB: 512,
      cpu: 256,
    });

    container.addPortMappings({ containerPort: 8000 });

    // Servicio Fargate con IP pública
    new ecs.FargateService(this, 'ApiService', {
      cluster,
      taskDefinition,
      desiredCount: 1,
      assignPublicIp: true,
    });
  }
}
