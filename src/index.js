const decoder = new TextDecoder();
const { simpleParser } = require('mailparser');

export default {
	async fetch(request, env, ctx) {
		const value = await env.KV.get('email');
		return new Response(value);
	},
	async email(message, env, ctx) {
		// const reader = message.raw.getReader();
		// let content = "";
		// function read() {
		// 	return reader.read().then(({ done, value }) => {
		// 		if (!done) {
		// 			const chunk = decoder.decode(value);
		// 			content += chunk;
		// 			return read();
		// 		}
		// 		console.log(content);
		// 		simpleParser(content, async (err, parsed) => {
		// 			if (err) {
		// 				return done(err);
		// 			}
		// 			console.log(parsed.text);
		// 			await env.KV.put('email', JSON.stringify({
		// 				from: parsed.from.text,
		// 				to: parsed.to.text,
		// 				subject: parsed.subject,
		// 				date: Math.floor(parsed.date / 1000),
		// 				content: parsed.text
		// 			}));
		// 		})
		// 	});
		// }
		// await read();
		const email = await simpleParser(message.raw);
		console.log(email.text);
		await env.KV.put('email', JSON.stringify({
			from: email.from.text,
			to: email.to.text,
			subject: email.subject,
			date: Math.floor(email.date.getTime() / 1000),
			content: email.text
		}));
	}
};
