import nodemailer from "nodemailer";

// Create a transport object with SMTP server details
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  login: process.env.MAIL_LOGIN,
  password: process.env.MAIL_PASSWORD
  
});

function sendMail(message) {
  return transporter.sendMail(message);
}

export default {sendMail};
