const R = require('ramda');
const spawn = require('threads').spawn;
const Block = require('../blockchain/block');
const CryptoUtil = require('../util/cryptoUtil');
const Transaction = require('../blockchain/transaction');
const Config = require('../config');

class Miner {
    constructor(blockchain, logLevel) {
        this.blockchain = blockchain;
        this.logLevel = logLevel;
    }
    mine(rewardAddress, feeAddress) {
        // Dynamically obtain the current difficulty
        const currentDifficulty = this.blockchain.getDifficulty();
        
        // Generate new blocks based on the current difficulty
        let baseBlock = Miner.generateNextBlock(rewardAddress, feeAddress, this.blockchain);
        process.execArgv = R.reject((item) => item.includes('debug'), process.execArgv);
    
        /* istanbul ignore next */
        const thread = spawn(function (input, done) {
            /*eslint-disable */
            require(input.__dirname + '/../util/consoleWrapper.js')('mine-worker', input.logLevel);
            const Block = require(input.__dirname + '/../blockchain/block');
            const Miner = require(input.__dirname);
            /*eslint-enable */
    
            done(Miner.proveWorkFor(Block.fromJson(input.jsonBlock), input.difficulty));
        });
    
        const transactionList = R.pipe(
            R.countBy(R.prop('type')),
            R.toString,
            R.replace('{', ''),
            R.replace('}', ''),
            R.replace(/"/g, '')
        )(baseBlock.transactions);
    
        console.info(`Mining a new block with ${baseBlock.transactions.length} (${transactionList}) transactions`);
    
        const promise = thread.promise().then((result) => {
            thread.kill();
    
            // Processing new blocks after mining completion
            const minedBlock = Block.fromJson(result);
            const addedBlock = this.blockchain.addBlock(minedBlock);
    
            // Miner log records
            if (addedBlock) {
                console.info(`Block successfully mined: ${minedBlock.hash}`);
                console.debug(`Block details: ${JSON.stringify(minedBlock)}`);
            } else {
                console.warn('Failed to add mined block to blockchain.');
            }
    
            return addedBlock;
        });
    
        thread.send({
            __dirname: __dirname,
            logLevel: this.logLevel,
            jsonBlock: baseBlock,
            difficulty: currentDifficulty
        });
    
        return promise;
    }
    getDifficulty() {
        if (this.blocks.length < this.adjustmentInterval + 1) {
            return this.difficulty; // In the initial block stage, return the current difficulty level
        }
    
        const length = this.blocks.length;
        const lastBlock = this.blocks[length - 1];
        const adjustmentBlock = this.blocks[length - 1 - this.adjustmentInterval];
    
        const actualTime = lastBlock.timestamp - adjustmentBlock.timestamp;
        const expectedTime = this.adjustmentInterval * this.targetTime;
    
        if (actualTime < expectedTime / 2) {
            return this.difficulty + 1; // increase difficulty
        } else if (actualTime > expectedTime * 2) {
            return Math.max(this.difficulty - 1, 1); // decrease difficulty and not lower than 1
        } else {
            return this.difficulty; // difficulty keep the same
        }
    }
 

    static generateNextBlock(rewardAddress, feeAddress, blockchain) {
        const previousBlock = blockchain.getLastBlock();
        const index = previousBlock.index + 1;
        const previousHash = previousBlock.hash;
        const timestamp = new Date().getTime() / 1000;
        const blocks = blockchain.getAllBlocks();
        const candidateTransactions = blockchain.transactions;
        const transactionsInBlocks = R.flatten(R.map(R.prop('transactions'), blocks));
        const inputTransactionsInTransaction = R.compose(R.flatten, R.map(R.compose(R.prop('inputs'), R.prop('data'))));

        // Select transactions that can be mined         
        let rejectedTransactions = [];
        let selectedTransactions = [];
        R.forEach((transaction) => {
            let negativeOutputsFound = 0;
            let i = 0;
            let outputsLen = transaction.data.outputs.length;

            // Check for negative outputs (avoiding negative transactions or 'stealing')
            for (i = 0; i < outputsLen; i++) {
                if (transaction.data.outputs[i].amount < 0) {
                    negativeOutputsFound++;
                }
            }
            // Check if any of the inputs is found in the selectedTransactions or in the blockchain
            let transactionInputFoundAnywhere = R.map((input) => {
                let findInputTransactionInTransactionList = R.find(
                    R.whereEq({
                        'transaction': input.transaction,
                        'index': input.index
                    }));

                // Find the candidate transaction in the selected transaction list (avoiding double spending)
                let wasItFoundInSelectedTransactions = R.not(R.isNil(findInputTransactionInTransactionList(inputTransactionsInTransaction(selectedTransactions))));

                // Find the candidate transaction in the blockchain (avoiding mining invalid transactions)
                let wasItFoundInBlocks = R.not(R.isNil(findInputTransactionInTransactionList(inputTransactionsInTransaction(transactionsInBlocks))));

                return wasItFoundInSelectedTransactions || wasItFoundInBlocks;
            }, transaction.data.inputs);

            if (R.all(R.equals(false), transactionInputFoundAnywhere)) {
                if (transaction.type === 'regular' && negativeOutputsFound === 0) {
                    selectedTransactions.push(transaction);
                } else if (transaction.type === 'reward') {
                    selectedTransactions.push(transaction);
                } // COMP4142(1) - Add registration
                else if (transaction.type === 'registration'){
                    selectedTransactions.push(transaction);
                }// COMP4142(2) - Add attendance
                else if (transaction.type === 'attendance'){
                    selectedTransactions.push(transaction);
                }
                else if (negativeOutputsFound > 0) {
                    rejectedTransactions.push(transaction);
                }
            } else {
                rejectedTransactions.push(transaction);
            }
        }, candidateTransactions);

        console.info(`Selected ${selectedTransactions.length} candidate transactions with ${rejectedTransactions.length} being rejected.`);

        // Get the first two avaliable transactions, if there aren't TRANSACTIONS_PER_BLOCK, it's empty
        let transactions = R.defaultTo([], R.take(Config.TRANSACTIONS_PER_BLOCK, selectedTransactions));

        // Add fee transaction (1 satoshi per transaction)        
        if (transactions.length > 0) {
            let feeTransaction = Transaction.fromJson({
                id: CryptoUtil.randomId(64),
                hash: null,
                type: 'fee',
                data: {
                    inputs: [],
                    outputs: [
                        {
                            amount: 0, // COMP4142 
                            // amount: Config.FEE_PER_TRANSACTION * transactions.length, // satoshis format
                            address: feeAddress, // INFO: Usually here is a locking script (to check who and when this transaction output can be used), in this case it's a simple destination address 
                        }
                    ]
                }
            });

            transactions.push(feeTransaction);
        }

        // Add reward transaction of 50 coins
        if (rewardAddress != null) {
            let rewardTransaction = Transaction.fromJson({
                id: CryptoUtil.randomId(64),
                hash: null,
                type: 'reward',
                data: {
                    inputs: [],
                    outputs: [
                        {
                            amount: Config.MINING_REWARD, // satoshis format
                            address: rewardAddress, // INFO: Usually here is a locking script (to check who and when this transaction output can be used), in this case it's a simple destination address 
                        }
                    ]
                }
            });

            transactions.push(rewardTransaction);
        }

        return Block.fromJson({
            index,
            nonce: 0,
            previousHash,
            timestamp,
            transactions
        });
    }

    /* istanbul ignore next */
    static proveWorkFor(jsonBlock, difficulty) {
        let blockDifficulty = null;
        let start = process.hrtime();
        let block = Block.fromJson(jsonBlock);

        // INFO: Every cryptocurrency has a different way to prove work, this is a simple hash sequence

        // Loop incrementing the nonce to find the hash at desired difficulty
        do {
            block.timestamp = new Date().getTime() / 1000;
            block.nonce++;
            block.hash = block.toHash();
            blockDifficulty = block.getDifficulty();
        } while (blockDifficulty >= difficulty);
        console.info(`Block found: time '${process.hrtime(start)[0]} sec' dif '${difficulty}' hash '${block.hash}' nonce '${block.nonce}'`);
        return block;
    }
}

module.exports = Miner;
