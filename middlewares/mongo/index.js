
module.exports = {
	name: 'mongo',
	outgoing: false,
	script: async (event, bot) => {
		if (!event.message.startsWith('#')) {
			bot.db.save(event)
				.then((id) => {
					if (id) event.savedId = id;
				})
				.catch((err) => bot.logger.error('MongoDB Script', err));
		}

		return true;
	}
};
