
module.exports = {
	name: 'mongo',
	outgoing: true,
	script: async (event, bot) => {
		if (event.savedId) {
			bot.db.update(event)
				.catch((err) => bot.logger.error('MongoDB Script', err));
		}

		return true;
	}
};
