const decoder = new TextDecoder();
const { simpleParser } = require('mailparser');

export default {
	async fetch(request, env, ctx) {
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
				const date = parsed.date
				const year = date.getFullYear();
				const month = String(date.getMonth() + 1).padStart(2, '0');
				const day = String(date.getDate()).padStart(2, '0');
				const hours = String(date.getHours()).padStart(2, '0');
				const minutes = String(date.getMinutes()).padStart(2, '0');
				const seconds = String(date.getSeconds()).padStart(2, '0');
				await env.KV.put('email', JSON.stringify({
					from: parsed.from.text,
					to: parsed.to.text,
					subject: parsed.subject,
					date: `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`,
					content: parsed.text
				}));
			});
		}
		await read();
	}
};
