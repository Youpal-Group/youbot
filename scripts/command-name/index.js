
/*

# Questions:
# What is <username> name?
# Give me <username> name
# <username> name
#
# Command:
# .name <username>
#
# Description:
# Returns the full name for the given username
#
# Params:
#
# username:
# any username from RocketChat
#
# Examples:
# .name Vassilis
# .name @Vassilis - (with mention)

*/

module.exports = {
	name: 'command-name',
	onDemand: true,
	script: async (event, bot, params) => {
		try {
			params = params.startsWith('@') ? params.substring(1) : params;

			if (process.env.SUITE === 'true') {
				const contact = await bot.module('suite').contact(process.env.SUITE_QUERY_FIELD, params);
				let response = '';

				if (contact) {
					const fn = contact.fn;

					if (fn) {
						response = params + "'s name is " + fn;
					}
					else {
						response = 'Has no name!';
					}
				}
				else {
					response = params + ' not exists!';
				}
				
				event.message = response;

				bot.adapter.send(event);
			}
			else {
				const res = await bot.module('rocketchat-api').api({
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
			}

			return false;
		}
		catch (err) {
			bot.logger.error('Command-name', err);

			return false;
		}
	}
};
