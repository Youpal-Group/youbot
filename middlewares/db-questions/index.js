module.exports = {
	name: 'db-questions',
	outgoing: false,
	script: async (event, bot, params) => {
        return bot.hear(/\[(.*)\]\s?=\s?\[(.*)\]/, async (regParts) => {
			try {
                if (regParts[1] && regParts[2]) {
                    const res = await bot.module('rocketchat-api').api({
                        method: 'get',
                        api: 'users.info',
                        params: 'userId=' + event.user._id,
                        data: undefined
                    });
        
                    if (res && res.user && res.user.roles && res.user.roles.some((role) => process.env.QNA_MANAGER_ROLE.split(',').includes(role))) {

                        const addRes = await bot.bot('BotPress').addQuestion({
                            action: "text",
                            contexts: [
                                "global"
                            ],
                            enabled: true,
                            questions: {
                                en: regParts[1].split('|')
                            },
                            answers: {
                                en: regParts[2].split('|')
                            }
                        });

                        event.channel = event.user._id;

                        if (res.upsertedId) event.message = 'QnA added';
                        else event.message = 'QnA updated';

                        bot.adapter.sendDirectMessage('QnA added with ID ' + addRes[0], event);

                        /*
                        return bot.db.db.collection('questions')
                            .updateOne({ q: regParts[1].trim().toLowerCase() }, {
                                $set: {
                                    q: regParts[1].trim().toLowerCase(),
                                    a: regParts[2].trim()
                                }
                            }, {
                                upsert: true
                            })
                            .then((res) => {
                                event.channel = event.user._id;
                                if (res.upsertedId) event.message = 'QnA added';
                                else event.message = 'QnA updated';

                                bot.adapter.sendDirectMessage(event.message, event);
                                
                                return false;
                            })
                            .catch((err) => {
                                event.message = 'Something went wrong...';
                                bot.adapter.send(event);
                                bot.logger.error('DB Questions', err);

                                return false;
                            });
                        */
                    }
                    else {
                        event.message = 'Sorry, you must ask from Admin to add this question. :(';
                        bot.adapter.send(event);
                    }
                }

                return false;
			}
			catch(err) {
                event.message = 'Something went wrong...';
				bot.adapter.send(event);
				bot.logger.error('DB Questions', err);

				return false;
			}
		});
	}
};
