"use strict";
const cf = require('aws-sdk/clients/cloudfront');
/**
 * Wraps an api function in a Promise
 * @param fn function to execute asynchronously
 * @param  options Options for call
 */
function promiseWrap(fn, options) {
    return new Promise((resolved, reject) => {
        fn(options, (err, data) =>{ 
            if(err) {
                reject(err);
            } else {
                resolved(data);
            }
        });
    });
}
/**
 * Main entry - lock distributions
 */
exports.lockOut = async () => {
    let all = await promiseWrap(cf.listDistributions, {});
    let items = all.DistributionList.Items.filter(it => it.Enabled);
    if(items.length === 0) {
        console.log('No active distrubutions found');
        return 'No enabled distributions';
    } else {
        for(let distributionId of items.map(it => it.Id)) {
            console.log('Attempting to disable ' + distributionId);
            let config = await promiseWrap(cf.getDistributionConfig, {Id : distributionId});
            delete config.ETag;
            config.Enabled = false;
            await promiseWrap(cf.updateDistribution, config);
            console.log(`Distribution id ${distributionId} update sent`);
        }
        return 'Disabled: ' + items.map(it => it.Id).join(', ');
    }
}; 