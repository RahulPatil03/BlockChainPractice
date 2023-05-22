import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
// import { AptosChingari, AptosChingariTransactions, AptosChingariNFT, getAptosAccount, deserializeMultiAgentRawTransaction } from 'aptos';
const { AptosChingari, AptosChingariTransactions, AptosChingariNFT, getAptosAccount, deserializeMultiAgentRawTransaction } = require('aptos');

export default class Aptos {
    #coinType;
    #adminAddress;
    #chingariClient;
    #aptosChingariTransactions;
    #aptosChingariNFT;

    constructor() {
        this.#coinType = '0xe60c54467e4c094cee951fde4a018ce1504f3b0f09ed86e6c8d9811771c6b1f0::coin::T';
        this.#adminAddress = this.getAddressFromPrivateKey(process.env.aptosAdminPrivateKey);
        this.#chingariClient = new AptosChingari(process.env.aptosConnectionURL);
        this.#aptosChingariTransactions = new AptosChingariTransactions();
        this.#aptosChingariNFT = new AptosChingariNFT();
    }

    getAddressFromPrivateKey(privateKey) {
        return getAptosAccount({ privateKey }).address().hex();
    }

    getNewAccount() {
        return this.#aptosChingariTransactions.createAndSendNewAccountTransaction({
            chingariClient: this.#chingariClient,
            senderPrivateKey: process.env.aptosAdminPrivateKey,
            simulation: true
        })
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
            feePayer: this.#adminAddress,
            coinType: this.#coinType,
            accountAddress,
            memo: 'Block-Chain-Practice Gari Registration'
        });
    }

    rawTransactionCoinTransfer(from, to, amount, commission, memo) {
        return this.#aptosChingariTransactions.rawTransactionCoinTransferMultiple({
            chingariClient: this.#chingariClient,
            feePayer: this.#adminAddress,
            coinType: this.#coinType,
            from,
            to,
            amount,
            commission,
            memo,
            count: to.length,
            ignoreUnregistered: false,
        });
    }

    rawTransactionMintBadge(userAddress) {
        return this.#aptosChingariNFT.mintBadge({
            chingariClient: this.#chingariClient,
            adminAddress: this.#adminAddress,
            coinType: this.#coinType,
            tokenName: 'Iron Creator',
            userAddress,
            price: 10000000,
            memo: 'Block-Chain-Practice Mint Badge Test'
        })
    }

    rawTransactionUpgradeBadge(userAddress) {
        return this.#aptosChingariNFT.upgradeBadge({
            chingariClient: this.#chingariClient,
            adminAddress: this.#adminAddress,
            coinType: this.#coinType,
            oldBadgeName: 'Iron Creator',
            oldBadgePropertyVersion: 1,
            price: 10000000,
            tokenName: 'Bronze Creator',
            userAddress,
            memo: 'Block-Chain-Practice Upgrade Badge Test',
            oldBadgeCollection: 'Gari Badges',
            oldBadgeCreatorAddress: '0x9c5947d235fca8af0ed9c90dca50196c112dac407eb19d87d9287db93d7e2d51',
            isFree: false,
        })
    }

    getTransactionAuthentication(rawTransaction, senderAddress, signerPrivateKey = process.env.aptosAdminPrivateKey) {
        return this.#aptosChingariTransactions.getTransactionAuthenticationFromSigners(
            rawTransaction,
            [senderAddress],
            signerPrivateKey
        );
    }

    getDeserializedTransaction(multiAgentTxnBase64) {
        return deserializeMultiAgentRawTransaction({ multiAgentTxnBase64 });
    }

    getTransactionDetails(signature) {
        return this.#chingariClient.getTransactionDetail(signature);
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
