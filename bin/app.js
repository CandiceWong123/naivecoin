const { exec } = require('child_process');
const CryptoUtil = require('../lib/util/cryptoUtil');
const Wallet = require('../lib/operator/wallet');
const prompt = require("prompt-sync")();
const OPERATOR_FILE = 'wallets.json';
const Db = require('../lib/util/db');
const Wallets = require('../lib/operator/wallets');


class App {
    constructor(port, dbName) {
        this.PORT = port;
        this.db = new Db('data/' + dbName + '/' + OPERATOR_FILE, new Wallets());
        this.wallet = new Wallet();
    }

    creatStudentWallet(studentId) {
        return new Promise((resolve, reject) => {

            // Get all wallets. See if any wallet has been registered.
            exec(`curl -s -X GET --header 'Accept: application/json' 'http://localhost:${this.PORT}/operator/wallets'`, (error, stdout, stderr) => {

                // If there is no wallet, register one.
                if (stdout == "[]") {
                    let password = prompt("Please input your password: ");
                    // Generate wallet from password
                    exec(`curl -s -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' -d '{"password": "${password}"}' 'http://localhost:${this.PORT}/operator/wallets'`, (error, stdout, stderr) => {

                        if (stdout) {
                            // Get Wallet ID
                            this.wallet.id = JSON.parse(stdout).id; 

                            // Generate keypairs (public key and secret key)
                            exec(`curl -s -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' --header 'password: ${password}' 'http://localhost:${this.PORT}/operator/wallets/${this.wallet.id}/addresses'`, (error, stdout, stderr) => {

                                if (stdout) {
                                    // Get the wallet
                                    this.wallet = JSON.parse(JSON.stringify(this.db.read(Wallets)[0]));
                                    console.log(this.wallet);
                                    let pk = this.wallet.keyPairs[0].publicKey;

                                    // Create transaction in the type of "registration" containing student ID and public key. Mine into blockchain
                                    exec(`curl -s -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' -d '{"studentId": "${studentId}","publicKey": "${pk}"}' 'http://localhost:${this.PORT}/blockchain/registration'`, (error, stdout, stderr) => {

                                        if (stdout) {
                                            exec(`curl -s -X POST --header 'Content-Type: application/json' -d '{ "rewardAddress":"${pk}" }' 'http://localhost:${this.PORT}/miner/mine'`, (error, stdout, stderr) => {
                                        
                                                if (stdout) {
                                                    console.log("Student ID and public key is registered into blockchain.");
                                                    // resolve(this.wallet);
                                                    resolve(true);
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                } else {
                    // If there has been a wallet, ask user to login to the wallet
                    this.wallet = JSON.parse(JSON.stringify(this.db.read(Wallets)[0]));
                    let inputPassword = prompt("Please input your password: ");

                    // Verify the user password
                    if (this.wallet.passwordHash === CryptoUtil.hash(inputPassword)) {
                        console.log("Correct password.");
                        resolve(true);
                    } else {
                        console.log("Incorrect password.");
                        resolve(false);
                    }
                }
            });
        });
    }

    creatAttendanceCert(studentId){
        return new Promise((resolve, reject) => {

            // Ask for the course Id (as the event Id)
            let courseId = prompt("Please input the course ID:");

            // Generation of attendance certificate
            exec(`curl -s -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' -d '{"studentId": "${studentId}","eventId": "${courseId}"}' 'http://localhost:${this.PORT}/operator/generateAttendanceCert'`, (error, stdout, stderr) => {
                let certificate = stdout;
                console.log("The unsigned attandence certificate:");
                console.log(JSON.parse(stdout));

                if(stdout){
                    // Signing on attendance certificate
                    let inputSecretKey = prompt("Please confirm with the certificate.\nIf yes, input the secert key. If no, input 'no'\n");

                    if (inputSecretKey != 'no'){
                        exec(`curl -s -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' -d '{"attendanceCert": ${certificate},"addressId": "${this.wallet.keyPairs[0].publicKey}","secretKey": "${inputSecretKey}"}' 'http://localhost:${this.PORT}/operator/signAttendanceCert'`, (error, stdout, stderr) => {
                            if(stdout){
                                certificate = stdout;
                                console.log("The signed attandence certificate:");
                                console.log(JSON.parse(stdout));

                                // create a unconfirmed transaction in the type of "attendance" + checking signature
                                exec(`curl -s -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' -d '${certificate}' 'http://localhost:${this.PORT}/blockchain/addAttendanceTransaction'`, (error, stdout, stderr) => {
                                    if(stdout){
                                        console.log("The attendance is added into transaction db.");
                                    }else{
                                        console.log("Transaction failed. Please check the validity of signature");
                                    }
                                    resolve();
                                });  
                            };
                        });  
                    }else{
                        console.log("The attendance certificate is discarded.");
                        resolve();
                    }        
                };
            });
        });
    }

    mineAttendanceCert(){
        return new Promise((resolve, reject) => {

            // get all unconfirmed transaction (attendance certificate)
            exec(`curl -s -X GET --header 'Accept: application/json' 'http://localhost:${this.PORT}/blockchain/transactions'`, (error, stdout, stderr) => {
                if (stdout == "[]"){
                    console.log("No unmined attandance certificate.")
                    resolve();
                }
                else{                
                    // mine unconfirmed transactions
                    exec(`curl -s -X POST --header 'Content-Type: application/json' -d '{ "rewardAddress":"${this.wallet.keyPairs[0].publicKey}" }' 'http://localhost:${this.PORT}/miner/mine'`, (error, stdout, stderr) => {
                        if (stdout){
                            console.log("A block containing valid attendance certificates has been mined into blockchain.\nMining rewards are saved into your wallet.")
                            
                            // get wallet balance
                            exec(`curl -s -X GET --header 'Accept: application/json' 'http://localhost:${this.PORT}/operator/${this.wallet.keyPairs[0].publicKey}/balance'`, (error, stdout, stderr) => {
                                if (stdout){
                                    console.log(`Balance: ${JSON.parse(stdout).balance}`)
                                }else{
                                    console.log("Retrival of balance fails.");
                                }
                                resolve();
                            });
                        }else{
                            console.log("Mining fails.")
                            resolve();
                        }
                    });
                }
            });
        });
    }

    viewWallet(){
        return new Promise((resolve, reject) => {
            // get wallet balance
            exec(`curl -s -X GET --header 'Accept: application/json' 'http://localhost:${this.PORT}/operator/${this.wallet.keyPairs[0].publicKey}/balance'`, (error, stdout, stderr) => {
                if (stdout){
                    let message = 
                    `Wallet Id: ${this.wallet.id}\n`+
                    `Public key: ${this.wallet.keyPairs[0].publicKey}\n`+
                    `Secret key: ${this.wallet.keyPairs[0].secretKey}\n`+
                    `Balance: ${JSON.parse(stdout).balance}`;       
                    console.log(message);
                }else{
                    console.log("Retrival of balance fails.");
                }
                resolve();
            });
        });
    }

    getMenu(){
        let list = 
        "**************************\n"+
        "0. Exit\n"+
        "1. Create attendance\n"+
        "2. Mine attendance\n"+
        "3. View wallet\n"+
        "**************************";
        console.log(list);
    }
}
module.exports = App;