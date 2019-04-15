This npm/nodejs project is a work in progress.
The goal is to create an emergency backstop on my AWS account for the 
contigency of public facing assets being hit by some kind of DDoS attack, or just
somebody's test script which freaks out and sends a barrage of requests.
The problem for the small scale user of AWS is that you have effectively unlimited
liability for trafic costs in such a case.

Strangely Amazon goes to herculean efforts to keep your assets available, but not to protect you
from huge bills.

The exception seems to be APIGateway, which does allow you to limit rates.

The idea is to set up a budget alert so that if your projected monthly cost is getting silly
you get an SMS to your mobile and, since you might be AFK, this lambda fires and shuts down
all your public facing assets. Then the lambda sends its own SMS, to tell you if it successfully
shut things down. Then you can get online and try and figure out what's going on.

Associate the budget alert with an SNS queue, which in turn fires the lambda. You can also subscribe an SMS or e-mail address to the alert.

Subsystems I'm targetting initially

- S3 - S3 buckets with public access. Public access will be closed down.
- EC2 - Any EC2 instances that might have external IPs. Will be stopped.
- CloudFront - Any distributions are disabled.

Environmental Variables:

- MOBILE_NUMBER The international phone number of the mobile to alert
- TOPIC_ARN  The arn of the sns topic to which the budget system sends notices
- SUBSYSTEMS - A comma separated list of the above system names to be locked down
- EC2_DRAWBRIDGE_TAG=<key> - For EC2 instances, instances are only stopped if they carry a tag with the given key. If ommited stop all instances

