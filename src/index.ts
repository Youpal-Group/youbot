import Database from './database';
import Middleware from './middleware';
import { getComponents, logger } from './utils';

const initialize = async () => {
	try {
		logger.setLogger(process.env.DEBUG_LEVEL || 'info', process.env.DEBUG_MAXSIZE || '20m', process.env.DEBUG_MAXFILES || '14d');

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

		const modules: any[] = <any>(await getComponents('modules'));

		modules.forEach((mod) => {
			logger.info('Middleware', `Module ${mod.name} registered`);
		});

		logger.info('Middleware', `Registered ${modules.length} modules`);

		return new Middleware(new Database(), bots, adapters, middlewares.concat(scripts), modules, process.env.BOTPRESS_QNA || './qna/qna.json');
	}
	catch (err) {
		logger.error('Middleware', err);
		return {} as Middleware;
	}
};

initialize();
