import { Peer, Port, SecurityGroup } from '@aws-cdk/aws-ec2';

const ebSingleOptions = (
    profileName: string,
    securityGroup: SecurityGroup,
    sgName: string,
) => {
    securityGroup.addIngressRule(
        Peer.anyIpv4(),
        Port.tcp(22),
        'allow SSH access from anywhere',
    );

    securityGroup.addIngressRule(
        Peer.anyIpv4(),
        Port.tcp(80),
        'allow HTTP traffic from anywhere',
    );

    securityGroup.addIngressRule(
        Peer.anyIpv4(),
        Port.tcp(443),
        'allow HTTPS traffic from anywhere',
    );

    return [
        {
            namespace: 'aws:ec2:instances',
            optionName: 'InstanceTypes',
            value: 't2.micro',
        },
        {
            namespace: 'aws:autoscaling:launchconfiguration',
            optionName: 'IamInstanceProfile',
            value: profileName,
        },
        {
            namespace: 'aws:autoscaling:launchconfiguration',
            optionName: 'SecurityGroups',
            value: sgName,
        },
        {
            namespace: 'aws:elasticbeanstalk:environment',
            optionName: 'EnvironmentType',
            value: 'SingleInstance',
        },
    ];
};

export { ebSingleOptions };
