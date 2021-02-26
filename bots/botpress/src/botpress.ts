
import EventEmitter from 'events';
import axios from 'axios';
import { logger } from '../../../dist/utils';

class BotPress {
	public connected: boolean;
	public events: EventEmitter;
	public name: string;
	private token: string;
	public loginOnce: boolean;

	constructor() {
		this.connected = false;
		this.name = 'BotPress';
		this.token = '';
		this.loginOnce = false;

		this.events = new EventEmitter();

		this.events.on('send', (message: any) => {
			axios({
				url: `${process.env.BOTPRESS_URL}/api/v1/bots/${process.env.BOTPRESS_BOTID}/converse/${message.user.username}`,
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				data: {
					type: 'text',
					text: message.message
				}
			})
				.then((res) => {
					if (res && res.data && res.data.responses) {
						res.data.responses.forEach((response: any) => {
							if (response.type === 'text') {
								message.message = response.text;
								this.events.emit('received', message);
							}
						});
					}
				})
				.catch((err) => logger.error(this.name, err));
		});
	}

	login() {
		if (this.loginOnce) {
			this.loginOnce = false;
			return false;
		}

		return axios({
			url: `${process.env.BOTPRESS_URL}/api/v1/auth/login/basic/default`,
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			data: {
				email: process.env.BOTPRESS_USERNAME,
				password: process.env.BOTPRESS_PASSWORD
			}
		})
			.then((res) => {
				if (res && res.data) {
					this.token = res.data.payload.token;
					this.loginOnce = false;

					return true;
				}

				return false;
			})
			.catch((err) => logger.error(this.name, err));
	}

	questions(query?: string): any {
		query = query ? '?question=' + query : '';

		return axios({
			url: `${process.env.BOTPRESS_URL}/api/v1/bots/${process.env.BOTPRESS_BOTID}/mod/qna/questions${query}`,
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: 'Bearer ' + this.token
			}
		})
			.then((res) => {
				if (res && res.data) {
					return res.data.items;
				}

				return false;
			})
			.catch((err) => {
				if (err.response.status === 401) {
					if (this.login()) {
						return this.questions(query);
					}
				}

				logger.error(this.name, err);

				return false;
			});
	}

	send(event: any) {
		this.events.emit('send', event);
	}

	received(func: any) {
		this.events.on('received', func);
	}
}

export default BotPress;
