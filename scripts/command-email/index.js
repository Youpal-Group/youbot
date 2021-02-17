
module.exports = {
	name: 'command-email',
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

			let response = 'I found ';

			if (res.user && res.user.emails && res.user.emails.length) {
				res.user.emails.forEach((email, inx) => {
					if (inx) response += ', ';
					response += email.address;
				});
			}
			else {
				response += 'no emails!';
			}

			event.message = response;

			bot.adapter.send(event);

			return false;
		}
		catch (err) {
			bot.logger.error('Command-email', err);

			return true;
		}
	}
};
