1. For user 1, run a node in terminal:
node bin/naivecoin.js -p 7001 --name 33

2. For user 2, run the second node and add peers:
node bin/naivecoin.js -p 7002 --name 44 --peers http://localhost:7001

3. For each user, open a new terminal. Run the below command to start the app (), e.g.:
node bin/main.js -p 7001 -n 33
node bin/main.js -p 3002 -n 2


4. Record query
{
  "id": "95bbb4d616d599a06bcac03db53d7dceaf5ee0082f571a9684e64bb7a7b77983",
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



