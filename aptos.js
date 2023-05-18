import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
// import { AptosChingari, AptosChingariTransactions, AptosChingariNFT, getAptosAccount } from 'aptos';
const { AptosChingari, AptosChingariTransactions, AptosChingariNFT, getAptosAccount } = require('aptos');

export default class Aptos {
    constructor() {
        this.chingariClient = new AptosChingari(process.env.aptosConnectionURL);
        this.aptosChingariTransaction = new AptosChingariTransactions();
        this.aptosChingariNFT = new AptosChingariNFT();
        this.feePayer = getAptosAccount({ privateKey: process.env.aptosFeePayerPrivateKey.substring(2) });
        this.coinType = '0xe60c54467e4c094cee951fde4a018ce1504f3b0f09ed86e6c8d9811771c6b1f0::coin::T';
    }
}
