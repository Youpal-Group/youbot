module.exports = {
	name: 'express',
	script: (bot) => {
        if (process.env.EXPRESS === 'true') {
            bot.logger.info('Express', 'Initializing...');

            const server = require('./server')(bot);

            server.start();
        }
        else {
            bot.logger.info('Express', 'Disabled');
        }

		return {};
	}
};
