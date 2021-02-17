
import { driver } from '@rocket.chat/sdk';
import EventEmitter from 'events';
import outgoing from './outgoing';
import { Config } from './config';
import { getConfig, logger } from '../../../dist/utils';

class RocketChat {
	private config: Config;
	public connected: boolean;
	public events: EventEmitter;
	public username: string;
	public name: string;

	constructor() {
		this.config = getConfig('./adapters/rocketchat/config.json');
		this.connected = false;
		this.username = this.config.user;
		this.name = 'RocketChat';

		this.events = new EventEmitter();

		process.on('exit', () => {
			this.disconnect();
		});
	}

	async start() {
		await this.connect();
		await this.listen();
	}

	async connect() {
		function handleChannel(channelList: string): string[] {
			let channelArray: string[] = [];

			if (channelList !== undefined) {
				channelList = channelList.replace(/[^\w,._]/gi, '').toLowerCase();
				if (channelList.match(',')) {
					channelArray = channelList.split(',');
				} else if (channelList !== '') {
					channelArray = [channelList];
				} else {
					channelArray = [];
				}
			}

			return channelArray;
		}

		try {
			const useSSL = this.config.useSSL === true;
			await driver.connect({
				host: this.config.url,
				useSsl: useSSL
			});
			await driver.login({
				username: this.config.user,
				password: this.config.password
			});
			await driver.joinRooms(handleChannel(this.config.room));
			await driver.subscribeToMessages();
			this.connected = true;

			this.events.on('outgoing', async (event: any) => {
				event = this.formatMessage(event.message, 'text', event.channel);

				const messageType: string = event.type === 'default' ? 'text' : event.type;

				if (messageType === 'typing') {
					await outgoing[messageType](event, this);
				} else if (messageType === 'text' || messageType === 'file') {
					await outgoing['typing'](event, this, false);
					await outgoing[messageType](event, this);
				} else {
					logger.error('RocketChat', `Message type "${messageType}" not implemented yet`);
				}
			});
		} catch (err) {
			logger.error('RocketChat', err);
		}
	}

	async listen() {
		const options = {
			dm: true,
			livechat: true,
			edited: true
		};
		return driver.respondToMessages(async (err, message, meta) => {
			if (err) {
				logger.error('RocketChat', err);
			}
			else {
				let mention = false;
				let livechat = false;

				if (message.mentions) {
					message.mentions.some((m: any) => {
						if (m.username === this.username) {
							mention = true;
							return true;
						}
					});
				}

				if (message.token) {
					livechat = true;
				}

				this.events.emit('incoming', {
					_id: message._id,
					message: message.msg,
					username: this.username,
					user: message.u,
					channel: message.rid,
					adapter: this.name,
					dm: meta.roomType === 'd',
					livechat: livechat,
					joined: message.t && message.t === 'au' && message.msg === this.username,
					mention: mention
				});
			}
		}, options);
	}

	incoming(func: any) {
		this.events.on('incoming', func);
	}

	send(event: any) {
		this.events.emit('outgoing', event);
	}

	formatMessage(msg: string, msgType: string, channel: string) {
		return {
			type: msgType,
			payload: {
				text: msg
			},
			channel: channel
		};
	}

	setConfig(config: Config) {
		this.config = config;
	}

	sendMessage(msg: string | any, event: any) {
		return driver.sendToRoomId(msg, event.channel);
	}

	sendDirectMessage(msg: string | any, event: any) {
		return driver.sendDirectToUser(msg, event.user.username);
	}

	asyncCall(method: string, params: any[]) {
		return driver.asyncCall(method, params);
	}

	sendTyping(event: any, typing = true) {
		return driver.asyncCall('stream-notify-room', [event.channel + '/typing', this.username, typing]);
	}

	sendUpdateText(channelId: string, text: string) {
		return driver.sendToRoomId(text, channelId);
	}

	isConnected() {
		return this.connected;
	}

	async disconnect() {
		await driver.disconnect();
	}
}

export default RocketChat;
