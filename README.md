# Welcome to your CDK JavaScript project!

This is an Infra project for Typescript development with CDK.

The idea is to deploy all resources needed by a WebApp. Frontend + Backend with CI/CD. 
###This is accomplished by using:
* ####Frontend: 
    * S3 bucket
    * Cloudfront
    * IAM
    * ACM
    * Route 53
    * CodePipeline
    * CodeBuild
    * GitHub webhook
    * Lambda to crate cloudfront invalidations
* ####Backend:
    * Application Load Balancer (optional)
    * Elastic Beanstalk
    * CodePipeline
    * CodeBuild
    * "CodeDeploy"
    * GitHub webhook
    * IAM
    * S3 bucket with env variables (optional)
    * Route 53
    * ACM

The `cdk.json` file tells the CDK Toolkit how to execute your app. The build step is not required when using JavaScript.

## npm RUN commands
 * `bootstrap:frontEnd|backEnd -- PROFILE_NAME` needed for cdk deploy to work, create an S3 bucket with assets
 * `synth:frontEnd|backEnd -- PROFILE_NAME` emits the synthesized CloudFormation template
 * `deploy:frontEnd|backEnd -- PROFILE_NAME`command to deploy multiple stack from frontEnd or backEnd App

## Important Notes
* Example to run npm scripts: `npm run bootstrap:frontEnd -- PROFILE_NAME`
* The --profile flag or PROFILE_NAME set the values for `CDK_DEFAULT_ACCOUNT` and `CDK_DEFAULT_REGION` overwriting the .env values previously written.
* The GitHub webhook needs an oath token with admin access to the repository (store in `BACKEND|FRONTEND_GITHUB_OAUTHTOKEN` env variable).
* The frontEnd and backEnd Apps needs a hosted zone in AWS stored in `HOSTED_ZONE_DOMAIN` env.
* `HOSTED_ZONE_DOMAIN_CERTIFICATE_ARN` is the `*.HOSTED_ZONE_DOMAIN` TLS certificate previously requested in the ACM (Aws Certificate Manager). This is needed by the WebApp Stack, and the Application Load Balancer. The region of the certificate must be equal to the region of `CDK_DEFAULT_REGION` or to the --profile flag when running cdk synth and deploy. In other words, the region where the WebApp and Application Load Balancer is going to be deployed has to be equal to the certificate's region. if `HOSTED_ZONE_DOMAIN_CERTIFICATE_ARN` is empty the cdk will issue the certificate.
* With `INSTANCE_TYPE` you set if the Elastic Beanstalk will be a `SINGLE` (with no Application Load Balancer, must use certbot or another method to obtain ssl certificates) or `SHARED_LOAD_BALANCER`. The `SHARED_LOAD_BALANCER` env variable stores the Application Load Balancer Arn (previously made). If the variable is empty, the script will create a new one.
* `FRONTEND_BUILD_COMMAND` is used in the buildspec.yml when building with CodeBuild in CodePipeline.
* The backEnd app will create an S3 bucket, this can be used for storing the .env which must be copied by the CodeBuild project.
### Remember to delete all files inside S3 bucket before run "cdk destroy"

## Cdk native commands

* `npm run test`         perform the jest unit tests
* `cdk deploy`           deploy this stack to your default AWS account/region
* `cdk diff`             compare deployed stack with current state
* `cdk synth`            emits the synthesized CloudFormation template
* `cdk bootstrap --profile=PROFILE_NAME` needed for cdk deploy to work, create an S3 bucket with assets
* `cdk destroy stack1 stack2 ... --profile=PROFILE_NAME` delete the created resources by the application except Clodformation resources and S3 bucket from bootstrap
* `cdk deploy --all --profile=PROFILE_NAME` delete all the created resources by the application except Clodformation resources and S3 bucket from bootstrap
* `cdk deploy stack1 stack2 ... --profile=PROFILE_NAME` command to deploy multiple stack from an app
* `cdk deploy --all --profile=PROFILE_NAME` command to deploy all the stacks from an app
