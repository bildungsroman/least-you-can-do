const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');
const mime = require('mime-types');
const recursiveReaddir = require('recursive-readdir');
const cfnCR = require('cfn-custom-resource');
const s3 = new AWS.S3();

exports.handler = async event => {
  // Log http request
  console.log(event);
  try {
    await Promise.all([
      uploadStaticContent()
    ]);

    // Send success signal back to CloudFormation
    await cfnCR.sendSuccess('uploadForm', {}, event);

    console.log('Succeeded in uploading site content!')
  } catch (err) {
    console.error('Failed to upload site content:');
    console.error(err);

    // Send error event back to CloudFormation
    await cfnCR.sendFailure(err.message, event);

    // Re-throw error to ensure invocation is marked as a failure
    throw err;
  }

  // Build an HTTP response.
  const response = {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html'
    },
    body: 'Content uploaded!'
  };

  return response;
};

// Upload site content from 'static' directory
async function uploadStaticContent() {
  // List files in 'static' directory
  const files = await recursiveReaddir('static');

  // Upload files asynchronously to FormContent object store
  const promises = files.map(file => s3.putObject({
    Bucket: process.env.BUCKET_NAME,
    Key: path.relative('static', file),
    Body: fs.createReadStream(file),
    ContentType: mime.lookup(file) || 'application/octet-stream',
    ACL: 'public-read'
  }).promise());

  await Promise.all(promises);
}