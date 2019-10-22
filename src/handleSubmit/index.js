const qs = require('qs');
const AWS = require('aws-sdk');

exports.handler = async message => {
  console.log(message);
  const formData = qs.parse(message.body);
  console.log(formData);

  return {
    statusCode: 302,
    headers: {'Location': 'https://stackery.io'}
  };
};
