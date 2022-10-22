import 'dotenv/config';
import { Telegraf } from 'telegraf';
import { utils } from 'ethers';
import mongoose from 'mongoose';
import User from './user.js';

const main = async () => {
	try {
		await mongoose.connect(`${process.env.MONGO_CONNECTION}`);
	} catch (err) {
		//use proper log method
		console.log('error connecting to database', err);
	}
	const bot = new Telegraf(process.env.BOT_TOKEN);

	bot.start((ctx) => {
		ctx.reply('Welcome');
	});

	bot.help((ctx) => {
		ctx.reply('This bot will notify you if you receive one or more buildspace nfts');
	});

	bot.command('subscribe', async (ctx) => {
		const rawText = ctx.update.message.text;
		const address = rawText.match(/(\b0x[a-fA-F0-9]{40}\b)/g)[0];
		if (!address) {
			return ctx.reply('you should send an address to subscribe');
		}
		const isAddressValid = utils.isAddress(address); 
		if (!isAddressValid) {
			return ctx.reply('you should send a valid evm compatible address');	
		}
		const existUser = await User.findOne({
			userId: ctx.update.message.from.id,
		});
		if (!!existUser) {
			ctx.reply('you are already subscribed');
		}
		try {
			await User.create({
		    name: ctx.update.message.from.first_name,
		    userId: ctx.update.message.from.id,
		    address: address.toLowerCase(),
		  });
		  return ctx.reply('subscribed succesfully');
		} catch (err) {
			console.log(err);
			return ctx.reply('failed to subscribe');
		}
	});

	bot.command('unsubscribe', async (ctx) => {
		const result = await User.deleteOne({
			userId: ctx.update.message.from.id,
		});
		if (!!result?.deletedCount) {
			return ctx.reply('unsubscribed succesfully');
		}
		ctx.reply('failed to unsubscribe');
	});

	bot.on('text', (ctx) => {
		const rawText = ctx.update.message.text;
		const checkIfGm = !!rawText.match(/(\bgm\b)/g);
		const checkIfLocalhost = !!rawText.match(/(\blocalhost\b)/g);
		if (checkIfGm) {
			return ctx.reply('gm');
		}
		if (checkIfLocalhost) {
			return ctx.reply('get the fuck of localhost');
		}
		return ctx.reply("I can't understand a single word of that");
	});
	bot.launch();

	// Enable graceful stop
	process.once('SIGINT', () => bot.stop('SIGINT'));
	process.once('SIGTERM', () => bot.stop('SIGTERM'));
};
main();