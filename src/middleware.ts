import Database from './database';
import axios from 'axios';
import { logger } from './utils';

class Middleware {
	public bots: any[];
	public adapters: any[];
	public messages: any[];
	public scripts: any[];
	public modules: any[];
	public db: Database;
	public temp: any;

	constructor(db: Database, bots: any [], adapters: any[], scripts: any[], modules: any[]) {
		this.bots = bots;
		this.adapters = adapters;
		this.scripts = scripts;
		this.modules = modules;
		this.messages = [];
		this.temp = {};
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

		this.initModules();

		setInterval(async () => {
			await this.processMessage();
		}, 200);
	}

	private initModules() {
		this.modules = this.modules.map((mod: any) => {
			const temp = {
				name: mod.name,
				...(mod.script(this))
			};

			return temp;
		});
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
						temp: this.temp,
						adapter: this.adapters.filter((adapter) => adapter.name === message.adapter)[0],
						module: (name: string) => this.modules.filter((s) => s.name === name)[0] || undefined,
						getAdapter: (name: string) => this.adapters.filter((s) => s.name === name)[0] || undefined,
						script: (name: string) => this.scripts.filter((s) => s.name === name)[0] || undefined,
						hear: async (regex: RegExp, callback: any, elseCallback?: any) => {
							const matches = message.message.match(regex);
							if (matches !== null) {
								matches.forEach((m: any, mInx: number) => {
									if ((typeof m) === 'string') matches[mInx] = m.trim();
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
