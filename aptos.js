import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
// import { AptosChingari, AptosChingariTransactions, AptosChingariNFT, getAptosAccount, deserializeMultiAgentRawTransaction } from 'aptos';
const { AptosChingari, AptosChingariTransactions, AptosChingariNFT, getAptosAccount, deserializeMultiAgentRawTransaction } = require('aptos');

export default class Aptos {
    #chingariClient;
    #aptosChingariTransactions;
    #aptosChingariNFT;
    #feePayer;
    #coinType;

    constructor() {
        this.#feePayer = this.getAptosAccountFromPrivateKey(process.env.aptosFeePayerPrivateKey);
        this.#coinType = '0xe60c54467e4c094cee951fde4a018ce1504f3b0f09ed86e6c8d9811771c6b1f0::coin::T';
        this.#chingariClient = new AptosChingari(process.env.aptosConnectionURL);
        this.#aptosChingariTransactions = new AptosChingariTransactions();
        this.#aptosChingariNFT = new AptosChingariNFT();
    }

    getAptosAccountFromPrivateKey(privateKey) {
        return getAptosAccount({ privateKey }).toPrivateKeyObject();
    }

    isUserRegistered(address) {
        return this.#chingariClient.checkUserRegistered(address, this.#coinType);
    }

    getTokenBalance(address) {
        return this.#chingariClient.getTokenBalance(address, this.#coinType);
    }

    rawTransactionTokenRegistration(accountAddress) {
        return this.#aptosChingariTransactions.registerTokenToAddress({
            chingariClient: this.#chingariClient,
            feePayer: this.#feePayer.address,
            coinType: this.#coinType,
            accountAddress,
            memo: 'Block-Chain-Practice Gari Registration'
        });
    }

    rawTransactionCoinTransfer(from, to, amount, commission, memo) {
        return this.#aptosChingariTransactions.rawTransactionCoinTransferMultiple({
            chingariClient: this.#chingariClient,
            feePayer: this.#feePayer.address,
            coinType: this.#coinType,
            from,
            to,
            amount,
            commission,
            memo,
            count: to.length,
        });
    }

    rawTransactionMintBadge(userAddress) {
        return this.#aptosChingariNFT.mintBadge({
            chingariClient: this.#chingariClient,
            adminAddress: this.#feePayer.address,
            coinType: this.#coinType,
            tokenName: 'Test Badge 1',
            userAddress,
            price: 10000000,
            memo: 'Block-Chain-Practice Mint Badge Test'
        })
    }

    getTransactionAuthentication(rawTransaction, senderAddress, signerPrivateKey = this.#feePayer.privateKeyHex.substring(2)) {
        return this.#aptosChingariTransactions.getTransactionAuthenticationFromSigners(
            rawTransaction,
            [senderAddress],
            signerPrivateKey
        );
    }

    getDeserializedTransaction(multiAgentTxnBase64) {
        return deserializeMultiAgentRawTransaction({ multiAgentTxnBase64 });
    }

    submitMultiAgentTransaction(rawTx, payerAuth, senderAccount, senderAuth) {
        return this.#chingariClient.createMultiAgentTXAndSubmit(
            rawTx,
            payerAuth,
            senderAccount,
            senderAuth,
            true
        );
    }
}
