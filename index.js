import dotenv from 'dotenv';
import Aptos from './aptos.js';
import Solana from './solana.js';

dotenv.config();
const aptos = new Aptos();
const solana = new Solana();

async function transferGariOnSolana() {
    const fromAccount = solana.keypairFromSecretKey(process.env.secretKey1);
    const toAccount = solana.keypairFromSecretKey(process.env.secretKey2);

    console.log(13, fromAccount.publicKey.toString());
    console.log(14, toAccount.publicKey.toString());

    const fromAssociatedTokenAddress = solana.getAssociatedTokenAddress(fromAccount.publicKey);
    const fromAccountInfo = await solana.connection.getAccountInfo(fromAssociatedTokenAddress);

    const toAssociatedTokenAddress = solana.getAssociatedTokenAddress(toAccount.publicKey);
    const toAccountInfo = await solana.connection.getAccountInfo(toAssociatedTokenAddress);

    const { blockhash } = await solana.connection.getLatestBlockhash();
    const transaction = solana.newTransaction(blockhash);

    if (!fromAccountInfo) transaction.add(solana.createAssociatedTokenAccountInstruction(fromAssociatedTokenAddress, fromAccount.publicKey));
    if (!toAccountInfo) transaction.add(solana.createAssociatedTokenAccountInstruction(toAssociatedTokenAddress, toAccount.publicKey));
    transaction.add(solana.transferTokensInstruction(fromAssociatedTokenAddress, toAssociatedTokenAddress, fromAccount.publicKey, 100000000));
    transaction.add(solana.memoInstruction('Block-Chain-Practice Gari Transfer Test'));

    const transactionSignature = await solana.sendAndConfirmTransaction(transaction, fromAccount);
    console.log(31, transactionSignature);
}

transferGariOnSolana();