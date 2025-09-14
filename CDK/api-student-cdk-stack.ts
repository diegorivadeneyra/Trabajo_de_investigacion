import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';

export class ApiStudentCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = ec2.Vpc.fromLookup(this, 'DefaultVPC', {
      isDefault: true,
    });

    const sg = new ec2.SecurityGroup(this, 'CrudSecurityGroup', {
      vpc,
      description: 'Allow inbound traffic on port 8000',
      allowAllOutbound: true,
    });

    sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(8000), 'Allow HTTP on port 8000');

    const cluster = new ecs.Cluster(this, 'CrudCluster', {
      vpc,
    });

    const labRole = iam.Role.fromRoleArn(this, 'LabRole', 'arn:aws:iam::472685703742:role/LabRole', {
      mutable: false,
    });

    const logGroup = new logs.LogGroup(this, 'ApiLogsGroup', {
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const taskDefinition = new ecs.FargateTaskDefinition(this, 'CrudTaskDef', {
      memoryLimitMiB: 512,
      cpu: 256,
      executionRole: labRole,
      taskRole: labRole,
    });

    taskDefinition.addContainer('CrudContainer', {
      image: ecs.ContainerImage.fromRegistry(
        '472685703742.dkr.ecr.us-east-1.amazonaws.com/api-students:latest'
      ),
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'ApiLogs', logGroup }),
      portMappings: [{ containerPort: 8000 }],
    });

    new ecs.FargateService(this, 'CrudService', {
      cluster,
      taskDefinition,
      desiredCount: 1,
      assignPublicIp: true,
      securityGroups: [sg],
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });
  }
}
