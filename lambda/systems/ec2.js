"use strict";
const AWS = require('aws-sdk');
const ec2 = new AWS.EC2();
const filterTag = process.env['EC2_DRAWBRIDGE_TAG'];

/**
 * Stop any running EC2 instances that might be receiving flood
 * if environmantal variable EC2_DRAWBBRIDGE_TAG is given only
 * instances carrying a tag with this key are affected. If not
 * all running instances are stopped.
 */
exports.lockOut = async () => {
    const filters = {
        Filters: [
            {
                Name: 'instance-state-name',
                Values: [
                    'pending',
                    'running'
                ]
            }
        ]
    };
    let runningInstances = await ec2.describeInstances(filters).promise();
    // extract instances from reservations
    runningInstances = runningInstances.Reservations.map(r => r.Instances).reduce(
        (total, newValue) => total.concat(newValue),
        []
    );
    if (filterTag) {
        runningInstances = runningInstances
            .filter(i => i.Tags.some(t => t.Key === filterTag));
    }
    if (runningInstances.length > 0) {
        let response = `Found ${runningInstances.length} running EC2 instances\n`;
        let result = await
            ec2.stopInstances(
                {
                    InstanceIds:
                        runningInstances.map(inst => inst.InstanceId)
                }
            ).promise();
        return response + result.StoppingInstances
            .map(si => `EC2 Inst: ${si.InstanceId} now ${si.CurrentState.Name}`)
            .join('\n');

    } else {
        return "No running EC2 instances";
    }
};
