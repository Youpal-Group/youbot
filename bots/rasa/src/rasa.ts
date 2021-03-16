
import EventEmitter from 'events';
import axios from 'axios';
import { logger } from '../../../dist/utils';

class Rasa {
	public connected: boolean;
	public events: EventEmitter;
	public name: string;
	private token: string;
	public loginOnce: boolean;

	constructor() {
		this.connected = false;
		this.name = 'Rasa';
		this.token = '';
		this.loginOnce = false;

		this.events = new EventEmitter();

		this.events.on('send', (message: any) => {
			axios({
				url: `${process.env.RASA_REST_URL}/webhooks/rest/webhook`,
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				data: {
					sender: message.user.username,
					message: message.message
				}
			})
				.then(async (res) => {
					if (res && res.data) {
						message.message = {
							attachments: []
						};

						while (res.data.length) {
							const response = res.data.shift();

							if (response.text) {
								message.message.attachments.push({
									color: 'none',
									text: response.text
								});
							}
							else if (response.image) {
								message.message.attachments.push({
									title_link_download: true,
									image_url: response.image
								});
							}
						}

						await this.events.emit('received', message);
					}
				})
				.catch((err) => logger.error(this.name, err));
		});

		this.login();
	}

	login() {
		if (this.loginOnce) {
			this.loginOnce = false;
			return false;
		}

		return axios({
			url: `${process.env.RASA_URL}/api/auth`,
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			data: {
				username: process.env.RASA_USERNAME,
				password: process.env.RASA_PASSWORD
			}
		})
			.then((res) => {
				if (res && res.data) {
					this.token = res.data.access_token;
					this.loginOnce = false;

					return true;
				}

				return false;
			})
			.catch((err) => logger.error(this.name, err));
	}

	send(event: any) {
		this.events.emit('send', event);
	}

	async received(func: any) {
		await this.events.on('received', func);
	}
}

export default Rasa;
