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
const sns = require('aws-sdk/clients/sns');
/**
 * Map the names from SUBSYSTEMS into the JS module path
 */
const modules = {
    cloudfront : './systems/cloudfront.js'
};
/**
 * Sends an SMS message to the phone number in MOBILE_NUMBER
 * @param  msg The payload for the message
 */
function sendSms(msg) {
    return new Promise((resolve, reject) => {
        let params = {
            PhoneNumber: process.env.MOBILE_NUMBER,
            Message: msg,
            Subject: 'Drawbrige Raise Results',
        };
        sns.publish(params, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}
exports.handler = async (event) => {
    let panic = false;
    for (let record of event.Records) {
        if (record.EventSource === 'aws.sns' && record.Sns.Subject !== ConfirmSubject) {
            panic = true;
        }
    }
    if (panic) { // If any message is not our confirm then raise the drawbridge. The Hordes are upon us.
        console.log('Zombie hords sited - Raise the drawbridge');
        let narrative = "Lock out results";
        for (let ss of subSystems) {
            let module = modules[ss.toLowerCase];
            if (module) {
                try {
                    narrative += '\n' + ss + await require(module).lockOut();
                } catch (err) {
                    narrative += '\n' + ss + `FAIL ${err.message}`;
                    console.error('Error in ' + ss + JSON.stringify(err));
                    console.error(err.message, err.stackTrace);
                }
            } else {
                console.error(`Don't know $(ss} subsystem`);
            }
        }
        await sendSms(narrative);
        return 'Drawbridge raised';
    }
    return 'No panic';
};


