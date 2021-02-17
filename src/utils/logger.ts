import winston from 'winston';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const DailyRotateFile = require('winston-daily-rotate-file');

class Logger {
	public logger: winston.Logger;
	private options: any;

	constructor() {
		this.options = {
			console: {
				level: 'debug',
				handleExceptions: true,
				json: false,
				colorize: true,
				format: winston.format.combine()
			},
			rotate: {
				level: 'debug',
				filename: './logs/%DATE%-main.log',
				datePattern: 'YYYY-MM-DD',
				prepend: true,
				maxSize: '20m',
				maxFiles: '14d'
			}
		};

		this.logger = this.setLogger('debug', '20m', '14d');
	}

	info(component: string, message: string) {
		this.logger.info('[' + component + '] ' + message);
	}

	warn(component: string, message: string) {
		this.logger.warn('[' + component + '] ' + message);
	}

	error(component: string, err: any) {
		this.logger.error('[' + component + '] ' + this.formatError(err));
	}

	debug(component: string, message: string) {
		this.logger.debug('[' + component + '] ' + message);
	}

	setLogger(level: string, maxSize: string, maxFiles: string) {
		this.options.console.level = level;

		this.options.console.format = winston.format.combine(
			winston.format.timestamp(),
			winston.format.colorize(),
			winston.format.printf(info => {
				return `${info.timestamp} ${info.level}: ${info.message}`;
			})
		);

		this.options.rotate.maxSize = maxSize;
		this.options.rotate.maxFiles = maxFiles;

		this.logger = winston.createLogger({
			level: level,
			transports: [
				new winston.transports.Console(this.options.console),
				new DailyRotateFile(this.options.rotate)
			],
			exitOnError: false
		});

		return this.logger;
	}

	formatError(err: any): string {
		if (typeof (err) === 'object') {
			let error = '';

			if (err.stack) error = err.stack;
			else if (err.name && err.message) error = err.name + ': ' + err.message;
			else if (err.message) error = err.message;
			else error = JSON.stringify(err);

			return error;
		}

		return err;
	}
}

const logger = new Logger();

export default logger;
