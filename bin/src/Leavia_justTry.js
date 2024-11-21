//version 1
// const Operator = require('../../lib/operator'); 
// const Blockchain = require('../../lib/blockchain');
// const Miner = require('../../lib/miner');
// const Node = require('../../lib/node');
// const CryptoUtil = require('../../lib/util/cryptoUtil');
// const CryptoEdDSAUtil = require('../../lib/util/cryptoEdDSAUtil');
// const Transaction = require('../../lib/blockchain/transaction');
// const prompt = require("prompt-sync")();

// // Attendance Certificate Class
// class AttendanceCertificate {
//     constructor(studentId, courseId, timestamp) {
//         this.studentId = studentId;
//         this.courseId = courseId;
//         this.timestamp = timestamp;
//     }

//     toJSON() {
//         return {
//             studentId: this.studentId,
//             courseId: this.courseId,
//             timestamp: this.timestamp
//         };
//     }
// }

// // Function to create attendance certificate
// function createAttendanceCertificate(studentId, eventId, timestamp) {
//     return new AttendanceCertificate(studentId, eventId, timestamp);
// }

// // 1. Registration of Blockchain & Wallet
// let studentID = '20063043d';
// let walletPassword = 'qwer123456';
// let operator = new Operator('walletDb', new Blockchain(studentID)); // 使用 Operator 创建操作类
// let myWallet = operator.createWalletFromPassword(walletPassword);
// let myPublicKey = myWallet.generateAddress();
// let blockchain = new Blockchain(studentID + myPublicKey);
// let miner = new Miner(blockchain);
// let node = new Node(blockchain);

// // View my wallet
// console.log("Public key: " + myPublicKey); // Public Key or Address
// console.log("Private key: " + myWallet.getSecretKeyByAddress(myPublicKey)); // Private Key
// console.log("Balance: " + operator.getBalanceForWallet(myWallet.id)); // 使用 Operator 获取余额

// // 2a. Generation of attendance cert
// let attendTime = Date.now();
// let eventId = 'EVENT123'; // 事件ID, later change to courseId
// let attendanceCertificate = createAttendanceCertificate(studentID, eventId, attendTime);
// let message = JSON.stringify(attendanceCertificate.toJSON()); // Convert to JSON string for signing

// // Print the Attendance Cert, and request user for signing
// console.log("Attendance Certificate: ", message);
// let inputPrivateKey = prompt("Please input your private key for signature: ");

// // Encryption of signature
// let messageHash = CryptoUtil.hash(message);
// let tempKeyPair = CryptoEdDSAUtil.generateKeyPairFromSecret(inputPrivateKey);
// let signature = CryptoEdDSAUtil.signHash(tempKeyPair, messageHash);

// // Signature checking
// let valid = CryptoEdDSAUtil.verifySignature(myPublicKey, signature, messageHash);

// // if (!valid) {
// //     console.log("签名无效，不能添加到区块链");
// //     return;
// // }

// // Final message with signature
// let cipher = message + "; Signature: " + signature;

// // Add transaction for attendance certificate
// blockchain.addTransaction(Transaction.fromJson({
//     id: CryptoUtil.randomId(64),
//     hash: null,
//     type: 'ATTENDANCE_CERTIFICATE',
//     data: cipher,
// }));

// let newblock = miner.mine(myPublicKey);
// node.checkReceivedBlocks(newblock);

// // Optionally, further transactions or operations can be performed here

// // Broadcast the mining results to other users (if needed)



// version 2
const Operator = require('../../lib/operator'); 
const Blockchain = require('../../lib/blockchain');
const Miner = require('../../lib/miner');
const Node = require('../../lib/node');
const CryptoUtil = require('../../lib/util/cryptoUtil');
const CryptoEdDSAUtil = require('../../lib/util/cryptoEdDSAUtil');
const Transaction = require('../../lib/blockchain/transaction');
const prompt = require("prompt-sync")();

// Attendance Certificate Class
class AttendanceCertificate {
    constructor(studentId, courseId, timestamp) {
        this.studentId = studentId;
        this.courseId = courseId;
        this.timestamp = timestamp;
    }

    toJSON() {
        return {
            studentId: this.studentId,
            courseId: this.courseId,
            timestamp: this.timestamp
        };
    }
}

// Function to create attendance certificate
function createAttendanceCertificate(studentId, courseId, timestamp) {
    return new AttendanceCertificate(studentId, courseId, timestamp);
}

// 使用已有的 walletId 和 blockchain
let studentID = '20063043d';
let walletPassword = 'qwer123456';
let operator = new Operator('walletDb', new Blockchain(studentID));
let myWallet = operator.getWalletById('已存在的钱包ID'); // 替换为实际的钱包ID
let myPublicKey = myWallet.generateAddress();
let blockchain = operator.blockchain; // 使用已有的区块链
let miner = new Miner(blockchain);
let node = new Node(blockchain);

// View my wallet
console.log("Public key: " + myPublicKey); // Public Key or Address
console.log("Private key: " + myWallet.getSecretKeyByAddress(myPublicKey)); // Private Key
console.log("Balance: " + operator.getBalanceForWallet(myWallet.id)); // 使用 Operator 获取余额

// 2a. Generation of attendance cert
let attendTime = Date.now();
let courseId = prompt("请输课程 ID："); // 要求用户输入课程 ID
let attendanceCertificate = createAttendanceCertificate(studentID, courseId, attendTime);
let message = JSON.stringify(attendanceCertificate.toJSON()); // Convert to JSON string for signing

// Print the Attendance Cert, and request user for signing
console.log("Attendance Certificate: ", message);
let inputPrivateKey = prompt("Please input your private key for signature: ");

// Encryption of signature
let messageHash = CryptoUtil.hash(message);
let tempKeyPair = CryptoEdDSAUtil.generateKeyPairFromSecret(inputPrivateKey);
let signature = CryptoEdDSAUtil.signHash(tempKeyPair, messageHash);

// Signature checking
let valid = CryptoEdDSAUtil.verifySignature(myPublicKey, signature, messageHash);
if (!valid) {
    console.log("签名无效，不能添加到区块链");
    return;
}

// Final message with signature
let cipher = message + "; Signature: " + signature;

// Add transaction for attendance certificate
blockchain.addTransaction(Transaction.fromJson({
    id: CryptoUtil.randomId(64),
    hash: null,
    type: 'ATTENDANCE_CERTIFICATE',
    data: cipher,
}));

let newblock = miner.mine(myPublicKey);
node.checkReceivedBlocks(newblock);

// Optionally, further transactions or operations can be performed here

// Broadcast the mining results to other users (if needed)
