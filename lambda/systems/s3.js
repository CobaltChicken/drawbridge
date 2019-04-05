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
    let wsFlags = await Promise.all(names.map(async name => {
        try {
            let web = await s3.getBucketWebsite({ Bucket: name }).promise();
            return true;
        } catch (err) {
            console.log(JSON.stringify(err));
            if (err.code === 'NoSuchWebsiteConfiguration') {
                return false;
            } else {
                console.error(err);
                throw err;
            }

        }
    }));
    let bucketData = acls.map(acl => (
        {
            name: names.shift(),
            webSite: wsFlags.shift(),
            acl: acl,
            grants: acl.Grants
        }
    ));
    acls = bucketData.filter(entry =>
        entry.acl.Grants.some(
            gr => gr.Grantee.URI === publicUri)
    );
    let resultString = '';
    if (acls.length === 0) {
        resultString = `${totalBuckets} buckets, none of them publically accesible`;
    } else {
        await Promise.all(acls.map(entry => s3.putBucketAcl({
            AccessControlPolicy: {
                Grants: entry.acl.Grants.filter(gr => gr.Grantee.URI !== publicUri),
                Owner: entry.acl.Owner
            },
            Bucket: entry.name
        }).promise()));
        resultString += 'Blocked: ' + acls.map(entry => entry.name).join(', ');
    }
    if (bucketData.some(entry => entry.webSite)) {
        console.log('Deleting web site data');
        resultString += '\nDeleting web site data from:' + bucketData
            .filter(bd => bd.website)
            .map(bd => bd.name)
            .join(', ');
        await Promise.all(bucketData.filter(bd => bd.webSite)
            .map(bd => s3.deleteBucketWebsite({ Bucket: bd.name })
                .promise()));
    }
    return resultString;

};