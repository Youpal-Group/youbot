import RocketChat from './rocketchat';

const handleText = (event: any, rocketchat: RocketChat) => {
	return new Promise((resolve) => {
		if (event.type !== 'text') {
			return resolve(false);
		}

		return resolve(rocketchat.sendMessage(genTextResponse(event.payload), event));
	});
};

const handleTyping = (event: any, rocketchat: RocketChat, typing = true) => {
	return rocketchat.sendTyping(event, typing);
};

const handleFile = (event: any, rocketchat: RocketChat) => {
	return new Promise((resolve) => {
		if (event.type !== 'file') {
			return resolve(false);
		}

		const file = event.payload;

		if (file.url) {
			if (file.url.match(/\.(tif|tiff|bmp|jpg|jpeg|gif|png)$/)) {
				file.isImg = true;
			}
			else if (file.url.match(/\.(pcm|wav|aiff|mp3|aac|ogg|wma)$/)) {
				file.isAudio = true;
			}
			else if (file.url.match(/\.(mp4|mov|wmv|flv|avi|avchd|webm|mkv)$/)) {
				file.isVideo = true;
			}
		}

		const attachments = [
			{
				title: file.title || '',
				title_link: file.url || '',
				title_link_download: true,
				image_url: file.isImg ? file.url : undefined,
				audio_url: file.isAudio ? file.url : undefined,
				video_url: file.isVideo ? file.url : undefined
			}
		];

		const msg = {
			attachments: attachments || [],
			rid: event.channel
		};

		return resolve(rocketchat.sendMessage(msg, event));
	});
};

const genTextResponse = (payload: any): string => {
	let text = payload.text;

	if (payload.quick_replies && payload.quick_replies.length) {
		payload.quick_replies.forEach((reply: any) => {
			text += '\n' + reply.title;
		});
	}

	return text;
};

export default {
	text: handleText,
	typing: handleTyping,
	file: handleFile
};
