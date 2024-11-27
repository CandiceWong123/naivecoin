1. Run a node:
For user 1:
node bin/naivecoin.js -p 3001 --name a

For user 2 (peers):
node bin/naivecoin.js -p 3002 --name b --peers http://localhost:3001

Swagger API:
http://localhost:3001/api-docs/


2. Student Registration (start the application with the below command)
node bin/main.js -p 3001 -n a
node bin/main.js -p 3002 -n b

A wallet will be generated. 
Information will be crafted into a Trasaction (type:"registration") and mined into blockchain.


3. Attendance Record
In the app, choose to implement the "1. Create attendance" and input the Course Id.
For signing the attendance certificate, input your corret secret key.
Attendance information containing signature will be crafted into a Trasaction (type:"attendance").
Signature will be verified by the app and then be written into ./data/transactions DB.


4. Mining
In the app, choose to implement the "2. Mine attendance".
If there has been attendance stored in the ./data/transactions DB,
it should be mined and available to be found in self/peer's blockchain.


5. Record query
Open the Swagger API, find out the section "attendance" -> "POST /blockchain/attendance":
For testing, we directly post a transaction (the below example) and it will be written into ./data/transactions DB.

{
  "id": "95bbb4d616d599a06bcac03db53d7dceaf5ee0082f571a9684e64bb7a7b88888",
  "hash": "fbfa6893ff3b7e3c47e3793aa7af2a4b3c2bd1130090a53d27c07cecc10a2e01",
  "type": "attendance",
  "data": {
    "inputs": [],
    "outputs": [
      {
        "timestamp": "Tue Nov 26 2024 18:39:46 GMT+0800 (Hong Kong Standard Time)",
        "studentId": "20063043d",
        "course": "COMP4142",
        "signature": "9192b17d8d94a4f7edc1f8c8cd01e5fc1f3822dcac9c8c9becaedd6caa99317068dc5f5e3b829379c1e6666c6363cbfc2b34bbc08fc7877fdb6119138761960e",
        "address": "abbe29eb618ea8fd8e138f29511846e899198aac30bf67627a1655186116f1a4",
        "amount": 0
      }
    ]
  }
}

To get the record, find out the section "attendance" -> "GET /blockchain/attendance/{transactionId}":
Paste the transactionId and the server should response the corresponding record.


6. Forking handling
Open the Swagger API, find out the section "blockchain" -> "POST /blockchain/fork". 
Suppose there are two blocks forked from the same previous block. 
The program should replace the blockchain after the comparision with forks. 
And return HTTP status code 200 to show there is no fork now. 

{
  "blocks": [
    {
      "index": 0,
      "previousHash": "genesis-hash",
      "timestamp": 1615289712031,
      "data": "Genesis Block",
      "hash": "genesis-hash"
    },
    {
      "index": 1,
      "previousHash": "genesis-hash",
      "timestamp": 1615289712032,
      "data": "Block 1 Data",
      "hash": "block1-hash"
    },
    {
      "index": 2,
      "previousHash": "block1-hash",
      "timestamp": 1615289712033,
      "data": "Block 2 Data (Competing)",
      "hash": "block2-competing-hash"
    }
  ]
}

In the situation that the block contains invalid previous hash, it will return HTTP status code 500.

{
  "blocks": [
    {
      "index": 0,
      "previousHash": "genesis-hash",
      "timestamp": 1615289712031,
      "data": "Genesis Block",
      "hash": "genesis-hash"
    },
    {
      "index": 1,
      "previousHash": "invalid-hash",  // Invalid previous hash value
      "timestamp": 1615289712032,
      "data": "Block 1 Data",
      "hash": "block1-hash"
    }
  ]
}


