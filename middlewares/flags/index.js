
module.exports = {
	name: 'flags',
	outgoing: false,
	script: async (event, bot, params) => {
        const user = bot.module('users').get(event.user._id);

        if (user && user.flag && event.dm) {
            bot.script('command-' + user.flag).script(event, bot, params);

            return false;
        }

		return true;
	}
};
