import { cleanEnv, str, host, makeValidator } from 'envalid';
import { config } from 'dotenv';

config({ path: '../../.env' });
const NotWhiteSpaceAndNotEmptyString = new RegExp('^$|\\s+');

const loadBalancerValidation = makeValidator((env) => {
    if (env) {
        if (env.split(':')[4] !== process.env.CDK_DEFAULT_ACCOUNT) throw new Error('SHARED_LOAD_BALANCER is located in another account');
        if (env.split(':')[3] !== process.env.CDK_DEFAULT_REGION) throw new Error('SHARED_LOAD_BALANCER is located in another region');
    }
    return env;
});

const stringEmptyWhiteSpaceValidation = makeValidator((env) => {
    if (NotWhiteSpaceAndNotEmptyString.test(env)) {
        throw new Error('String contains a whitespace or is empty');
    }
    return env;
});

export const ENV = cleanEnv(process.env, {
    CDK_DEFAULT_ACCOUNT: stringEmptyWhiteSpaceValidation(),
    CDK_DEFAULT_REGION: str({ choices: ['us-east-1', 'us-east-2', 'sa-east-1'] }),
    PROJECT_NAME: stringEmptyWhiteSpaceValidation(),
    STAGE_NAME: str({ choices: ['PRODUCTION', 'Production', 'DEVELOPMENT', 'Development', 'STAGING', 'Staging', 'DEMO', 'Demo', 'TEST', 'test'] }),
    HOSTED_ZONE_DOMAIN: host(),
    HOSTED_ZONE_DOMAIN_CERTIFICATE_ARN: str(),
    BACKEND_GITHUB_REPO_BRANCH: stringEmptyWhiteSpaceValidation(),
    BACKEND_GITHUB_OWNER: stringEmptyWhiteSpaceValidation(),
    BACKEND_GITHUB_OAUTHTOKEN: stringEmptyWhiteSpaceValidation(),
    BACKEND_GITHUB_REPO: stringEmptyWhiteSpaceValidation(),
    BACKEND_DOMAIN: host(),
    BACKEND_PATH: str(),
    SHARED_LOAD_BALANCER: loadBalancerValidation(),
    INSTANCE_TYPE: str({ choices: ['SHARED_LOAD_BALANCER', 'SINGLE'] }),
});
