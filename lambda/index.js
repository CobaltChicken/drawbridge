"use strict";
/**
 * This lammbda is designed to shut down all my external facing services
 * should costs be getting out of hand, presumably because of a DDoS type
 * attack or some kind of other bezerk usage. Next best thing to a proper 
 * AWS cost ceiling.
 */

const ConfirmSubject = 'Drawbridge is up!';
const subSystems = process.env.SUBSYSTEMS.split(',').map(str => str.trim());
const topic = process.env.TOPIC_ARN;
const AWS = require('aws-sdk');
AWS.config.update({
    httpOptions: {
        timeout: 500, connectionTimeout: 10000
    },
    region: 'eu-west-1'
});

/**
 * Map the names from SUBSYSTEMS into the JS module path
 */
const modules = {
    cloudfront: './systems/cloudfront.js',
    s3: './systems/s3.js'
};
/**
 * Sends an SMS message to the phone number in MOBILE_NUMBER
 * @param  msg The payload for the message
 */
exports.handler = async (event) => {
    const sns = new AWS.SNS();
    function sendSms(msg, phone) {
        let params = {
            PhoneNumber: phone,
            Message: msg,
            Subject: ConfirmSubject,
        };
        return sns.publish(params).promise()
    }
        let panic = event.Records.some(record => record.EventSource === 'aws:sns');
    try {
        if (panic) { // If any message is not our confirm then raise the drawbridge. The Hordes are upon us.
            console.log('Zombie hoards in sight - Raise the drawbridge');
            let narrative = "Lock out results";
            for (let ss of subSystems) {
                let module = modules[ss.toLowerCase()];
                if (module) {
                    try {
                        narrative += '\n' + ss + ': ' + await require(module).lockOut();
                    } catch (err) {
                        narrative += '\n' + ss + `: FAIL ${err.message}`;
                        console.error('Error in ' + ss + JSON.stringify(err));
                        console.error(err.message, err.stack);
                    }
                } else {
                    console.error(`Don't know ${ss} subsystem`);
                }
            }
            if(process.env.MOBILE_NUMBER) {
                await Promise.all(process.env.MOBILE_NUMBER.split(',').map(phone => sendSms(narrative, phone)));
            }
            return 'Drawbridge raised';
        }
        return 'No panic';
    } catch (err) {
        console.error(err.message, err.stack);
        return "ERROR: " + err.message;
    }
};


