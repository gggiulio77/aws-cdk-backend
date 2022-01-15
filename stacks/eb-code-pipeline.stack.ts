import { PipelineProject, BuildSpec, LinuxBuildImage, BuildEnvironmentVariableType } from '@aws-cdk/aws-codebuild';
import { Artifact, Pipeline } from '@aws-cdk/aws-codepipeline';
import { GitHubSourceAction, CodeBuildAction, GitHubTrigger } from '@aws-cdk/aws-codepipeline-actions';
import { ManagedPolicy } from '@aws-cdk/aws-iam';
import { Stack, SecretValue, App, StackProps, RemovalPolicy } from '@aws-cdk/core';
import { BlockPublicAccess, Bucket } from '@aws-cdk/aws-s3';
import { BucketDeployment, Source } from '@aws-cdk/aws-s3-deployment';
import { ElasticBeanstalkDeployAction } from '../util/eb-deploy.action';

export interface ServerApiCPProps extends StackProps {
    projectName: string;
    stageName: string;
    branch: string;
    owner: string;
    oauthToken: string;
    repo: string;
    domain: string;
    environmentName: string;
    applicationName: string;
}

export class ServerApiCP extends Stack {
    constructor(app: App, id: string, props: ServerApiCPProps) {
        super(app, id, props);

        // Create CodeBuild to build the Server
        const codeBuildProject = new PipelineProject(this, `${props.projectName}${props.stageName}CodeBuild`, {
            buildSpec: BuildSpec.fromSourceFilename('buildspec.yml'),
            environment: {
                buildImage: LinuxBuildImage.AMAZON_LINUX_2_3,
            },
        });

        // Create bucket to store ElasticBeanstalk env file
        const ENVS_BUCKET_NAME = `${props.projectName}-${props.stageName}-server-envs`.toLowerCase();
        const envsBucket = new Bucket(this, `ServerApi-${props.projectName}-Bucket`, {
            bucketName: ENVS_BUCKET_NAME,
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
            removalPolicy: RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
        });
        // Copy env file in backend-bucket directory
        // TODO: add logic to verify if an env file exist on the project root directory
        // const bucketDeployment = new BucketDeployment(this, `ServerApi-${props.projectName}-BucketDeployment`, {
        //     sources: [Source.asset('../../backend-bucket')],
        //     destinationBucket: ebBucket,
        // });

        // Grant CodeBuild project permission to access backend envs-bucket with env file in it.
        // buildspec.yml must contain an aws cli command to copy the env file from bucket, user the ENVS_BUCKET_NAME env variable as $ENVS_BUCKET_NAME
        // another option is to create a lambda which runs after the code build action and modify the output artifact to add the env file
        envsBucket.grantReadWrite(codeBuildProject);

        // Create CodePipeline Artifacts
        const codeBuildProjectOutput = new Artifact(`${props.projectName}-BuildOutput`);
        // Create CodePipeline Artifacts
        const sourceOutput = new Artifact();

        // Create CodePipeline
        const ebCodePipeline = new Pipeline(this, `${props.projectName}-${props.stageName}-CodePipeline`, {
            pipelineName: `${props.projectName}-${props.stageName}-CodePipeline`,
            crossAccountKeys: false,
            stages: [
                {
                    stageName: 'Source',
                    actions: [
                        new GitHubSourceAction({
                            actionName: 'Github_Source',
                            branch: props.branch,
                            owner: props.owner,
                            oauthToken: SecretValue.plainText(props.oauthToken),
                            repo: props.repo,
                            trigger: GitHubTrigger.WEBHOOK,
                            output: sourceOutput,
                        }),
                    ],
                },
                {
                    stageName: 'Build',
                    actions: [
                        new CodeBuildAction({
                            actionName: `${props.projectName}-Build`,
                            project: codeBuildProject,
                            input: sourceOutput,
                            outputs: [codeBuildProjectOutput],
                            environmentVariables: {
                                DOMAIN: {
                                    value: props.domain,
                                    type: BuildEnvironmentVariableType.PLAINTEXT,
                                },
                                ENVS_BUCKET_NAME: {
                                    value: ENVS_BUCKET_NAME,
                                    type: BuildEnvironmentVariableType.PLAINTEXT,
                                },
                            },
                        }),
                    ],
                },
            ],
        });
        // Grant code pipeline access to operate the elastic beanstalk application
        ebCodePipeline.role.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess-AWSElasticBeanstalk'));
        ebCodePipeline.addStage({
            stageName: 'Deploy',
            actions: [
                new ElasticBeanstalkDeployAction({
                    ebsEnvironmentName: props.environmentName,
                    ebsApplicationName: props.applicationName,
                    input: codeBuildProjectOutput,
                    role: ebCodePipeline.role,
                    actionName: `${props.projectName}-Deploy`,
                }),
            ],
        });
    }
}
