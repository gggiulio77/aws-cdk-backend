import { execSync } from 'child_process';
import { ConstructNode } from '@aws-cdk/core';

const getLastNodeStack = (node: ConstructNode): string => {
    // Using amazon cli we can get a list of solution stacks order by newer versions
    // Get profile used in npm run command
    if (!node.tryGetContext('profile')) {
        throw new Error('The syntax of the command was wrong. Example: npm run synth:backEnd --profile=PROFILE_NAME -- PROFILE_NAME');
    }
    // eslint-disable-next-line max-len
    const solutionStacks = execSync(`aws elasticbeanstalk list-available-solution-stacks --profile ${node.tryGetContext('profile') as string} --query SolutionStacks`);
    if (!solutionStacks) throw new Error('Cannot find a solution Stack for Node.js 14 64bit Amazon Linux 2');
    const lastNodeStack = JSON
        .parse(solutionStacks.toString())
        .filter((stack: string) => stack.includes('Node.js 14') && stack.includes('64bit Amazon Linux 2'))
        .shift();
    if (!lastNodeStack) throw new Error('Cannot find a solution Stack for Node.js 14 64bit Amazon Linux 2');
    return lastNodeStack as string;
};

export { getLastNodeStack };
