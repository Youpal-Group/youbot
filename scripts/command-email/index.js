
/*

# Questions:
# What is <username> email?
# Give me <username> email
# <username> email
#
# Command:
# .email <username>
#
# Description:
# Returns email for the given username
#
# Params:
#
# username:
# any username from RocketChat
#
# Examples:
# .email Vassilis
# .email @Vassilis - (with mention)

*/

module.exports = {
	name: 'command-email',
	onDemand: true,
	script: async (event, bot, params) => {
		try {
			params = params.startsWith('@') ? params.substring(1) : params;

			if (process.env.SUITE === 'true') {
				const contact = await bot.module('suite').contact(process.env.SUITE_QUERY_FIELD, params);
				let response = 'I found ';

				if (contact) {
					const emails = contact.email.map((email) => email.value);

					if (emails) {
						emails.forEach((email, inx) => {
							if (inx) response += ', ';
							response += email;
						});
					}
					else {
						response = ' no emails!';
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

				let response = 'I found ';

				if (!res) {
					response = params + ' not exists!';
				}
				else if (res.user && res.user.emails && res.user.emails.length) {
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
			}

			return false;
		}
		catch (err) {
			bot.logger.error('Command-email', err);

			return false;
		}
	}
};
