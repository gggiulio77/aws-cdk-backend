
import { App } from '@aws-cdk/core';
import { ServerApiStack } from '../../stacks/eb.stack';
import { ServerApiCP } from '../../stacks/eb-code-pipeline.stack';
import { ValidationStack } from '../../stacks/validation.stack';
import { ENV } from '../../util/env.validation';

const app = new App();

const ValidateApp = new ValidationStack(app, `Validation-${ENV.PROJECT_NAME}-${ENV.STAGE_NAME}`, {
    projectName: ENV.PROJECT_NAME,
    hostedZoneDomain: ENV.HOSTED_ZONE_DOMAIN,
    certificateArnString: ENV.HOSTED_ZONE_DOMAIN_CERTIFICATE_ARN,
    sharedLoadBalancer: ENV.SHARED_LOAD_BALANCER,
    serverApiInstanceType: ENV.INSTANCE_TYPE,
    env: {
        account: ENV.CDK_DEFAULT_ACCOUNT,
        region: ENV.CDK_DEFAULT_REGION,
    },
});

const ServerApiAppStack = new ServerApiStack(app, `${ENV.PROJECT_NAME}-${ENV.STAGE_NAME}`, {
    projectName: ENV.PROJECT_NAME,
    stageName: ENV.STAGE_NAME,
    loadBalancer: ValidateApp.loadBalancer,
    serverApiInstanceType: ENV.INSTANCE_TYPE,
    hostedZone: ValidateApp.hostedZone,
    serverApiDomain: ENV.BACKEND_DOMAIN,
    path: ENV.BACKEND_PATH,
    env: {
        account: ENV.CDK_DEFAULT_ACCOUNT,
        region: ENV.CDK_DEFAULT_REGION,
    },
});

const ServerApiCPAppStack = new ServerApiCP(app, `${ENV.PROJECT_NAME}-${ENV.STAGE_NAME}-CodePipeline`, {
    stageName: ENV.STAGE_NAME,
    branch: ENV.BACKEND_GITHUB_REPO_BRANCH,
    owner: ENV.BACKEND_GITHUB_OWNER,
    oauthToken: ENV.BACKEND_GITHUB_OAUTHTOKEN,
    repo: ENV.BACKEND_GITHUB_REPO,
    environmentName: ServerApiAppStack.environmentName,
    applicationName: ServerApiAppStack.applicationName,
    domain: ENV.BACKEND_DOMAIN,
    projectName: ENV.PROJECT_NAME,
    env: {
        account: ENV.CDK_DEFAULT_ACCOUNT,
        region: ENV.CDK_DEFAULT_REGION,
    },
});

ServerApiAppStack.addDependency(ValidateApp);
ServerApiCPAppStack.addDependency(ServerApiAppStack);
