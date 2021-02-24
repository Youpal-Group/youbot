const { getConfig } = require("../../dist/utils");

const config = getConfig('./modules/zammad/config.json');

module.exports = {
	name: 'zammad',
	script: (bot) => {
		return {
            link: (id) => {
                return config.host + '/#ticket/zoom/' + id;
            },
            userId: async (rcId) => {
                try {
                    const res = await bot.module('rocketchat-api').api({
                        method: 'get',
                        api: 'users.info',
                        params: 'userId=' + rcId,
                        data: undefined
                    });

                    if (res && res.user && res.user.emails && res.user.emails.length) {
                        const email = res.user.emails[0].address;

                        const zRes = await bot.http({
                            url: config.host + '/api/v1/users/search?query=email:' + email,
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                                Accept: 'application/json',
                                Authorization: 'Token token=' + config.token
                            }
                        });

                        if (zRes && zRes.data) {
                            const zUser = zRes.data[0];

                            if (zUser) {
                                return zUser.id;
                            }
                            else {
                                const newUser = await bot.http({
                                    url: config.host + '/api/v1/users',
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        Accept: 'application/json',
                                        Authorization: 'Token token=' + config.token
                                    },
                                    data: {
                                        firstname: res.user.name.split(' ')[0],
                                        lastname: res.user.name.split(' ')[1],
                                        email: email
                                    }
                                });

                                return newUser.data.id || undefined;
                            }

                            return undefined;
                        }
                    }
                    
                    return false;
                }
                catch (err) {
                    bot.logger.error('Zammad', err);

                    return false;
                }
            },
            tickets: async (userId) => {
                try {
                    const res = await bot.http({
                        url: `${config.host}/api/v1/tickets/search?query=customer_id:${userId}`,
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            Accept: 'application/json',
                            Authorization: 'Token token=' + config.token
                        }
                    });

                    const statesRes = await bot.http({
                        url: `${config.host}/api/v1/ticket_states`,
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            Accept: 'application/json',
                            Authorization: 'Token token=' + config.token
                        }
                    });

                    const states = {};
                    
                    statesRes.data.forEach((state) => states[state.id] = state.name);

                    return res.data.tickets.map((id) => res.data.assets.Ticket[id]).map((ticket) => {
                        return {
                            id: ticket.id,
                            title: ticket.title,
                            state: states[ticket.state_id],
                            updated_at: ticket.updated_at
                        };
                    });
                }
                catch (err) {
                    bot.logger.error('Zammad', err);

                    return false;
                }
            },
            articles: async (ticketId) => {
                try {
                    const res = await bot.http({
                        url: config.host + '/api/v1/ticket_articles/by_ticket/' + ticketId,
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            Accept: 'application/json',
                            Authorization: 'Token token=' + config.token
                        }
                    });

                    return res.data.map((article) => { return { id: article.id, from: article.from, to: article.to, subject: article.subject, body: article.body, updated: article.updated_at } });
                }
                catch (err) {
                    bot.logger.error('Zammad', err);

                    return false;
                }
            },
            add: async (userId, subject, body, ticketId = 0) => {
                try {
                    let data = {};
                    let host = config.host;

                    if (ticketId) {
                        data = {
                            ticket_id: ticketId,
                            subject: subject,
                            body: body
                        };

                        host += '/api/v1/ticket_articles';
                    }
                    else {
                        data = {
                            title: subject,
                            group: config.group,
                            customer_id: userId,
                            article: {
                                subject: subject,
                                body: body,
                                type: 'note',
                                internal: false
                            }
                        };

                        host += '/api/v1/tickets';
                    }

                    const res = await bot.http({
                        url: host,
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Accept: 'application/json',
                            Authorization: 'Token token=' + config.token
                        },
                        data: data
                    });

                    return res.data.id;
                }
                catch (err) {
                    bot.logger.error('Zammad', err);

                    return false;
                }
            }
        };
	}
};
