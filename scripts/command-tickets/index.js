
/*

# Questions:
# Show tickets [<state>]
# Show me tickets [<state>]
# Tickets [<state>]
#
# Command:
# .tickets [<state>]
#
# Description:
# Returns all tickets for Zammad account - optional state
#
# Examples:
# .tickets
# .tickets new
# .tickets closed

*/

module.exports = {
	name: 'command-tickets',
	onDemand: true,
	script: async (event, bot, params) => {
		try {
            if (!event.dm) {
                event.message = `@${event.user.username} Please check your DM's`;

                await bot.adapter.send(event);
            }

			const zId = await bot.module('zammad').userId(event.user._id);

			if (zId) {
                const tickets = await bot.module('zammad').tickets(zId);

                const attachments = [{
                    color: 'red',
                    text: '`ticket <id>`: Display ticket details',
                }];

                tickets.filter((ticket) => params ? ticket.state.includes(params) : true).forEach((ticket) => {
                    attachments.push({
                        color: '#73a7ce',
                        button_alignment: 'horizontal',
                        fields: [{
                            "short": true,
                            "value": `${ticket.id}: [*${ticket.title}*](${bot.module('zammad').link(ticket.id)}) [${ticket.state} - ${(new Date(ticket.updated_at)).toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' })}]`
                        }],
                        actions: [
                            {
                                type: "button",
                                text: "Details",
                                msg_in_chat_window: true,
                                msg: ".ticket " + ticket.id
                            },
                            {
                                type: "button",
                                text: "Reply",
                                msg_in_chat_window: true,
                                msg: ".create-ticket " + ticket.id
                            }
                        ]
                    });
                });

                event.channel = event.user._id;

                await bot.adapter.sendDirectMessage({
                    msg: 'Tickets',
                    attachments: attachments
                }, event);
            }

			return false;
		}
		catch (err) {
			bot.logger.error('Command-tickets', err);

			return false;
		}
	}
};
