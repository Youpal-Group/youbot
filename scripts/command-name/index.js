
module.exports = {
	name: 'command-name',
	onDemand: true,
	script: async (event, bot, params) => {
		try {
			params = params.startsWith('@') ? params.substring(1) : params;

			const res = await bot.script('rocketchat-api').script(event, bot, {
				method: 'get',
				api: 'users.info',
				params: 'username=' + params,
				data: undefined
			});

			let response = '';

			if (!res) {
				response = params + ' not exists!';
			}
			else if (res.user && res.user.name) {
				response = params + "'s name is " + res.user.name;
			}
			else {
				response = 'Has no name!';
			}

			event.message = response;

			bot.adapter.send(event);

			return false;
		}
		catch (err) {
			bot.logger.error('Command-name', err);

			return true;
		}
	}
};
