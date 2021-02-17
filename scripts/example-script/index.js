
// important get mention with regex : (?:^|)@(.*?)(?:\s|$)

module.exports = {
	name: 'example-script',
	outgoing: false,
	onDemand: false,
	script: async (event, bot, args) => {

		/*
		event object (message)

		{
			_id
			message
			username
			user: the sender
			channel
			adapter
			dm: true if is DM/PM, false if is public
			joined: if bot just joined returns true (welcome functionality)
			mention: true/false
		}

		bot object
		
		{
			http: axios object for requests,
			db: mongo db with save and update functions,
			logger: to add in logs,
			adapter: the origin adapter,
			getAdapter: use another adapter/channel,
			script: get any script with name criteria,
			hear: async function with regExp returns callback with match splitted array
		}

		args: anything you want to pass in function
		*/

		return bot.hear('^//(.*?) (.*)', async (regParts) => {
			if (regParts[1] && regParts[2]) {
				await bot.script('command-' + regParts[1]).script(event, bot, regParts[2]);
				bot.logger.info('Commands', `Outgoing - Executed command-${regParts[1]}`);
			}

			return false;
		});
	}
};
