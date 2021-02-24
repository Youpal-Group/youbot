
import EventEmitter from 'events';
import axios from 'axios';
import { logger } from '../../../dist/utils';

class BotPress {
	public connected: boolean;
	public events: EventEmitter;
	public name: string;

	constructor() {
		this.connected = false;
		this.name = 'BotPress';

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

	send(event: any) {
		this.events.emit('send', event);
	}

	received(func: any) {
		this.events.on('received', func);
	}
}

export default BotPress;
