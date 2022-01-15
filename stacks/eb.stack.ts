import { CfnApplication, CfnEnvironment } from '@aws-cdk/aws-elasticbeanstalk';
import { Role, ServicePrincipal, ManagedPolicy, CfnInstanceProfile } from '@aws-cdk/aws-iam';
import { Stack, CfnOutput, App, StackProps, ConcreteDependable } from '@aws-cdk/core';
import { AliasRecordTargetConfig, ARecord, IAliasRecordTarget, IHostedZone, RecordTarget } from '@aws-cdk/aws-route53';
import { LoadBalancerTarget } from '@aws-cdk/aws-route53-targets';
import { ApplicationLoadBalancer, IApplicationLoadBalancer } from '@aws-cdk/aws-elasticloadbalancingv2';
import { SecurityGroup, Vpc } from '@aws-cdk/aws-ec2';
import { sharedAlbOptions } from '../util/eb-shared-alb.options';
import { ebSingleOptions } from '../util/eb-single.options';
import { getLastNodeStack } from '../util/node-stack.getter';
// TODO: add this to a types file
export interface ServerApiStackProps extends StackProps {
    hostedZone: IHostedZone;
    projectName: string;
    stageName: string;
    serverApiInstanceType: string;
    loadBalancer: ApplicationLoadBalancer | IApplicationLoadBalancer | null;
    serverApiDomain: string;
    path: string;
    env: { account: string, region: string};
}
// TODO: add this to a constants file
const endpointTargetsIds = {
    'us-east-1': 'Z117KPS5GTRQ2G',
    'us-east-2': 'Z14LCN19Q5QHIC',
    'sa-east-1': 'Z10X7K2B4QSOFV',
};
// TODO: add this to a types file
type AwsRegion = 'us-east-1' | 'us-east-2' | 'sa-east-1';

export class ServerApiStack extends Stack {
    public environmentName: string;
    public applicationName: string;

    constructor(app: App, id: string, props: ServerApiStackProps) {
        super(app, id, props);
        const zone = props.hostedZone;

        // EB names
        this.environmentName = `${props.projectName}-${props.stageName}`;
        this.applicationName = `${props.projectName}`;
        // EB IAM Roles
        const EbInstanceRole = new Role(this, `${props.projectName}-aws-elasticbeanstalk-ec2-role`, {
            assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
            roleName: `${props.projectName}-Elb`,
        });

        const managedPolicy = ManagedPolicy.fromAwsManagedPolicyName('AWSElasticBeanstalkWebTier');
        EbInstanceRole.addManagedPolicy(managedPolicy);

        const profileName = `${props.projectName}-InstanceProfile`;
        new CfnInstanceProfile(this, profileName, {
            instanceProfileName: profileName,
            roles: [
                EbInstanceRole.roleName,
            ],
        });

        let optionSettingProperties: CfnEnvironment.OptionSettingProperty[] = [];
        const sgDependable = new ConcreteDependable();
        // TODO: Add option to create instance with APL not shared
        if (props.serverApiInstanceType === 'SHARED_LOAD_BALANCER' && props.loadBalancer) {
            // Add record to route53, the target is the alb
            new ARecord(this, `${props.projectName}-AliasRecord`, {
                recordName: props.serverApiDomain,
                target: RecordTarget.fromAlias(new LoadBalancerTarget(props.loadBalancer)),
                zone,
            });
            // Load Balanced with SHARED APL
            // It must be a valid, active load balancer in the AWS Region where the environment is located.
            // It must be in the same Amazon Virtual Private Cloud (Amazon VPC) as the environment.
            // eslint-disable-next-line max-len
            // It can't be a load balancer that was created by Elastic Beanstalk as the dedicated load balancer for another environment. You can identify these dedicated load balancers by using the prefix awseb-.
            optionSettingProperties = sharedAlbOptions(profileName, props.loadBalancer, props.serverApiDomain, props.projectName, props.path);
        } else if (props.serverApiInstanceType === 'SINGLE') {
            // TODO: find a way to programmatically obtain the Route 53 Hosted Zone ID by region of Elastic Beanstalk Service endpoints
            // dnsName works because the cnamePrefix of eb environment is ${this.environmentName.toLowerCase()} and
            // AWS will make a cnamePrefix.region.elasticbeanstalk.com url for Elastic Beanstalk
            const ebRecordAlias: IAliasRecordTarget = {
                bind: (): AliasRecordTargetConfig => ({
                    dnsName: `${this.environmentName.toLowerCase()}.${props.env?.region}.elasticbeanstalk.com`,
                    hostedZoneId: endpointTargetsIds[props.env.region as AwsRegion], // us-east-2 - elasticbeanstalk.us-east-1.amazonaws.com
                }),
            };
            // Create Route53 record aiming to aws eb dns
            new ARecord(this, `${props.projectName}-AliasRecord`, {
                recordName: props.serverApiDomain,
                target: RecordTarget.fromAlias(ebRecordAlias),
                zone,
            });
            // Get default Vpc a create a security group
            const defaultVpc = Vpc.fromLookup(this, 'Default VPC', { isDefault: true });
            const SECURITY_GROUP_NAME = `awseb-e-${this.environmentName.toLowerCase()}`;
            const serverSG = new SecurityGroup(this, `${this.environmentName.toLowerCase()}-SG`, {
                securityGroupName: SECURITY_GROUP_NAME,
                vpc: defaultVpc,
                allowAllOutbound: true,
                description: `Security group for the ${this.environmentName} ElasticBeanstalk`,
            });
            // Add security group as dependable, this way we cant make a dependency to environment
            sgDependable.add(serverSG);
            // Add ingress rules to security group and Add Eb single instance cloud formation options
            optionSettingProperties = ebSingleOptions(profileName, serverSG, SECURITY_GROUP_NAME);
        }

        // EB Application and Environment
        // applicationName doest not include stageName, this way the servers are sharing the applicationName
        const application = new CfnApplication(this, 'Application', {
            applicationName: this.applicationName,
        });

        const lastNodeStack = getLastNodeStack(this.node);
        new CfnOutput(this, 'solutionStackName', { value: lastNodeStack });

        const environment = new CfnEnvironment(this, 'Environment', {
            environmentName: this.environmentName,
            applicationName: this.applicationName,
            solutionStackName: lastNodeStack,
            optionSettings: [...optionSettingProperties],
            cnamePrefix: `${this.environmentName.toLowerCase()}`,
        });
        if (props.serverApiInstanceType === 'SINGLE') environment.node.addDependency(sgDependable);
        environment.addDependsOn(application);
    }
}
