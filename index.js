import dotenv from 'dotenv';
import Aptos from './aptos.js';
import Solana from './solana.js';

dotenv.config();
const aptos = new Aptos();
const solana = new Solana();

async function solanaFn() {
    const fromAccount = solana.keypairFromSecretKey(process.env.userSecretKey);
    const serializedTransaction = await serializedTransactionGariTransfer(
        fromAccount.publicKey.toString(),
        '2FeSUo4dxqiSJeH3zj2gMe2Mc4wehCYGn66Bx4tS6Cup',
        100000000,
        'Block-Chain-Practice Gari Transfer Test'
    );
    const deserializedTransaction = solana.deserializeTransaction(serializedTransaction);
    const transactionSignature = await solana.sendAndConfirmTransaction(deserializedTransaction, fromAccount);
    console.log(19, transactionSignature);
}

solanaFn();

async function serializedTransactionGariTransfer(fromPubkey, toPubkey, amount, memo) {
    const fromAssociatedTokenAddress = solana.getAssociatedTokenAddress(fromPubkey);
    const fromAccountInfo = await solana.connection.getAccountInfo(fromAssociatedTokenAddress);

    const toAssociatedTokenAddress = solana.getAssociatedTokenAddress(toPubkey);
    const toAccountInfo = await solana.connection.getAccountInfo(toAssociatedTokenAddress);

    const { blockhash, lastValidBlockHeight } = await solana.connection.getLatestBlockhash();
    const transaction = solana.newTransaction(blockhash, lastValidBlockHeight);

    if (!fromAccountInfo) transaction.add(solana.createAssociatedTokenAccountInstruction(fromAssociatedTokenAddress, fromPubkey));
    if (!toAccountInfo) transaction.add(solana.createAssociatedTokenAccountInstruction(toAssociatedTokenAddress, toPubkey));
    transaction.add(solana.transferTokensInstruction(fromAssociatedTokenAddress, toAssociatedTokenAddress, fromPubkey, amount));
    transaction.add(solana.memoInstruction(memo));

    transaction.sign(solana.feePayer);
    return transaction.serialize({ requireAllSignatures: false }).toString('base64');
}
