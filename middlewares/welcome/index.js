
module.exports = {
	name: 'welcome',
	outgoing: false,
	script: async (event, bot) => {
		if (event.joined) {
			event.message = ":wave: Hi, everyone! I'm Botpal and I'm here to help you!";

			bot.adapter.send(event);

			return false;
		}

		return true;
	}
};
