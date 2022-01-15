import {
    ApplicationLoadBalancer,
    ApplicationProtocol,
    IApplicationLoadBalancer,
    ListenerAction,
} from '@aws-cdk/aws-elasticloadbalancingv2';
import { Construct, NestedStack, NestedStackProps } from '@aws-cdk/core';
import { Vpc } from '@aws-cdk/aws-ec2';
import { Certificate } from '@aws-cdk/aws-certificatemanager';

export interface AlbStackProps extends NestedStackProps {
    serverApiInstanceType: string;
    sharedLoadBalancer: string;
    projectName: string;
    certificateArnString: string;
    env: {
        account?: string,
        region?: string,
    },
}

export class AlbStack extends NestedStack {
    public loadBalancer: ApplicationLoadBalancer | IApplicationLoadBalancer;

    constructor(scope: Construct, id: string, props: AlbStackProps) {
        super(scope, id, props);
        // Create ALB
        const defaultVpc = Vpc.fromLookup(this, 'Default VPC', { isDefault: true });
        const loadBalancer = new ApplicationLoadBalancer(this, 'APL', {
            vpc: defaultVpc,
            internetFacing: true,
            loadBalancerName: 'SHARED-ALB',
        });

        loadBalancer.addRedirect({
            sourceProtocol: ApplicationProtocol.HTTP,
            sourcePort: 80,
            targetProtocol: ApplicationProtocol.HTTPS,
            targetPort: 443,
        });

        const certificate = Certificate.fromCertificateArn(this, `CDK-${props.projectName}-Certificate`, props.certificateArnString).certificateArn;

        loadBalancer.addListener('HTTPS Listener', {
            port: 443,
            open: true,
            protocol: ApplicationProtocol.HTTPS,
            certificates: [{ certificateArn: certificate }],
            defaultAction: ListenerAction.fixedResponse(200, {
                contentType: 'text/plain',
                messageBody: 'OK',
            }),
        });
        this.loadBalancer = loadBalancer;
    }
}
