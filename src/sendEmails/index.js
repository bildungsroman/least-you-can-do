const AWS = require('aws-sdk');
const qs = require('qs');

exports.handler = async message => {
  console.log(message);
  const formData = qs.parse(message.body);
  console.log(formData);

  const name = formData.sender;
  const company = formData.company;
  const senderEmail = formData.senderEmail;
  const receiverEmails = formData.receiverEmails; // email string - needs to be converted to array
  const parsedReceiverEmails = receiverEmails.replace(/\s+/g, '').split(',');

  console.log('parsedReceiverEmails: ', parsedReceiverEmails);

  for (const email of parsedReceiverEmails) {
    try {
      // Create the email
      body = await generateEmailBody(name, company);
      header = `Courtesy email from ${company}`;
      // Send the email
      console.log(`Sending email to ${email}.`);
      await sendEmail(email, header, body);
      console.log(`Email sent`);
    } catch (error) {
      console.log(`Error sending email`);
      console.log(error);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          message: error.message
        })
      };
    }
  };

  // Send confirmation email if entered
  if (senderEmail) {
    await sendConfirmation(senderEmail, name, receiverEmails);
    console.log(`Confirmation sent to ${senderEmail}`);
  }

  return {
    statusCode: 302,
    headers: {'Location': 'http://least-you-can-do-development-formconte-322639699510.s3-website-us-west-2.amazonaws.com/submitted.html'}
  };

};

// Make a pretty email body
function generateEmailBody (name, company) {
  console.log('Generating email');
  const emailBody = `
    <div>
      <p>I'm writing to inform you that the position you applied for at ${company} has been filled.</p>
      <p>We appreciate you taking the time to apply, and wish you the best of luck in your job search.</p>
      <p>Kind regards,</p>
      <p>${name}</p>
    </div>
  `;

  const style = `
    <style>
      body {
        font-family: sans-serif;
      }
    </style>
    `;

  return `
    <html>
      <head>${style}</head>
      <body>
        <div>
          ${emailBody}
        </div>
      </body>
    </html>
  `;
};

// Use AWS SES to send the email
async function sendEmail (email, subject, body) {
  let params = {
    Destination: {
      ToAddresses: [
        email
      ]
    },
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: body
        }
      },
      Subject: {
        Charset: 'UTF-8',
        Data: subject
      }
    },
    Source: process.env.SENDER_EMAIL
  };

  const ses = new AWS.SES();
  await ses.sendEmail(params).promise();
}

// Send confirmation email if requested
async function sendConfirmation (senderEmail, name, receiverEmails) {
  const confirmationBody = `
<div>
  <p>Hello ${name},</p>
  <p>Emails kindly informing that the position at your company has been filled have been sent to the following addresses:</p>
  <p>${receiverEmails}</p>
  <p>Thanks for doing the decent thing!</p>
</div>
  `
  let params = {
    Destination: {
      ToAddresses: [
        senderEmail
      ]
    },
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: confirmationBody
        }
      },
      Subject: {
        Charset: 'UTF-8',
        Data: `Confirmation: emails sent`
      }
    },
    Source: process.env.SENDER_EMAIL
  };

  const ses = new AWS.SES();
  await ses.sendEmail(params).promise();
}