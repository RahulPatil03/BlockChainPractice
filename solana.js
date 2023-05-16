import { Connection, Keypair, SystemProgram, Transaction, clusterApiUrl, sendAndConfirmTransaction, PublicKey } from '@solana/web3.js';

export default class Solana {
    connection = new Connection(clusterApiUrl('devnet')); // A connection to a fullnode JSON RPC endpoint

    getKeypairFromSecretKey(secretKey) {
        return Keypair.fromSecretKey(secretKey); // Create a keypair from a raw secret key byte array
    }

    generateKeypair() {
        return Keypair.generate(); // Generate a new random keypair
    }

    requestAirdrop(to, lamports) {
        return this.connection.requestAirdrop(to, lamports); // Request an allocation of lamports to the specified address
    }

    confirmTransaction(signature) {
        return this.connection.confirmTransaction({ signature });
    }

    getNewTransaction() {
        return new Transaction(); // Transaction class
    }

    getTransferInstruction(fromPubkey, toPubkey, lamports) {
        return SystemProgram.transfer({ // Generate a transaction instruction that transfers lamports from one account to another
            fromPubkey, // Account that will transfer lamports
            toPubkey, // Account that will receive transferred lamports
            lamports, // Amount of lamports to transfer
        });
    }

    sendTransaction(connection, transaction, keypair) {
        return sendAndConfirmTransaction(connection, transaction, [keypair]); // Sign, send and confirm a transaction
    }
}