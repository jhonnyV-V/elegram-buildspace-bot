import { Contract, ethers } from 'ethers';
import axios from 'axios';
import User from './user.js';
import abi from './abi.js';

const callback = async (bot, contract, receiver, tokenId) => {
	//check how to prevent the socket to disconnect

	const users = await User.find({ address: receiver.toLowerCase() });

	if (!users) {
		return;
	}

	const uri = await contract.tokenURI(tokenId?.toString() || tokenId);

	const response = await axios.get(uri);

	const metadata = response.data;

	const promises = users.map((user) => {
		bot.api.sendMessage(
			user.userId,
			`Hi ${user.name}, the address ${receiver} just got a new nft with id ${tokenId} check it in
			https://polygonscan.com/token/${process.env.CONTRACT_NFT_ADDRESS}?a=${receiver}`,
		);
		return bot.api.sendPhoto(
			user.userId,
			metadata.image,
			{ caption: metadata.name },
		);
	});
	await Promise.all(promises);
};

async function main(bot) {
  const provider = new ethers.providers.WebSocketProvider(
    process.env.BLOCKCHAIN_PROVIDER_WS,
  );

  const contract = new Contract(
    `${process.env.CONTRACT_NFT_ADDRESS}`,
    abi,
    new ethers.VoidSigner(process.env.ADMIN_ADDRESS, provider),
  );

  contract.on('Claim', async (receiver, a, b, tokenId, c) => {
    
    await callback(bot, contract, receiver, tokenId);
  });
}

export default main;