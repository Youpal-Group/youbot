import fs from 'fs';
import getComponents from './components';
import logger from './logger';
import { jsonParser, commentParser } from './parser';

const getConfig = (path: string): any => {
	logger.info('Middleware', `Loading config from ${path}`);
	return JSON.parse(fs.readFileSync(path).toString('utf8'));
};

export { logger, getComponents, getConfig, jsonParser, commentParser };
