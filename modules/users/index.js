
module.exports = {
	name: 'users',
	script: (bot) => {
        bot.temp.users = {};

		return {
            all: () => {
                return bot.temp.users;
            },
            get: (id) => {
                return bot.temp.users[id];
            },
            update: (user) => {
                bot.temp.users[user._id] = {...bot.temp.users[user._id], ...user};

                return bot.temp.users[user._id];
            }
        };
	}
};
