# Static Site Infra Demo in CDK

This demo project accompanies the article at https://idanlupinsky.com/blog/static-site-deployment-using-aws-cloudfront-and-the-cdk/.

Make sure to update the AWS account, region and domain name in the CDK stack and then try `cdk diff`.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template
