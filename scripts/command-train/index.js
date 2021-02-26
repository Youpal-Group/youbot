module.exports = {
	name: 'command-train',
	onDemand: true,
	script: async (event, bot, params) => {
		try {
			const res = await bot.module('rocketchat-api').api({
                method: 'get',
                api: 'users.info',
                params: 'userId=' + event.user._id,
                data: undefined
            });

            if (res && res.user && res.user.roles && res.user.roles.some((role) => process.env.QNA_MANAGER_ROLE.split(',').includes(role))) {
                const training = await bot.bot('BotPress').train();

                if (training) {
                    event.channel = event.user._id;

                    bot.adapter.sendDirectMessage('BotPress started training process', event);

                    return false;
                }

                bot.adapter.sendDirectMessage('BotPress can\'t start training', event);
            }

			return false;
		}
		catch (err) {
			bot.logger.error('Command-train', err);

			return false;
		}
	}
};
