import pulumi
import pulumi_aws as aws

default_vpc = aws.ec2.get_vpc(default=True)
default_subnets = aws.ec2.get_subnets(filters=[{"name":"vpc-id","values":[default_vpc.id]}])

sg = aws.ec2.SecurityGroup("crud-sg",
    vpc_id=default_vpc.id,
    description="Allow inbound 8000",
    ingress=[aws.ec2.SecurityGroupIngressArgs(
        protocol="tcp",
        from_port=8000,
        to_port=8000,
        cidr_blocks=["0.0.0.0/0"],
    )],
    egress=[aws.ec2.SecurityGroupEgressArgs(
        protocol="-1",
        from_port=0,
        to_port=0,
        cidr_blocks=["0.0.0.0/0"],
    )]
)

cluster = aws.ecs.Cluster("crud-cluster")

# Task Definition
task_definition = aws.ecs.TaskDefinition("crud-task",
    family="crud-task",
    cpu="256",
    memory="512",
    network_mode="awsvpc",
    requires_compatibilities=["FARGATE"],
    execution_role_arn="arn:aws:iam::472685703742:role/LabRole",
    container_definitions=pulumi.Output.secret(f"""
    [{{
        "name": "crud-container",
        "image": "472685703742.dkr.ecr.us-east-1.amazonaws.com/api-students:latest",
        "portMappings": [{{ "containerPort": 8000, "hostPort": 8000, "protocol": "tcp" }}]
    }}]
    """)
)

service = aws.ecs.Service("crud-service",
    cluster=cluster.arn,
    task_definition=task_definition.arn,
    desired_count=1,
    launch_type="FARGATE",
    network_configuration=aws.ecs.ServiceNetworkConfigurationArgs(
        subnets=default_subnets.ids,
        assign_public_ip=True,
        security_groups=[sg.id]
    )
)

pulumi.export("cluster_name", cluster.name)
pulumi.export("service_name", service.name)
