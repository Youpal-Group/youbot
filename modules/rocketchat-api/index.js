/* eslint-disable @typescript-eslint/no-var-requires */

let connection = {
	baseUrl: process.env.ROCKETCHAT_URL + '/api/v1/',
	headers: {
		'Content-Type': 'application/json',
		Accept: 'application/json'
	}
};

const initRocketChat = (bot) => {
	return new Promise(async (resolve) => {
		if (!connection.userId) {
			bot.http({
				url: connection.baseUrl + 'login',
				method: 'post',
				data: {
					user: process.env.ROCKETCHAT_USER,
					password: process.env.ROCKETCHAT_PASSWORD
				}
			})
				.then((response) => {
					if (response.status === 401) {
						bot.logger.warn('RocketChat API', "I can't log in RocketChat!");
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

					bot.logger.info('RocketChat API', 'Connection initialized');

					return resolve(true);
				})
				.catch((err) => {
					bot.logger.error('RocketChat API', err);
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
				bot.logger.warn('RocketChat API', "I can't log in RocketChat!");
				return false;
			}
			else if (err.response.status === 401) {
				connection.userId = undefined;

				if (!await initRocketChat(bot)) {
					bot.logger.warn('RocketChat API', "I can't log in RocketChat!");
					return false;
				}

				return executeCall(bot, args, true);
			}

			if (err.response && err.response.data && !err.response.data.success && err.response.data.error) {
				bot.logger.error('RocketChat API', err.response.data.error);
			}
			else {
				bot.logger.error('RocketChat API', err);
			}

			return false;
		});
}

module.exports = {
	name: 'rocketchat-api',
	script: (bot) => {
		initRocketChat(bot);

		return {
			api: async (args) => {
				return await executeCall(bot, args);
			}
		};
	}
};
