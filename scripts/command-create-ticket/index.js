
/*

# Questions:
# I want to open a ticket
# Open a ticket
# Create a ticket
# Create ticket
# Open ticket
# I want to crete a ticket
#
# Command:
# .create-ticket
#
# Description:
# Create a new ticket in Zammad (HelpDesk)
#
# Examples:
# .create-ticket

*/

module.exports = {
	name: 'command-create-ticket',
	onDemand: true,
	script: async (event, bot, params) => {
		try {
            const users = bot.module('users');
            let user = users.get(event.user._id);

            if (!event.channel.endsWith(event.user._id)) {
                if (user && user.ticket) {
                    user = users.update({ flag: false, ticket: false, updated: Date.now() });

                    await bot.adapter.sendDirectMessage('Previous ticket dismissed.', event);
                }

                event.message = `@${event.user.username} Please check your DM's`;

                await bot.adapter.send(event);
            }

            if (user && user.flag && user.flag === 'create-ticket') {
                event.channel = event.user._id;

                switch (event.message.toLowerCase()) {
                    case 'show':
                        if (!user.ticket) {
                            await bot.adapter.sendDirectMessage(`Ticket is empty yet! Please, add a subject.`, event);
                        }
                        else {
                            await bot.adapter.sendDirectMessage('Ticket preview\nFrom: `' + user.ticket.from + '`\nSubject: `' + user.ticket.subject + '`\nMessage\n```' + user.ticket.text + '```', event);
                        }

                        break;
                    case 'dismiss':
                        user.ticket = false;
                        user.flag = false;

                        users.update({ ...user, updated: Date.now() });

                        await bot.adapter.sendDirectMessage('Ticket dismissed.', event);

                        break;
                    case 'send':
                        if (user.ticket.subject && user.ticket.text) {
                            await bot.adapter.sendDirectMessage('Sending...', event);

                            const sentInfo = await bot.module('mail-server').send(user.ticket);

                            if (sentInfo.accepted.length) {
                                user.ticket = false;
                                user.flag = false;
        
                                users.update({ ...user, updated: Date.now() });

                                bot.logger.debug('Command-create-ticket', 'Sent email ' + sentInfo.messageId);

                                await bot.adapter.sendDirectMessage('Ticket sent.', event);
                            }
                            else {
                                bot.logger.debug('Command-create-ticket', 'Error in mail send');

                                await bot.adapter.sendDirectMessage('We had an internal error.. please, try later.', event);
                            }
                        }
                        else {
                            await bot.adapter.sendDirectMessage('Subject and/or message is empty!', event);
                        }

                        break;
                    default:
                        switch (user.ticket.step) {
                            case 1:
                                user.ticket.subject = event.message;
                                user.ticket.step = 2;
    
                                await bot.adapter.sendDirectMessage('Please type your message.', event);
    
                                break;
                            case 2:
                                user.ticket.text += event.message + '\n';
    
                                break;
                            default:
                                break;
                        }

                        break;
                }
            }
            else {
                user = users.update({ ...event.user, flag: 'create-ticket', ticket: {
                    from: '',
                    subject: '',
                    text: '',
                    step: 1
                }, updated: Date.now() });

                const res = await bot.script('rocketchat-api').script(event, bot, {
                    method: 'get',
                    api: 'users.info',
                    params: 'userId=' + event.user._id,
                    data: undefined
                });

                event.channel = event.user._id;
                
                if (res.user && res.user.emails && res.user.emails.length) {
                    users.update({ flag: 'create-ticket', ticket: user.ticket, updated: Date.now() });

                    user.ticket.from = res.user.emails[0].address;

                    await bot.adapter.sendDirectMessage({
                        msg: 'Create ticket',
                        attachments: [{
                            color: 'red',
                            text: '`send`: Send ticket\n`dismiss`: Cancel ticket\n`show`: Display ticket content',
                        },
                        {
                            color: '#73a7ce',
                            button_alignment: 'horizontal',
                            actions: [{
                                type: "button",
                                text: "Send",
                                msg_in_chat_window: true,
                                msg: "send"
                            },
                            {
                                type: "button",
                                text: "Dismiss",
                                msg_in_chat_window: true,
                                msg: "dismiss"
                            },
                            {
                                type: "button",
                                text: "Show",
                                msg_in_chat_window: true,
                                msg: "show"
                            }]
                        }]
                    }, event);

                    await bot.adapter.sendDirectMessage('What is the subject?', event);
                }
                else {
                    users.update({ flag: false, ticket: false, updated: Date.now() });

                    await bot.adapter.sendDirectMessage('You have no email in your RocketChat profile', event);
                }
            }

			return false;
		}
		catch (err) {
			bot.logger.error('Command-email', err);

			return true;
		}
	}
};
