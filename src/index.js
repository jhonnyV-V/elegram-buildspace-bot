import 'dotenv/config';
import { Bot } from "grammy";
import { utils } from 'ethers';
import mongoose from 'mongoose';
import express from 'express';
import User from './user.js';
import eventListener from './eventListener.js';


try {
	if (!process.env.MONGO_PASSWORD) {
		await mongoose.connect(`${process.env.MONGO_CONNECTION}`,{
			useNewUrlParser: true,
			useUnifiedTopology: true
		});
	} else {
		await mongoose.connect(`${process.env.MONGO_CONNECTION}`,{
			user: process.env.MONGO_USER,
			pass: process.env.MONGO_PASSWORD,
			useNewUrlParser: true,
			useUnifiedTopology: true
		});
	}
} catch (err) {
	//use proper log method
	console.log('error connecting to database', err);
}
	
const bot = new Bot(process.env.BOT_TOKEN);

bot.command('start',(ctx) => {
	ctx.reply('Welcome to this bot, use /help to see how to use the commands');
});

bot.command('help',(ctx) => {
	ctx.reply('/subscribe <address> to receive notifications when you receive a buildspace nft\n/unsubscribe stop notifications\n/help to display this message');
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

bot.command('userCount', async (ctx) => {
	if (`${ctx.update.message.from.id}` !== `${process.env.ADMIN_ID}`) {
		return ctx.reply('You have no access to this data');
	}
	const count = await User.countDocuments();

	if (!count) {
		return ctx.reply('no users yet');
	}

	ctx.reply(`${count} in total`);
});

bot.on('message', (ctx) => {
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

if (process.env.NODE_ENV === "production") {
  // Use Webhooks for the production server
  const app = express();
  app.use(express.json());
  app.use(webhookCallback(bot, "express"));

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Bot listening on port ${PORT}`);
  });
} else {
  // Use Long Polling for development
  bot.start();
}

await eventListener(bot);

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
