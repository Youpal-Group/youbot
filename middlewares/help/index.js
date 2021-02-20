
module.exports = {
	name: 'help',
	outgoing: false,
	script: async (event, bot, params) => {
        return bot.hear(/^help(?: (.*))?$/, async (regParts) => {
			try {
				let questions = [];
				if (regParts[1]) {
					questions = bot.questions.filter((q) => {
						if (q.toLowerCase().includes(regParts[1].toLowerCase())) return true;

						const split = regParts[1].split(' ');

						if (split.length) {
							return split.some((spl) => q.toLowerCase().includes(spl.toLowerCase().trim()));
						}

						return false;
					});
				}
				else {
					questions = bot.questions;
				}

				const msgs = [];
				let msg = '';
				questions.forEach(async (question) => {
					if ((msg.length + question.length) < 3000) {
						msg += question + '\n';
					}
					else {
						msgs.push(msg);
						msg = '';
					}
				});

				if (msg.length) msgs.push(msg);

				if (questions.length > 10) {
					if (!event.dm) {
						event.message = `Please, check your DM's`;
						await bot.adapter.send(event);
					}

					event.channel = event.user._id;

					sendInterval = setInterval(async () => {
						if (msgs.length) await bot.adapter.sendDirectMessage(msgs.shift(), event);
						else {
							await bot.adapter.sendDirectMessage('You can use help with keyword: `help <keyword>`', event);

							clearInterval(sendInterval);
						}
					}, 200);
				}
				else {
					event.message = msgs.shift();
					await bot.adapter.send(event);
				}

                return false;
			}
			catch(err) {
                event.message = 'Something went wrong...';
				await bot.adapter.send(event);
				bot.logger.error('Help', err);

				return true;
			}
		});
	}
};
