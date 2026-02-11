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
				console.log(content);
				const parsed = simpleParser(content);
				console.log(parsed.text);
				await env.KV.put('email', JSON.stringify({
					from: parsed.from.text,
					to: parsed.to.text,
					subject: parsed.subject,
					date: Math.floor(parsed.date / 1000),
					content: parsed.text
				}));
			});
		}
		await read();
	}
};
