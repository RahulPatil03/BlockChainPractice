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

        transaction.sign(this.admin);
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

    async signAndSerialize() {
        const userAccount = this.keypairFromSecretKey(process.env.solanaUserSecretKey);
        const gariAccount = this.keypairFromSecretKey(process.env.gariAccountPrivateKey);

        const deserializedTransaction = this.deserializeTransaction('AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAIGwe50qhRa1baFlXdNX90ZehV5l+GgMRk6Pe/3mWpT1IXO4vWaeZBo2rJa5uqGQH94lvNtmOKbLG0K+uqsyqHdJ36UsgMNfiNFZ7xaQ9YSXecgq0DJT4Rmp6S71hhasbJGrF9c13AfFD+Oi3raJfGBjFOYRX9IYShtQ400SF+tOroG3fbh12Whk9nL4UbO63msHLSF7V9bN5E6jPWFfv8AqQVKU1D4XciC1hSlVnJ4iilt3x6rq9CmBniISTL07vagLSbjdbGAysnripvx1AS4UgTS9AK/G/Z455X511l08EYDBAMBAgAJAzDmAgAAAAAABAMBAwAJAxAnAAAAAAAABQAcVGlwIDY0NzA4ZWE0ZmI4Y2JlOWJiNjY5MDMzNw==');

        deserializedTransaction.partialSign(userAccount);
        console.log(54, deserializedTransaction.serialize({ verifySignatures: false }).toString('base64'));
    }

    async decodeTransaction() {
        const rawTransaction = 'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAIGps31vfjS4bHkK3PnW6jNvc5IdI92shh2C3979yhKPKo8uOHWr5dXc8JqAJhyLBVqbJWA+K9Llm7tncB3MeybIH6UsgMNfiNFZ7xaQ9YSXecgq0DJT4Rmp6S71hhasbJGrF9c13AfFD+Oi3raJfGBjFOYRX9IYShtQ400SF+tOroG3fbh12Whk9nL4UbO63msHLSF7V9bN5E6jPWFfv8AqQVKU1D4XciC1hSlVnJ4iilt3x6rq9CmBniISTL07vag+NZFXP9v4K7BIASmNaavanZBinpKykEVwJbrFjw3A3kDBAMBAgAJA+DK1AIAAAAABAMBAwAJA6AlJgAAAAAABQAcVGlwIDY0NzA4ZWE0ZmI4Y2JlOWJiNjY5MDMzNw==';
        const decodedTransaction = this.deserializeTransaction(rawTransaction);
        console.log(60, decodedTransaction);
    }
}

class AptosPractice extends Aptos {
    #powersOf256 = [1, 256];

    constructor() {
        super();
        for (let i = 2; i < 8; i++) this.#powersOf256[i] = this.#powersOf256[i - 1] * 256;
    }

    #getNumberFromUint8Array(uint8Array) {
        return uint8Array.reduce((previousValue, currentValue, currentIndex) => previousValue + currentValue * this.#powersOf256[currentIndex], 0);
    }

    #getCoinTransferArgs(receiversArg, amountArg, commissionArg) {
        const args = [];

        let totalArgs = receiversArg[0];
        receiversArg = receiversArg.slice(1);
        amountArg = amountArg.slice(1);
        commissionArg = commissionArg.slice(1);

        while (totalArgs--) {
            const start = args.length * 8;
            const receiverStart = start * 4;
            args.push({
                receiver: receiversArg.slice(receiverStart, receiverStart + 32).reduce((previousValue, currentValue) => previousValue + currentValue.toString(16).padStart(2, '0'), '0x'),
                amount: this.#getNumberFromUint8Array(amountArg.slice(start, start + 8)),
                commission: this.#getNumberFromUint8Array(commissionArg.slice(start, start + 8))
            });
        }
        return args;
    }

    async createNewAccount() {
        const newAccount = await this.getNewAccount();
        console.log(62, newAccount);
    }

    async registerWithGari() {
        const userAccount = this.getAptosAccountFromPrivateKey(process.env.aptosUserPrivateKey);
        const { rawTxnBase64 } = await this.rawTransactionTokenRegistration(userAccount.address);

        const payerAuth = await this.getTransactionAuthentication(rawTxnBase64, userAccount.address);
        const senderAuth = await this.getTransactionAuthentication(rawTxnBase64, userAccount.address, userAccount.privateKeyHex.substring(2));

        const { hash, error, message } = await this.submitMultiAgentTransaction(rawTxnBase64, payerAuth, userAccount.address, senderAuth);
        console.log(68, hash, error, message);
    }

    async transferGari(to, amount) {
        const fromAccountAddress = this.getAptosAccountFromPrivateKey(process.env.aptosUserPrivateKey);

        const isFromRegistered = await this.isUserRegistered(fromAccountAddress);
        const isToRegistered = await this.isUserRegistered(to);

        if (!isFromRegistered || !isToRegistered)
            throw new Error(
                !isFromRegistered
                    ? 'fromUser is not registered with Gari Token'
                    : 'toUser is not registered with Gari Token'
            );

        const tokenBalance = await this.getTokenBalance(fromAccountAddress);
        if (tokenBalance < amount) throw new Error('Insufficient Token Balance');

        const { rawTxnBase64 } = await this.rawTransactionCoinTransfer(fromAccountAddress, [to], [amount], [90000000], 'Block-Chain-Practice Gari Transfer');

        const payerAuth = await this.getTransactionAuthentication(rawTxnBase64, fromAccountAddress);
        const senderAuth = await this.getTransactionAuthentication(rawTxnBase64, fromAccountAddress, process.env.aptosUserPrivateKey);

        const { hash, error, message } = await this.submitMultiAgentTransaction(rawTxnBase64, payerAuth, fromAccountAddress, senderAuth);
        console.log(118, hash, error, message);
    }

    async mintBadge() {
        const userAccount = this.getAptosAccountFromPrivateKey(process.env.aptosUserPrivateKey);
        const { rawTxnBase64 } = await this.rawTransactionMintBadge(userAccount.address);

        const payerAuth = await this.getTransactionAuthentication(rawTxnBase64, userAccount.address);
        const senderAuth = await this.getTransactionAuthentication(rawTxnBase64, userAccount.address, userAccount.privateKeyHex.substring(2));

        const { hash, error, message } = await this.submitMultiAgentTransaction(rawTxnBase64, payerAuth, userAccount.address, senderAuth);
        console.log(109, hash, error, message);
    }

    async upgradeBadge() {
        const userAccount = this.getAptosAccountFromPrivateKey(process.env.aptosUserPrivateKey);
        const { rawTxnBase64 } = await this.rawTransactionUpgradeBadge(userAccount.address);

        const payerAuth = await this.getTransactionAuthentication(rawTxnBase64, userAccount.address);
        const senderAuth = await this.getTransactionAuthentication(rawTxnBase64, userAccount.address, userAccount.privateKeyHex.substring(2));

        const { hash, error, message } = await this.submitMultiAgentTransaction(rawTxnBase64, payerAuth, userAccount.address, senderAuth);
        console.log(130, hash, error, message);
    }

    async deserializeMintBadgeTransaction() {
        const userAccountAddress = this.getAddressFromPrivateKey(process.env.aptosUserPrivateKey);
        const { rawTxnBase64 } = await this.rawTransactionMintBadge(userAccountAddress);

        const multiAgentRawTransaction = this.getDeserializedTransaction(rawTxnBase64);
        const userAddress = multiAgentRawTransaction.secondary_signer_addresses[0].toHexString();

        const [tokenNameArg, priceArg, memoArg] = multiAgentRawTransaction.raw_txn.payload.value.args;
        const tokenName = String.fromCharCode(...tokenNameArg.slice(1));
        const price = this.#getNumberFromUint8Array(priceArg);
        const memo = String.fromCharCode(...memoArg.slice(1));

        console.log(119, { userAddress, tokenName, price, memo });
    }

    async deserializeCoinTransferTransaction() {
        const fromAccountAddress = this.getAddressFromPrivateKey(process.env.aptosUserPrivateKey);
        const { rawTxnBase64 } = await this.rawTransactionCoinTransfer(
            fromAccountAddress,
            ['0x37f2b3a1e2a47cf09fe9720b3a74a44e678c64dce55f21dd492ccb03be7558e1', '0x37f2b3a1e2a47cf09fe9720b3a74a44e678c64dce55f21dd492ccb03be7558e1'],
            [100000000, 9876],
            [90000000, 8769],
            'Block-Chain-Practice Gari Transfer');

        const multiAgentRawTransaction = this.getDeserializedTransaction(rawTxnBase64);
        const [, receiversArg, amountArg, commissionArg, , memoArg] = multiAgentRawTransaction.raw_txn.payload.value.args;
        console.log(179, multiAgentRawTransaction.secondary_signer_addresses[0].toHexString());
        console.log(180, this.#getCoinTransferArgs(receiversArg, amountArg, commissionArg));
        console.log(181, String.fromCharCode(...memoArg.slice(1)));
    }

    async transactionDetails() {
        const txnDetails = await this.getTransactionDetails('0x2ae51d359c7db940f29f34e0d3f3ca0f97de0d0432efec879599f642cdac4183');
        const mutateTokenPropertyMapEvent = txnDetails.events.find(({ type }) => type.includes('MutateTokenPropertyMapEvent'));
        console.log(136, mutateTokenPropertyMapEvent.data.new_id);
        console.log(137, txnDetails.signature.secondary_signer_addresses[0]);
    }

    async getSenderAuth() {
        const fromAccountAddress = this.getAddressFromPrivateKey(process.env.aptosUserPrivateKey);
        const senderAuth = await this.getTransactionAuthentication('AJxZR9I1/KivDtnJDcpQGWwRLaxAfrGdh9kofbk9fi1RowIAAAAAAAACWeh+alNFEiCl8VRqkp6QILHHV+iptuw6dmN94AX5s3EHcGF5ZXJfMzB0cmFuc2Zlcl93aXRoX2ZlZV9wYXllcl9tdWx0aXBsZV93aXRoX2NvbW1pc3Npb24BB+YMVEZ+TAlM7pUf3koBjOFQTzsPCe2G5sjZgRdxxrHwBGNvaW4BVAAGCAEAAAAAAAAAIQGcWUfSNfyorw7ZyQ3KUBlsES2sQH6xnYfZKH25PX4tUQkByAAAAAAAAAAJAQoAAAAAAAAAAQAQD1RpcCBzb2xhbmFVc2VyMiBOAAAAAAAAZAAAAAAAAAD3jHhkAAAAAAIBDPF90Ejfwq6idJpDk81KQtci1yoxL84abdaST+xOngE=', fromAccountAddress, process.env.aptosUserPrivateKey);
        console.log(194, senderAuth);
    }

    async testGetAssociateAccount() {
        const accountInfo = await this.chingariClient.getAccountInfo('0x9c5947d235fca8af0ed9c90dca50196c112dac407eb19d87d9287db93d7e2d51');
        console.log(205, accountInfo);
        console.log(206, accountInfo.message);
    }

    async testTransactionDetails() {
        const details = await this.getTransactionDetails('0x1e331b4debcd9f012ff2a7b3e62ad62ad4bbf010feac5262e639cfe6820531ac');
        console.log(211, details);
        console.log(212, details.message);
    }

    async deserializeTransaction() {
        const multiAgentRawTransaction = this.getDeserializedTransaction('AJxZR9I1/KivDtnJDcpQGWwRLaxAfrGdh9kofbk9fi1RswIAAAAAAAACWeh+alNFEiCl8VRqkp6QILHHV+iptuw6dmN94AX5s3EHcGF5ZXJfMzB0cmFuc2Zlcl93aXRoX2ZlZV9wYXllcl9tdWx0aXBsZV93aXRoX2NvbW1pc3Npb24BB+YMVEZ+TAlM7pUf3koBjOFQTzsPCe2G5sjZgRdxxrHwBGNvaW4BVAAGCAEAAAAAAAAAIQFGRI9AWzJUWCxM8cHWR3K3f5qzEB10+aoFeqW3rOOp3AkBgPD6AgAAAAAJAaAlJgAAAAAAAQAdHFRpcCA2NDdkN2Y4NWEwYWMxZWYyYzNkZTVkMTjQBwAAAAAAAGQAAAAAAAAAeI19ZAAAAAACAf20HK+yXQFHPDP2XXttl7jV5Nuw+kcBoZR26N62V1dW');
        const [, receiversArg, amountArg, commissionArg, , memoArg] = multiAgentRawTransaction.raw_txn.payload.value.args;
        console.log(179, multiAgentRawTransaction.secondary_signer_addresses[0].toHexString());
        console.log(180, this.#getCoinTransferArgs(receiversArg, amountArg, commissionArg));
        console.log(181, String.fromCharCode(...memoArg.slice(1)));
    }
}

const aptosPractice = new AptosPractice();
const solanaPractice = new SolanaPractice();

aptosPractice.deserializeTransaction();
// solanaPractice.decodeTransaction();