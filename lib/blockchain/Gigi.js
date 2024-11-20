//1.
const Wallet = require('./operator/wallet');
const prompt = require("prompt-sync")();
const Blockchain = require('./blockchain/index');


class Student{

    constructor(studentID,password) {
        this.studentID = studentID;
        this.wallet = Wallet.fromPassword(password);
        this.publicKey = this.wallet.generateAddress();
        this.privateKey = this.wallet.getSecretKeyByAddress(publicKey);
        this.blockchain = new Blockchain(studentID);
        this.blockchain.updateStudentIDnPK(studentID, publicKey);
    }

    //在main直接询问学生info
    // studentID = prompt("Please enter your Student ID: ")
    // password = prompt("Please enter your password:")
    // Candice = new Student（studentID, password）;

}
module.exports = Student;
