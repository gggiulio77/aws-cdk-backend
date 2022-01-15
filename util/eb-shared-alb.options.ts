import { ApplicationLoadBalancer, IApplicationLoadBalancer } from '@aws-cdk/aws-elasticloadbalancingv2';
import { CfnEnvironment } from '@aws-cdk/aws-elasticbeanstalk';

export const sharedAlbOptions = (
    profileName: string,
    loadBalancer: ApplicationLoadBalancer | IApplicationLoadBalancer,
    serverApiDomain: string,
    projectName: string,
    path: string,
): CfnEnvironment.OptionSettingProperty[] => [
    {
        namespace: 'aws:ec2:vpc',
        optionName: 'VPCId',
        value: `${loadBalancer?.vpc!.vpcId}`,
    },
    {
        namespace: 'aws:ec2:vpc',
        optionName: 'Subnets',
        value: loadBalancer?.vpc?.publicSubnets.map((subnet) => subnet.subnetId).join(','),
    },
    {
        namespace: 'aws:ec2:vpc',
        optionName: 'ELBSubnets',
        value: loadBalancer?.vpc?.publicSubnets.map((subnet) => subnet.subnetId).join(','),
    },
    {
        namespace: 'aws:ec2:vpc',
        optionName: 'ELBScheme',
        value: 'public',
    },
    {
        namespace: 'aws:elasticbeanstalk:environment:process:default',
        optionName: 'HealthCheckPath',
        value: '/api/status',
    },
    {
        namespace: 'aws:ec2:instances',
        optionName: 'InstanceTypes',
        value: 't2.micro',
    },
    {
        namespace: 'aws:autoscaling:asg',
        optionName: 'MinSize',
        value: '1',
    },
    {
        namespace: 'aws:autoscaling:asg',
        optionName: 'MaxSize',
        value: '1',
    },
    {
        namespace: 'aws:autoscaling:launchconfiguration',
        optionName: 'IamInstanceProfile',
        value: profileName,
    },
    {
        namespace: 'aws:elasticbeanstalk:environment',
        optionName: 'EnvironmentType',
        value: 'LoadBalanced',
    },
    {
        namespace: 'aws:elasticbeanstalk:environment',
        optionName: 'LoadBalancerType',
        value: 'application',
    },
    {
        namespace: 'aws:elasticbeanstalk:environment',
        optionName: 'LoadBalancerIsShared',
        value: 'true',
    },
    {
        namespace: 'aws:elbv2:loadbalancer',
        optionName: 'SharedLoadBalancer',
        value: `${loadBalancer.loadBalancerArn}`,
    },
    {
        namespace: 'aws:elbv2:listener:443',
        optionName: 'Rules',
        value: `${projectName.split('-').join('')}`,
    },
    {
        namespace: `aws:elbv2:listenerrule:${projectName.split('-').join('')}`,
        optionName: 'HostHeaders',
        value: serverApiDomain,
    },
    // {
    //     namespace: `aws:elbv2:listenerrule:${projectName.split('-').join('')}`,
    //     optionName: 'PathPatterns',
    //     value: path,
    // },
];
