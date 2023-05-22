import { createAssociatedTokenAccountInstruction, createTransferInstruction, getAssociatedTokenAddressSync } from '@solana/spl-token';
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction, clusterApiUrl, sendAndConfirmTransaction } from '@solana/web3.js';
import bs58 from 'bs58';

export default class Solana {
    #mint;
    #tokenProgramId;
    #associatedTokenProgramId;
    #memoProgramId;

    constructor() {
        this.connection = new Connection(process.env.solanaEndpoint || clusterApiUrl('devnet')); // A connection to a fullnode JSON RPC endpoint
        this.admin = this.keypairFromSecretKey(process.env.solanaAdminSecretKey); // Payer Account
        this.#mint = new PublicKey('7gjQaUHVdP8m7BvrFWyPkM7L3H9p4umwm3F56q1qyLk1'); // Go Xo Yo 1 Token Mint Address
        this.#tokenProgramId = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') // Token Program Address
        this.#associatedTokenProgramId = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'); // Associated Token Program Address
        this.#memoProgramId = new PublicKey('Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo'); //Memo Program Address
    }

    keypairFromSecretKey(secretKey) {
        return Keypair.fromSecretKey( // Create a keypair from a raw secret key byte array
            Uint8Array.from(bs58.decode(secretKey)) // secret key byte array
        );
    }

    getAssociatedTokenAddress(owner) {
        return getAssociatedTokenAddressSync( // Get the address of the associated token account for a given mint and owner
            this.#mint, // Token mint account
            new PublicKey(owner), // Owner of the new account
            false, // Allow the owner account to be a PDA (Program Derived Address)
            this.#tokenProgramId, // SPL Token program account
            this.#associatedTokenProgramId // SPL Associated Token program account
        );
    }

    newTransaction(blockhash, lastValidBlockHeight) {
        return new Transaction({ // Get New Transaction Object
            feePayer: this.admin.publicKey, // The transaction fee payer
            blockhash, // A recent blockhash
            lastValidBlockHeight // the last block chain can advance to before tx is exportd expired
        });
    }

    deserializeTransaction(serializedTransaction) {
        return Transaction.from( // Parse a wire transaction into a Transaction object
            Buffer.from(serializedTransaction, 'base64') // Creates a new Buffer containing the given JavaScript string {str}
        );
    }

    transferLamportsInstruction(fromPubkey, toPubkey, lamports) {
        return SystemProgram.transfer({ // Generate a transaction instruction that transfers lamports from one account to another
            fromPubkey: new PublicKey(fromPubkey), // Account that will transfer lamports
            toPubkey: new PublicKey(toPubkey), // Account that will receive transferred lamports
            lamports, // Amount of lamports to transfer
        });
    }

    createAssociatedTokenAccountInstruction(associatedToken, owner) {
        return createAssociatedTokenAccountInstruction( // Construct a CreateAssociatedTokenAccount instruction
            this.admin.publicKey, // Payer of the initialization fees
            associatedToken, // New associated token account
            new PublicKey(owner), // Owner of the new account
            this.#mint, // Token mint account
            this.#tokenProgramId, // SPL Token program account
            this.#associatedTokenProgramId // SPL Associated Token program account
        );
    }

    transferTokensInstruction(source, destination, owner, amount) {
        return createTransferInstruction( // Construct a Transfer instruction
            source, // Source account
            destination, // Destination account
            new PublicKey(owner), // Owner of the source account
            amount, // Number of tokens to transfer
            undefined, // Signing accounts if `owner` is a multisig
            this.#tokenProgramId // SPL Token program account
        );
    }

    memoInstruction(data) {
        return new TransactionInstruction({ // Returns a new Transaction Instruction
            keys: [], // Public keys to include in this transaction Boolean represents whether this pubkey needs to sign the transaction
            data: Buffer.from(data), // Program input
            programId: this.#memoProgramId // Program Id to execute
        });
    }

    sendAndConfirmTransaction(transaction, signer) {
        return sendAndConfirmTransaction(this.connection, transaction, [this.admin, signer]); // Sign, send and confirm a transaction
    }
}