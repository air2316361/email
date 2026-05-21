const decoder = new TextDecoder();
const { simpleParser } = require('mailparser');

export default {
	async fetch(request, env, ctx) {
		console.log(request.path);
		console.log(request.url);
		console.log(JSON.stringify(request));
		const value = await env.KV.get('email');
		return new Response(value);
	},
	async email(message, env, ctx) {
		const reader = message.raw.getReader();
		let content = "";
		function read() {
			return reader.read().then(async ({ done, value }) => {
				if (!done) {
					const chunk = decoder.decode(value);
					content += chunk;
					return read();
				}
				const parsed = await simpleParser(content);
				const utcTime = parsed.date.getTime() + (parsed.date.getTimezoneOffset() * 60000);
				const gmt8Time = new Date(utcTime + (3600000 * 8));
				const year = gmt8Time.getFullYear();
				const month = String(gmt8Time.getMonth() + 1).padStart(2, '0');
				const day = String(gmt8Time.getDate()).padStart(2, '0');
				const hours = String(gmt8Time.getHours()).padStart(2, '0');
				const minutes = String(gmt8Time.getMinutes()).padStart(2, '0');
				const seconds = String(gmt8Time.getSeconds()).padStart(2, '0');
				const parsedContent = parsed.text;
				const cacheObj = {
					from: message.from,
					to: message.to,
					subject: parsed.subject,
					date: `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`,
					content: parsedContent
				}
				let startIndex = parsedContent.indexOf("验证码");
				if (startIndex > -1) {
					cacheObj.captcha = parseCaptcha(parsedContent, startIndex + 3);
				} else {
					const parsedContentLowerCase = parsedContent.toLowerCase();
					startIndex = parsedContentLowerCase.indexOf("captcha");
					if (startIndex > -1) {
						cacheObj.captcha = parseCaptcha(parsedContent, startIndex + 7);
					}
				}
				await env.KV.put('email', JSON.stringify(cacheObj));
			});
		}
		await read();
	}
};

function isDigit(char) {
	return !isNaN(Number(char)) && char.trim().length > 0;
}

function parseCaptcha(content, startIndex) {
	let endIndex = 0;
	let flag = true;
	for (let i = startIndex; i < content.length; ++i) {
		const char = content[i];
		if (isDigit(char)) {
			if (flag) {
				startIndex = i;
				flag = false;
			}
		} else if (!flag) {
			endIndex = i;
			break;
		}
	}
	return content.substring(startIndex, endIndex);
}
