#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { StaticSiteInfraDemoStack } from '../lib/static-site-infra-demo-stack';

const app = new cdk.App();
new StaticSiteInfraDemoStack(app, 'StaticSiteInfraDemoStack', {
    env: { account: '11111111111', region: 'eu-central-1' },
});