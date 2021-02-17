
module.exports = {
	name: 'command-ui',
	onDemand: true,
	script: async (event, bot) => {
		return bot.hear(/\[(.*?)\]/g, async (regParts) => {
			try {
                regParts = regParts.map(r => r.replace( /(^.*\[|\].*$)/g, '' ));

                const attachs = {
                    color: '#73a7ce',
                    button_alignment: 'horizontal',
                    actions: [],
                    fields: []
                };

                const attachments = [];

                regParts.forEach((part) => {
                    part = part.split('|');

                    if (part[0] && part[1]) {
                        switch (part[0]) {
                            case 'button':
                                attachs.actions.push({
                                    "type": "button",
                                    "text": part[1],
                                    "msg_in_chat_window": true,
                                    "msg": event.mention ? `@${event.username} ${part[2]}` : part[2]
                                });
                                break;
                            case 'link':
                                attachs.fields.push({
                                    "short": true,
                                    "value": `[${part[1]}](${part[2]})`
                                });
                                break;
                            case 'title':
                                if (part[2]) {
                                    attachments.push({
                                        "color": "red",
                                        "title": part[1],
                                        "title_link": part[2]
                                    });
                                }
                                else {
                                    attachments.push({
                                        "color": "red",
                                        "text": part[1]
                                    });
                                }
                                break;
                            default:
                                break;
                        }
                    }
                });

                attachments.push(attachs);

                bot.adapter.sendMessage({
                    msg: '',
                    attachments: attachments
                }, event);

				return false;
			}
			catch(err) {
				bot.logger.error('Command-ui', err);

				return true;
			}
		});
	}
};