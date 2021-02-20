import readline from 'readline';
import fs from 'fs';
import { getConfig } from '.';

const commentParser = (filepath: string) => {
	return new Promise((resolve) => {
		const comments: any = {
			questions: [],
			command: '',
			description: '',
			params: [],
			examples: []
		};
		let rec = false;
		let active = '';
		let params = '';

		const rInterface = readline.createInterface({
			input: fs.createReadStream(filepath),
			output: undefined
		});

		rInterface.on('line', (line) => {
			line = line.trim();

			if (line.includes('/*')) rec = true;

			if (rec && line.startsWith('#') && line.substring(1).trim().length) {
				if (line.endsWith(':')) {
					const keyword = line.substring(1, line.length - 1).trim().toLowerCase();
					// eslint-disable-next-line no-prototype-builtins
					if (comments.hasOwnProperty(keyword)) {
						active = keyword;
					}
					else {
						active = 'params';
						params = keyword;
					}
				}
				else if (active.length) {
					line = line.substring(1).trim();
					if (active === 'params') {
						comments.params.push({
							param: params,
							description: line
						});
					}
					else {
						if (Array.isArray(comments[active])) {
							comments[active].push(line);
						}
						else {
							comments[active] = line;
						}
					}
				}
			}

			if (rec && line.includes('*/')) {
				rec = false;
				rInterface.close();
			}
		});

		rInterface.on('close', () => {
			return resolve(comments);
		});
	});
};

const jsonParser = (filepath: string) => {
	const json = getConfig(filepath);
	const qnas: string[] = [];

	json.qnas.forEach((qna: any) => {
		qna.data.questions.en.forEach((q: any) => qnas.push(q));
	});

	return qnas;
};

export { jsonParser, commentParser };
