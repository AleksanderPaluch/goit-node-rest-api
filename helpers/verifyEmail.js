import nodemailer from "nodemailer";

// Create a transport object with SMTP server details
const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: process.env.MAILTRAP_USERNAME,
    pass: process.env.MAILTRAP_PASSWORD,
  },
});

function sendMail(message) {
  return transporter.sendMail(message);
}

export default {sendMail};
