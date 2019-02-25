"use strict";
const AWS = require('aws-sdk');
const cf = new AWS.CloudFront();

/** 
 * Main entry - lock distributions
 */
exports.lockOut = async () => {
    let all = await cf.listDistributions({}).promise();
    let items = all.DistributionList.Items.filter(it => it.Enabled);
    if (items.length === 0) {
        console.log('No active distrubutions found');
        return 'No enabled distributions';
    } else {
        for (let distributionId of items.map(it => it.Id)) {
            console.log('Attempting to disable ' + distributionId);
            let config = await cf.getDistributionConfig({ Id: distributionId }).promise();
            config.IfMatch = config.ETag;
            delete config.ETag;
            config.DistributionConfig.Enabled = false;
            config.Id = distributionId;
            await cf.updateDistribution(config).promise();
            console.log(`Distribution id ${distributionId} update sent`);
        }
        return 'Disabled: ' + items.map(it => it.Id).join(', ');
    }
}; 