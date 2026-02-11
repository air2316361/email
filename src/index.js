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
			return reader.read().then(({ done, value }) => {
				if (done) {
					simpleParser(content, async (err, parsed) => {
						if (err) {
							return done(err);
						}
						await env.KV.put('email', JSON.stringify({
							from: parsed.from.text,
							to: parsed.to.text,
							subject: parsed.subject,
							date: Math.floor(parsed.date / 1000),
							content: parsed.text,
						}));
					})
					return;
				}
				const chunk = decoder.decode(value);
				content += chunk;
				return read();
			});
		}
		await read();
	}
};
