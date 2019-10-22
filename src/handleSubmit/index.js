const qs = require('qs');
const fs = require('fs');
const AWS = require('aws-sdk');

exports.handler = async message => {
  console.log(message);
  const formData = qs.parse(message.body);
  console.log(formData);

  const responseBody = fs.readFileSync('./submitted.html', 'utf8');

  return {
    statusCode: 302,
    headers: {'Location': responseBody}
  };
};
