
/*

# Questions:
# Ticket <id>
#
# Command:
# .ticket <id>
#
# Description:
# Returns articles for the given ticket id
#
# Params:
#
# id:
# any ticket id from Zammad user account
#
# Examples:
# .ticket 14

*/

module.exports = {
	name: 'command-ticket',
	onDemand: true,
	script: async (event, bot, params) => {
		try {
            if (!event.dm) {
                event.message = `@${event.user.username} Please check your DM's`;

                await bot.adapter.send(event);
            }

            event.channel = event.user._id;

			const articles = await bot.module('zammad').articles(params);

			if (articles) {
                const fields = [];

                articles.forEach((article) => {
                    fields.push({
                        color: '#73a7ce',
                        text: `*${article.from}* ${(new Date(article.updated)).toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' })}\n*${article.subject || '(no subject)'} *\n${article.body.replace( /(<([^>]+)>)/ig, '\n')}`
                    });
                });

                await bot.adapter.sendDirectMessage({
                    msg: 'Ticket: ' + params,
                    attachments: fields
                }, event);
            }
            else {
                await bot.adapter.sendDirectMessage('Ticket id is wrong!', event);
            }

			return false;
		}
		catch (err) {
			bot.logger.error('Command-ticket', err);

			return false;
		}
	}
};
