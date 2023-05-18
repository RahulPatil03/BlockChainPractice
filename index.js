import dotenv from 'dotenv';
import Solana from './solana.js';
import Aptos from './aptos.js';

dotenv.config();

class SolanaPractice extends Solana {
    constructor() {
        super();
    }

    async #serializedTransactionGariTransfer(fromPubkey, toPubkey, amount, memo) {
        const fromAssociatedTokenAddress = this.getAssociatedTokenAddress(fromPubkey);
        const fromAccountInfo = await this.connection.getAccountInfo(fromAssociatedTokenAddress);

        const { value: { amount: tokenAccountBalance } } = await this.connection.getTokenAccountBalance(fromAssociatedTokenAddress);
        if (tokenAccountBalance < amount) throw new Error('Insufficient Token Balance');

        const toAssociatedTokenAddress = this.getAssociatedTokenAddress(toPubkey);
        const toAccountInfo = await this.connection.getAccountInfo(toAssociatedTokenAddress);

        const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
        const transaction = this.newTransaction(blockhash, lastValidBlockHeight);

        if (!fromAccountInfo) transaction.add(this.createAssociatedTokenAccountInstruction(fromAssociatedTokenAddress, fromPubkey));
        if (!toAccountInfo) transaction.add(this.createAssociatedTokenAccountInstruction(toAssociatedTokenAddress, toPubkey));
        transaction.add(this.transferTokensInstruction(fromAssociatedTokenAddress, toAssociatedTokenAddress, fromPubkey, amount));
        transaction.add(this.memoInstruction(memo));

        transaction.sign(this.feePayer);
        return transaction.serialize({ requireAllSignatures: false }).toString('base64');
    }

    async transferGari() {
        const fromAccount = this.keypairFromSecretKey(process.env.solanaUserSecretKey);
        const serializedTransaction = await this.#serializedTransactionGariTransfer(
            fromAccount.publicKey.toString(),
            '2FeSUo4dxqiSJeH3zj2gMe2Mc4wehCYGn66Bx4tS6Cup',
            100000000,
            'Block-Chain-Practice Gari Transfer Test'
        );
        const deserializedTransaction = this.deserializeTransaction(serializedTransaction);
        const transactionSignature = await this.sendAndConfirmTransaction(deserializedTransaction, fromAccount);
        console.log(44, transactionSignature);
    }
}

class AptosPractice extends Aptos {
    constructor() {
        super();
    }

    async registerWithGari() {
        const userAccount = this.getAptosAccountFromPrivateKey(process.env.aptosUserPrivateKey);
        const { rawTxnBase64 } = await this.rawTransactionTokenRegistration(userAccount.address);

        const payerAuth = await this.getTransactionAuthentication(rawTxnBase64, userAccount.address);
        const senderAuth = await this.getTransactionAuthentication(rawTxnBase64, userAccount.address, userAccount.privateKeyHex.substring(2));

        const { hash, error, message } = await this.submitMultiAgentTransaction(rawTxnBase64, payerAuth, userAccount.address, senderAuth);
        console.log(61, hash, error, message);
    }
}

const solanaPractice = new SolanaPractice();
const aptosPractice = new AptosPractice();

// solanaPractice.transferGari();
aptosPractice.registerWithGari();