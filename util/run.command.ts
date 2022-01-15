import { createCommand } from 'commander';
import { spawn } from 'child_process';

const program = createCommand();
type Action = 'bootstrap' | 'synth' | 'deploy';

interface Args {
    profile: string,
    action: Action,
    directory: string,
}

program
    .description('Run cdk with profile as argument')
    .requiredOption('-p, --profile <string>', 'Set profile')
    .requiredOption('-a, --action <Action>', 'Action to run')
    .requiredOption('-d, --directory <string>', 'Directory to run')
    .action((ars: Args) => {
        console.log(ars);
        spawn(`cd ${ars.directory} && cdk ${ars.action} --all -c profile=${ars.profile} --profile ${ars.profile}`, { shell: true, stdio: 'inherit' });
    });

program.parse();
