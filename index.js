import bs58 from 'bs58';
import Aptos from './aptos.js';
import Solana from './solana.js';

const aptos = new Aptos();
const solana = new Solana();

function getAllPropertiesOfClass(classParam) {
    return [...Object.getOwnPropertyNames(classParam), ...Object.getOwnPropertyNames(classParam.prototype)];
}

function getDecodedPrivateKey(privateKey) {
    return Uint8Array.from(bs58.decode(privateKey));
}

async function solTransfer() {
    // const fromKeypair = solana.generateKeypair();
    const fromKeypair = solana.getKeypairFromSecretKey(getDecodedPrivateKey('5Gwv1vC7z375WLtpZCQb4V3kuKR37WwhFnAyBbyDJ3riKxZWoqs5uVC2bMcxUcNbFdFBUdBoSpf544U3szmRydvc'));
    const toKeypair = solana.generateKeypair();
    
    // const airdropSignature = await solana.requestAirdrop(
    //     fromKeypair.publicKey,
    //     10000000000,
    // );
    // const confirmedTransaction = await solana.confirmTransaction(airdropSignature);
    
    const transaction = solana.getNewTransaction();

    transaction.add(solana.getTransferInstruction(fromKeypair.publicKey, toKeypair.publicKey, 1000000000));
    const response = await solana.sendTransaction(solana.connection, transaction, fromKeypair);
    console.log(response);
}

solTransfer();