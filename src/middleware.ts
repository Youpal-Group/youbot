import Database from './database';
import axios from 'axios';
import https from 'https';
import fs from 'fs';
import { logger } from './utils';

class Middleware {
	public bots: any[];
	public adapters: any[];
	public messages: any[];
	public scripts: any[];
	public modules: any[];
	public qnas: string[];
	public db: Database;
	public http: any;
	public logger: any;
	public temp: any;
	public httpsAgent: https.Agent | undefined;

	constructor(db: Database, bots: any [], adapters: any[], scripts: any[], modules: any[]) {
		this.bots = bots;
		this.adapters = adapters;
		this.scripts = scripts;
		this.modules = modules;
		this.logger = logger;
		this.messages = [];
		this.httpsAgent = undefined;

		if (process.env.SECURITY_SSL === 'true' && process.env.SECURITY_CERT && process.env.SECURITY_KEY) {
			try {
				this.httpsAgent = new https.Agent({
					cert: fs.readFileSync(process.env.SECURITY_CERT),
					key: fs.readFileSync(process.env.SECURITY_KEY),
					rejectUnauthorized: true
				});

				logger.info('Middleware', 'SSL enabled');
			}
			catch (err) {
				logger.error('Middleware', err);
				logger.info('Middleware', 'SSL DISABLED');
			}
		}
		else {
			logger.info('Middleware', 'SSL DISABLED');
		}

		this.http = axios.create({ httpsAgent: this.httpsAgent });

		this.qnas = [];

		this.scripts.forEach((s) => {
			if (s.doc.questions.length) {
				s.doc.questions.forEach((q: string) => this.qnas.push(q));
			}
		});

		this.temp = {};
		this.db = db;

		this.adapters.forEach((adapter) => {
			adapter.incoming((message: any) => {
				this.messages.push(message);
			});
		});

		this.bots.forEach((bot) => {
			bot.received(async (message: any) => {
				logger.debug('Middleware', `Received from bot ${bot.name}`);
				await this.executeScripts(message)
					.then(async (res: any) => {
						if (res) {
							return this.adapters.filter((adapter) => adapter.name === message.adapter)[0].send(message);
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
			return {
				...mod,
				...(mod.script({
					http: this.http,
					db: this.db,
					logger: logger,
					temp: this.temp,
					questions: this.qnas,
					module: (name: string) => this.modules.filter((s) => s.name === name)[0] || undefined,
					bot: (name: string) => this.bots.filter((bot) => bot.name === name)[0] || undefined,
					getAdapter: (name: string) => this.adapters.filter((s) => s.name === name)[0] || undefined,
					script: (name: string) => this.scripts.filter((s) => s.name === name)[0] || undefined
				}))
			};
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
						http: this.http,
						db: this.db,
						logger: logger,
						temp: this.temp,
						questions: this.qnas,
						adapter: this.adapters.filter((adapter) => adapter.name === message.adapter)[0],
						bot: (name: string) => this.bots.filter((bot) => bot.name === name)[0] || undefined,
						module: (name: string) => this.modules.filter((s) => s.name === name)[0] || undefined,
						getAdapter: (name: string) => this.adapters.filter((s) => s.name === name)[0] || undefined,
						script: (name: string) => this.scripts.filter((s) => s.name === name)[0] || undefined,
						hear: async (regex: RegExp, callback: any, elseCallback?: any) => {
							if (typeof (message.message) === 'string') {
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
							return true;
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
