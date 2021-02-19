const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport(require('../../dist/utils').getConfig('./modules/mail-server/config.json'));

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
