
module.exports = {
	name: 'mention',
	outgoing: false,
	script: async (event) => {
		if (!event.mention && !event.dm) return false;

		event.message = event.message
			.replace('@' + event.username, '')
			.trim()
			.replace(/ +(?= )/g, '');

		return true;
	}
};
