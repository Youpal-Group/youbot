import Database from './database';
import Middleware from './middleware';
import { getConfig, getComponents, logger } from './utils';

const initialize = async () => {
	try {
		const config = getConfig('./config.json');

		logger.setLogger(config.debugLevel, config.debugMaxSize, config.debugMaxFiles);

		const bots: any[] = <any>(await getComponents('bots'));

		bots.forEach((bot) => {
			logger.info('Middleware', `Bot ${bot.name} registered`);
		});

		logger.info('Middleware', `Registered ${bots.length} bots`);

		const adapters: any[] = <any>(await getComponents('adapters'));

		adapters.forEach((adapter) => {
			logger.info('Middleware', `Adapter ${adapter.name} registered`);

			adapter.start();
		});

		logger.info('Middleware', `Registered ${adapters.length} adapters`);

		const middlewares: any[] = <any>(await getComponents('middlewares'));

		middlewares.forEach((mid) => {
			logger.info('Middleware', `Middleware ${mid.name} registered`);
		});

		logger.info('Middleware', `Registered ${middlewares.length} middlewares`);

		const scripts: any[] = <any>(await getComponents('scripts'));

		scripts.forEach((script) => {
			logger.info('Middleware', `Script ${script.name} registered`);
		});

		logger.info('Middleware', `Registered ${scripts.length} scripts`);

		return new Middleware(new Database(config), bots, adapters, middlewares.concat(scripts));
	}
	catch (err) {
		logger.error('Middleware', err);
		return {} as Middleware;
	}
};

initialize();
