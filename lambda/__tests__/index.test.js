"use strict";

process.env.MOBILE_NUMBER = '+44 7720 88888';
process.env.SUBSYSTEMS = 'CloudFront,S3,ec2';
process.env.TOPIC_ARN = 'arn:aws:sns:eu-west-1:278795638469:spend-limit';

const index = require('../index');
const event = require('./assets/limit-message.json');
const AWS = require('aws-sdk-mock');
const dList = require('./assets/dist-lists.json');
const bucketList = require('./assets/bucketlist.json');
const acls = require('./assets/acl3.json');
describe('Tests of main script', () => {
    it('Simple run - no hits', async () => {
        AWS.mock('SNS', 'publish', options => {
            expect(options.PhoneNumber).toBe('+44 7720 88888')
            return Promise.resolve('Publish OK');
        });
        AWS.mock('CloudFront', 'listDistributions', options => {
            return Promise.resolve(dList);
        });
        AWS.mock('S3', 'listBuckets', () => Promise.resolve(bucketList));
        const bucketOrder = {
            'assets.theriomorph.me.uk' : 0,
            'aws.theriomorph.me.uk' : 1,
            'publictest.theriomorph.me.uk' : 2
        };
        AWS.mock('S3', 'getBucketAcl', options => {
            expect(options.Bucket).toBeDefined();
            return Promise.resolve(acls[bucketOrder[options.Bucket]]);
        });
        AWS.mock('S3', "getBucketWebsite", options => {
            let err = new Error('NoSuchWebsiteConfiguration');
            err.code = 'NoSuchWebsiteConfiguration';
            return Promise.reject(err);
        });
    
        AWS.mock('EC2', 'describeInstances', options=> {
            expect(options.Filters.length).toEqual(1);
            return Promise.resolve({
                Reservations: []
            });
        });
        let result = await index.handler(event);
        console.log('Result', JSON.stringify(result));
    }, 100000);
});