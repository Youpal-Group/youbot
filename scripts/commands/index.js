
// important get mention with regex : (?:^|)@(.*?)(?:\s|$)

module.exports = {
	name: 'commands',
	outgoing: true,
	script: async (event, bot) => {
		return bot.hear('^//(.*?) (.*)', async (regParts) => {
			if (regParts[1] && regParts[2]) {
				await bot.script('command-' + regParts[1]).script(event, bot, regParts[2]);
				bot.logger.info('Commands', `Outgoing - Executed command-${regParts[1]}`);
			}

			return false;
		});
	}
};
