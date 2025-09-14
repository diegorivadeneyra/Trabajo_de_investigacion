#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ApiStudentCdkStack } from '../lib/api-student-cdk-stack';

const app = new cdk.App();

new ApiStudentCdkStack(app, 'ApiStudentCdkStack', {
  env: {
    account: '472685703742',
    region: 'us-east-1',
  },
});
