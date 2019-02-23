"use strict";
/**
 * This lammbda is designed to shut down all my external facing services
 * should costs be getting out of hand, presumably because of a DDoS type
 * attack or some kind of other bezerk usage. Next best thing to a proper 
 * AWS cost ceiling.
 */

 const ConfirmSubject = 'Drawbridge is up!';
 n
 exports.handler = async (event) => {
     let panic = false;
     for(let record of event.Records) {
         if(record.EventSource === 'aws.sns' && record.Sns.Subject !== ConfirmSubject)  {
             panic = true;
         }
     }
     if(panic) { // If any message is not our confirm then raise the drawbridge. The Hordes are upon us.


        return 'Drawbridge raised';
     }
     return 'No panic';
 };


