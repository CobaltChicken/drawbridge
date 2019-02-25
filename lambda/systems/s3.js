"use strict";
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const publicUri = 'http://acs.amazonaws.com/groups/global/AllUsers';
exports.lockOut = async () => {
    let lb = await s3.listBuckets([]).promise();
    let names = lb.Buckets.map(bucket => bucket.Name);
    let acls = await Promise.all(
        names.map(name => s3.getBucketAcl({ Bucket: name }).promise())
    );
    let totalBuckets = names.length;
    acls = acls.map(acl => (
          {
            name: names.shift(),
            acl: acl,
            grants: acl.Grants
        }
    )).filter(entry =>
        entry.acl.Grants.some(
            gr => gr.Grantee.URI === publicUri)
    );
    if (acls.length === 0) {
        return `${totalBuckets} buckets, none of them publically accesible`;
    } else {
        await Promise.all(acls.map(entry => s3.putBucketAcl({
            AccessControlPolicy: {
                Grants: entry.acl.Grants.filter(gr => gr.Grantee.URI !== publicUri),
                Owner: entry.acl.Owner
            },
            Bucket: entry.name
        }).promise()));
        return 'Blocked: ' + acls.map(entry => entry.name).join(', ');
    }

};