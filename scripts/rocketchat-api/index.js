/* eslint-disable @typescript-eslint/no-var-requires */

const getConfig = require('../../dist/utils').getConfig;

const config = getConfig('./adapters/rocketchat/config.json');

let connection = {
	baseUrl: config.url + '/api/v1/',
	headers: {
		'Content-Type': 'application/json',
		Accept: 'application/json'
	}
};

const initRocketChat = (bot) => {
	return new Promise((resolve) => {
		if (!connection.userId) {
			bot.http({
				url: connection.baseUrl + 'login',
				method: 'post',
				data: {
					user: config.user,
					password: config.password
				}
			})
				.then((response) => {
					if (response.status === 401) {
						bot.logger.warn('RocketChat API Script', "I can't log in RocketChat!");
						return resolve(false);
					}

					body = response.data;

					connection = {
						userId: body.data.userId,
						username: body.data.me.username,
						baseUrl: connection.baseUrl
					};

					connection.headers = {
						'X-User-Id': body.data.userId,
						'X-Auth-Token': body.data.authToken,
						'Content-Type': 'application/json',
						Accept: 'application/json'
					};

					bot.logger.info('RocketChat API Script', 'Connection initialized');

					return resolve(true);
				})
				.catch((err) => {
					bot.logger.error('RocketChat API Script', err);
					return resolve(false);
				});
		}
		else return resolve(true);
	});
};

const executeCall = (bot, args, ranOnce = false) => {
	args.params = args.params ? '?' + args.params : undefined;

	return bot.http({
		url: connection.baseUrl + args.api + args.params,
		method: args.method,
		data: args.data,
		headers: connection.headers
	})
		.then((response) => {
			return response.data;
		})
		.catch(async (err) => {
			if (ranOnce) {
				bot.logger.warn('RocketChat API Script', "I can't log in RocketChat!");
				return false;
			}
			else if (err.response.status === 401) {
				connection.userId = undefined;

				if (!await initRocketChat(bot)) {
					bot.logger.warn('RocketChat API Script', "I can't log in RocketChat!");
					return false;
				}

				return executeCall(bot, args, true);
			}

			if (err.response && err.response.data && !err.response.data.success && err.response.data.error) {
				bot.logger.error('RocketChat API Script', err.response.data.error);
			}
			else {
				bot.logger.error('RocketChat API Script', err);
			}

			return false;
		});
}

module.exports = {
	name: 'rocketchat-api',
	onDemand: true,
	script: async (event, bot, args) => {
		console.log(event, bot, args);
		await initRocketChat(bot);

		return await executeCall(bot, args);
	}
};
