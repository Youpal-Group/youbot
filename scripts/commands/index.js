
// important get mention with regex : (?:^|)@(.*?)(?:\s|$)

module.exports = {
	name: 'commands',
	outgoing: true,
	script: async (event, bot) => {
		if (event.livechat) return false;

		return bot.hear(/^\.(.*?)(?: (.*))?$/, async (regParts) => {
			try {
				if (regParts[1]) {
					await bot.script('command-' + regParts[1]).script(event, bot, regParts[2]);
					bot.logger.info('Commands', `Outgoing - Executed command-${regParts[1]}`);
				}

				return false;
			}
			catch(err) {
                event.message = 'Something went wrong...';
				await bot.adapter.send(event);
				bot.logger.error('Commands', err);

				return true;
			}
		});
	}
};
