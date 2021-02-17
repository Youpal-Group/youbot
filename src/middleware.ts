import Database from './database';
import axios from 'axios';
import { logger } from './utils';

class Middleware {
	public bots: any[];
	public adapters: any[];
	public messages: any[];
	public scripts: any[];
	public db: Database;

	constructor(db: Database, bots: any [], adapters: any[], scripts: any[]) {
		this.bots = bots;
		this.adapters = adapters;
		this.scripts = scripts;
		this.messages = [];
		this.db = db;

		this.adapters.forEach((adapter) => {
			adapter.incoming((message: any) => {
				this.messages.push(message);
			});
		});

		this.bots.forEach((bot) => {
			bot.received((message: any) => {
				logger.debug('Middleware', `Received from bot ${bot.name}`);
				this.executeScripts(message)
					.then((res: any) => {
						if (res) {
							this.adapters.filter((adapter) => adapter.name === message.adapter)[0].send(message);
						}
					})
					.catch((err: any) => logger.error('Middleware', err));
			});
		});

		setInterval(async () => {
			await this.processMessage();
		}, 200);
	}

	processMessage() {
		return new Promise((resolve, reject) => {
			if (this.messages.length) {
				const message = this.messages.shift();
				logger.debug('Middleware', `Processing message ${message._id} from ${message.user.username}`);

				this.executeScripts(message, false)
					.then((res: any) => {
						if (res) {
							logger.debug('Middleware', 'Sending to bots');
							this.bots.forEach((bot) => {
								bot.send(message);
							});
						}
					})
					.catch((err: any) => reject(err));
			}

			resolve(true);
		});
	}

	executeScripts(message: any, outgoing = true, index = 0): any {
		return new Promise((resolve, reject) => {
			const script = this.scripts[index];

			if (script) {
				if (script.outgoing === outgoing && !script.onDemand) {
					return script.script(message, {
						http: axios,
						db: this.db,
						logger: logger,
						adapter: this.adapters.filter((adapter) => adapter.name === message.adapter)[0],
						getAdapter: (name: string) => this.adapters.filter((s) => s.name === name)[0] || undefined,
						script: (name: string) => this.scripts.filter((s) => s.name === name)[0] || undefined,
						hear: async (regex: string, callback: any, elseCallback?: any) => {
							const matches = message.message.match(regex);
							if (matches !== null) {
								matches.forEach((m: string, mInx: number) => {
									matches[mInx] = m.trim();
								});
								if (matches[1]) matches[1] = matches[1].toLowerCase();
								return callback(matches);
							}
							else if (elseCallback) return elseCallback();
							else return true;
						}
					})
						.then((executed: any) => {
							if (executed) {
								logger.debug('Middleware', `${script.outgoing ? 'Outgoing' : 'Incoming'} - Executed ${script.name}`);
								index++;

								return resolve(this.executeScripts(message, outgoing, index));
							}
							else {
								logger.debug('Middleware', `Flow stopped by ${script.name} script`);
								return resolve(false);
							}
						})
						.catch((err: any) => reject(err));
				}
				else {
					index++;

					return resolve(this.executeScripts(message, outgoing, index));
				}
			}

			return resolve(true);
		});
	}
}

export default Middleware;
