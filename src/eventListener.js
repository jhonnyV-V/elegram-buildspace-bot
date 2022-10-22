import { Contract, ethers } from 'ethers';
import abi from './abi.js';

const callback = async (bot, contract, receiver, tokenId) => {
	//check if the address is in the database
	//if the address exist send a message to the user with the nft data
	//check how to prevent the socket to disconnect
	//use contract.tokenURI(tokenId) to get the tokenUri
};

async function main(bot) {
  const provider = new ethers.providers.WebSocketProvider(
    process.env.BLOCKCHAIN_PROVIDER_WS,
  );

  const contract = new Contract(
    `${process.env.CONTRACT_NFT_ADDRESS}`,
    abi,
    provider.getSigner(),
  );

  contract.on('Claim', async (receiver, , , tokenId) => {
    
    await transferEvent(bot, contract, receiver, tokenId);
  });
}

export default main;