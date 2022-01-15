// import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
// import {ValidationStack} from "../stacks/validation.stack";
// import { App } from "@aws-cdk/core";
// import {ENV} from "../util/env.validation";
//
// test('Empty Stack', () => {
//     const app = new App();
//     // WHEN
//     const stack = new ValidationStack(app, 'ValidationTestStack', {
//         projectName: ENV.PROJECT_NAME,
//         hostedZoneDomain: ENV.HOSTED_ZONE_DOMAIN,
//         certificateArnString: ENV.HOSTED_ZONE_DOMAIN_CERTIFICATE_ARN,
//         sharedLoadBalancer: ENV.SHARED_LOAD_BALANCER,
//         env: {
//             account: ENV.CDK_DEFAULT_ACCOUNT,
//             region: ENV.CDK_DEFAULT_REGION,
//         },
//     });
//     // THEN
//     expectCDK(stack).to(matchTemplate({
//         "Resources": {}
//     }, MatchStyle.EXACT))
// });
