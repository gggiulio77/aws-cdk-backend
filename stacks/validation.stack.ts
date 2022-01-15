import { App, StackProps, Stack } from '@aws-cdk/core';

import {
    Certificate,
    CertificateValidation,
    ICertificate,
} from '@aws-cdk/aws-certificatemanager';
import { HostedZone, IHostedZone } from '@aws-cdk/aws-route53';

import { ApplicationLoadBalancer, IApplicationLoadBalancer } from '@aws-cdk/aws-elasticloadbalancingv2';
import { AlbStack } from './alb.stack';

export interface ValidationStackProps extends StackProps {
    projectName: string;
    hostedZoneDomain: string;
    certificateArnString: string;
    sharedLoadBalancer: string;
    serverApiInstanceType: string;
}

export class ValidationStack extends Stack {
    public hostedZone: IHostedZone;
    public certificate: ICertificate;
    public certificateArn: string;
    public loadBalancer: ApplicationLoadBalancer | IApplicationLoadBalancer;

    constructor(app: App, id: string, props: ValidationStackProps) {
        super(app, id, props);

        // Validate Resources: Certificate (CloudFront or APL), HostedZone and APL
        this.hostedZone = HostedZone.fromLookup(this, 'Zone', { domainName: props.hostedZoneDomain });
        if (props.serverApiInstanceType === 'SHARED_LOAD_BALANCER') {
            // Request Certificate (in CDK_DEFAULT_REGION)
            if (!props.certificateArnString) {
                this.certificate = new Certificate(this, `${props.projectName}-Certificate`, {
                    domainName: props.hostedZoneDomain,
                    subjectAlternativeNames: [`*.${props.hostedZoneDomain}`],
                    validation: CertificateValidation.fromDns(this.hostedZone),
                });
            } else {
                if (props.certificateArnString.split(':')[3] !== props.env?.region) {
                    throw new Error('HOSTED_ZONE_DOMAIN_CERTIFICATE_ARN is located in another region');
                }
                if (props.certificateArnString.split(':')[4] !== props.env?.account) {
                    throw new Error('HOSTED_ZONE_DOMAIN_CERTIFICATE_ARN is located in another account');
                }
                this.certificate = Certificate.fromCertificateArn(this, `${props.projectName}-Certificate`, props.certificateArnString);
            }
            if (props.sharedLoadBalancer && props.sharedLoadBalancer !== '') {
                this.loadBalancer = ApplicationLoadBalancer.fromLookup(this, 'ALB', {
                    loadBalancerArn: props.sharedLoadBalancer,
                });
            } else {
                const AlbStackApp = new AlbStack(this, 'SHARED-ALB', {
                    projectName: props.projectName,
                    sharedLoadBalancer: props.sharedLoadBalancer,
                    serverApiInstanceType: props.serverApiInstanceType,
                    certificateArnString: this.certificate.certificateArn,
                    env: {
                        account: props.env?.account,
                        region: props.env?.region,
                    },
                });
                this.loadBalancer = AlbStackApp.loadBalancer;
            }
        }
    }
}
