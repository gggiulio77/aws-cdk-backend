import { IRole } from '@aws-cdk/aws-iam';
import {
    ActionBindOptions,
    ActionProperties,
    Artifact,
    CommonAwsActionProps,
    IAction,
    IStage,
    ActionCategory,
} from '@aws-cdk/aws-codepipeline';
import { Construct } from '@aws-cdk/core';
import { IRuleTarget, Rule, RuleProps } from '@aws-cdk/aws-events';

export interface ElasticBeanstalkDeployActionProps extends CommonAwsActionProps {
    ebsEnvironmentName: string;
    ebsApplicationName: string;
    input: Artifact;
    role: IRole;
}

export class ElasticBeanstalkDeployAction implements IAction {
    public readonly actionProperties: ActionProperties;
    private readonly props: ElasticBeanstalkDeployActionProps;

    constructor(props: ElasticBeanstalkDeployActionProps) {
        this.actionProperties = {
            ...props,
            category: ActionCategory.DEPLOY,
            owner: 'AWS',
            provider: 'ElasticBeanstalk',
            artifactBounds: {
                minInputs: 1,
                maxInputs: 1,
                minOutputs: 0,
                maxOutputs: 0,
            },
            inputs: [props.input],
        };
        this.props = props;
    }

    public bind(scope: Construct, stage: IStage, options: ActionBindOptions) {
        options.bucket.grantRead(options.role);
        return {
            configuration: {
                ApplicationName: this.props.ebsApplicationName,
                EnvironmentName: this.props.ebsEnvironmentName,
            },
        };
    }

    public onStateChange(name: string, target?: IRuleTarget, options?: RuleProps): Rule {
        throw new Error('not supported');
    }
}
