"use strict";

process.env.MOBILE_NUMBER = '+44 7720 88888';
process.env.SUBSYSTEMS = 'CloudFront,S3';
process.env.TOPIC_ARN = 'arn:aws:sns:eu-west-1:278795638469:spend-limit';

const index = require('../index');
const event = require('./assets/limit-message.json');
const AWS = require('aws-sdk');
AWS.config.update({
    httpOptions: {
        timeout: 500, connectionTimeout: 10000
    },
    region: 'eu-west-1'
});
describe('Tests of main script', () => {
    it('Simple run', async () => {
        let result = await index.handler(event);
        console.log('Result', JSON.stringify(result));
    }, 100000);
});