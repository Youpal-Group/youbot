import fs from 'fs';
import path from 'path';
import { commentParser, getConfig } from '.';

const getComponents = (name: string) => {
	return new Promise((resolve, reject) => {
		const components: any[] = [];

		try {
			const adNames = getConfig(`./${name}/${name}.json`);

			return resolve(checkItem(components, `./${name}`, adNames[name]));
		}
		catch (err) {
			return reject(err);
		}
	});
};

const findIndex = (myPath: string) => {
	return new Promise((resolve) => {
		fs.stat(myPath, (err, stat) => {
			if (err) {
				return resolve(false);
			}

			if (stat.isFile()) {
				return resolve(true);
			}

			return resolve(false);
		});
	});
};

const checkItem = (components: any[], dir: string, list: string[], index = 0) => {
	return new Promise((resolve, reject) => {
		if (list[index]) {
			const myPath = path.resolve(dir, list[index]);

			fs.stat(myPath, async (err, stat) => {
				if (err) {
					return reject(err);
				}

				if (stat.isDirectory()) {
					try {
						let found = await findIndex(myPath + '/dist/index.js');

						if (found) {
							// eslint-disable-next-line @typescript-eslint/no-var-requires
							let req = require(myPath + '/dist/index.js').default;
							if (req === undefined) req = require(myPath + '/dist/index.js');
							req.doc = await commentParser(myPath + '/dist/index.js');
							components.push(req);
						}
						else {
							found = await findIndex(myPath + '/index.js');

							if (found) {
								// eslint-disable-next-line @typescript-eslint/no-var-requires
								let req = require(myPath + '/index.js').default;
								if (req === undefined) req = require(myPath + '/index.js');
								req.doc = await commentParser(myPath + '/index.js');
								components.push(req);
							}
						}

						if (index < list.length) {
							index++;
							return resolve(checkItem(components, dir, list, index));
						}
						else {
							return resolve(components);
						}
					}
					catch (err) {
						return reject(err);
					}
				}
				else {
					return resolve(components);
				}
			});
		}
		else {
			return resolve(components);
		}
	});
};


export default getComponents;
