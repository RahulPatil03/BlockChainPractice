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
    #powersOf256 = [1, 256];
    
    constructor() {
        super();
        for (let i = 2; i < 8; i++) this.#powersOf256[i] = this.#powersOf256[i - 1] * 256;
    }

    #getHexFromUint8Array(uint8Array) {
        return uint8Array.reduce((previousValue, currentValue) => previousValue + currentValue.toString(16).padStart(2, 0), '0x');
    }

    #getNumberFromUint8Array(uint8Array) {
        return uint8Array.reduce((previousValue, currentValue, currentIndex) => previousValue + currentValue * this.#powersOf256[currentIndex], 0);
    }

    async registerWithGari() {
        const userAccount = this.getAptosAccountFromPrivateKey(process.env.aptosUserPrivateKey);
        const { rawTxnBase64 } = await this.rawTransactionTokenRegistration(userAccount.address);

        const payerAuth = await this.getTransactionAuthentication(rawTxnBase64, userAccount.address);
        const senderAuth = await this.getTransactionAuthentication(rawTxnBase64, userAccount.address, userAccount.privateKeyHex.substring(2));

        const { hash, error, message } = await this.submitMultiAgentTransaction(rawTxnBase64, payerAuth, userAccount.address, senderAuth);
        console.log(61, hash, error, message);
    }

    async transferGari(to, amount) {
        const fromAccount = this.getAptosAccountFromPrivateKey(process.env.aptosUserPrivateKey);

        const isFromRegistered = await this.isUserRegistered(fromAccount.address);
        const isToRegistered = await this.isUserRegistered(to);

        if (!isFromRegistered || !isToRegistered)
            throw new Error(
                !isFromRegistered
                    ? 'fromUser is not registered with Gari'
                    : 'toUser is not registered with Gari'
            );

        const tokenBalance = await this.getTokenBalance(fromAccount.address);
        if (tokenBalance < amount) throw new Error('Insufficient Token Balance');

        const { rawTxnBase64 } = await this.rawTransactionCoinTransfer(fromAccount.address, [to], [amount], [90000000], 'Block-Chain-Practice Gari Transfer');

        const payerAuth = await this.getTransactionAuthentication(rawTxnBase64, fromAccount.address);
        const senderAuth = await this.getTransactionAuthentication(rawTxnBase64, fromAccount.address, fromAccount.privateKeyHex.substring(2));

        const { hash, error, message } = await this.submitMultiAgentTransaction(rawTxnBase64, payerAuth, fromAccount.address, senderAuth);
        console.log(72, hash, error, message);
    }

    async mintBadge() {
        const userAccount = this.getAptosAccountFromPrivateKey(process.env.aptosUserPrivateKey);
        const { rawTxnBase64 } = await this.rawTransactionMintBadge(userAccount.address);

        const payerAuth = await this.getTransactionAuthentication(rawTxnBase64, userAccount.address);
        const senderAuth = await this.getTransactionAuthentication(rawTxnBase64, userAccount.address, userAccount.privateKeyHex.substring(2));

        const { hash, error, message } = await this.submitMultiAgentTransaction(rawTxnBase64, payerAuth, userAccount.address, senderAuth);
        console.log(97, hash, error, message);
    }

    async deserializeMintBadgeTransaction() {
        const userAccount = this.getAptosAccountFromPrivateKey(process.env.aptosUserPrivateKey);
        const { rawTxnBase64 } = await this.rawTransactionMintBadge(userAccount.address);

        const multiAgentRawTransaction = this.getDeserializedTransaction(rawTxnBase64);
        const userAddress = this.#getHexFromUint8Array(multiAgentRawTransaction.secondary_signer_addresses[0].address);

        const [tokenNameArg, priceArg, memoArg] = multiAgentRawTransaction.raw_txn.payload.value.args;
        const tokenName = String.fromCharCode(...tokenNameArg.slice(1));
        const price = this.#getNumberFromUint8Array(priceArg);
        const memo = String.fromCharCode(...memoArg.slice(1));

        console.log(122, { userAddress, tokenName, price, memo });
    }
}

const solanaPractice = new SolanaPractice();
const aptosPractice = new AptosPractice();

aptosPractice.deserializeMintBadgeTransaction();