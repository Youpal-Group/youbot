
module.exports = {
	name: 'questions',
	outgoing: false,
	script: async (event, bot) => {
		try {
			return bot.db.db.collection('questions')
				.findOne({ q: { $eq: event.message.trim().toLowerCase() } })
				.then((res) => {
					if (res) {
						event.message = res.a;
						bot.adapter.send(event);

						return false;
					}
					else {
						return true;
					}
				})
				.catch((err) => {
					event.message = 'Something went wrong...';
					bot.adapter.send(event);
					bot.logger.error('Questions', err);

					return false;
				});
		}
		catch (err) {
			event.message = 'Something went wrong...';
			bot.adapter.send(event);
			bot.logger.error('Questions', err);

			return false;
		}
	}
};
