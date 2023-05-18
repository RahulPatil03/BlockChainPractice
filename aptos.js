import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
// import { AptosChingari, AptosChingariTransactions, AptosChingariNFT, getAptosAccount } from 'aptos';
const { AptosChingari, AptosChingariTransactions, AptosChingariNFT, getAptosAccount } = require('aptos');

export default class Aptos {
    #chingariClient;
    #aptosChingariTransactions;
    #aptosChingariNFT;
    #feePayer;
    #coinType;

    constructor() {
        this.#chingariClient = new AptosChingari(process.env.aptosConnectionURL);
        this.#aptosChingariTransactions = new AptosChingariTransactions();
        this.#aptosChingariNFT = new AptosChingariNFT();
        this.#feePayer = this.getAptosAccountFromPrivateKey(process.env.aptosFeePayerPrivateKey);
        this.#coinType = '0xe60c54467e4c094cee951fde4a018ce1504f3b0f09ed86e6c8d9811771c6b1f0::coin::T';
    }

    getAptosAccountFromPrivateKey(privateKey) {
        return getAptosAccount({ privateKey }).toPrivateKeyObject();
    }

    async rawTransactionTokenRegistration(accountAddress) {
        return this.#aptosChingariTransactions.registerTokenToAddress({
            chingariClient: this.#chingariClient,
            accountAddress,
            feePayer: this.#feePayer.address,
            coinType: this.#coinType,
            memo: 'Block-Chain-Practice Gari Registration'
        });
    }

    async getTransactionAuthentication(rawTransaction, senderAddress, signerPrivateKey = this.#feePayer.privateKeyHex.substring(2)) {
        return this.#aptosChingariTransactions.getTransactionAuthenticationFromSigners(
            rawTransaction,
            [senderAddress],
            signerPrivateKey
        );
    }

    async submitMultiAgentTransaction(rawTx, payerAuth, senderAccount, senderAuth) {
        return this.#chingariClient.createMultiAgentTXAndSubmit(
            rawTx,
            payerAuth,
            senderAccount,
            senderAuth,
            true
        );
    }
}
