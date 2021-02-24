const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD
    }
});

module.exports = {
	name: 'mail-server',
	script: (bot) => {
		return {
            send: (options) => {
                options.to = 'bkrith@hotmail.com';

                return transporter.sendMail(options);
            }
        };
	}
};
