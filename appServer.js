var express       = require('express');                       
var bodyParser    = require('body-parser');
var http          = require('http')
var fs            = require('fs');
var Fabric_Client = require('fabric-client');
var Fabric_CA_Client = require('fabric-ca-client');
var path          = require('path');
var util          = require('util');
var os            = require('os');
var request       = require("request");

var app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


//ChainCode Functions

app.get('/api/v1/verify_heat_map/:hm', async function(req, res){
    console.log("Verifying heatmap...");
        var hm = req.params.hm

		var fabric_client = new Fabric_Client();
		var channel = fabric_client.newChannel('memmap');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);
		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
	
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);

		    return fabric_client.getUserContext(user1, true);
		}).then((user_from_store) => {
            //VERIFY USER AND PROPOSE TRANSACTION
		    if (user_from_store && user_from_store.isEnrolled()) {
		        console.log('Successfully loaded user...');
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get user....');
		    }

		    const request = {
                chaincodeId: 'BFT',
                txId: tx_id,
                fcn: 'verifyHeatMap',
                args: [hm]
            };
        
            //SEND QUERY TO CHAINCODE
            return channel.queryByChaincode(request);
        }).then((query_responses) => {
            // INFORM CALLING FUNCTION OF RESULT
            console.log("Query has completed...");
            if (query_responses && query_responses.length == 1) {
                if (query_responses[0] instanceof Error) {
                    console.error("error from query = ", query_responses[0]);
                } else {
                    console.log("Response is ", query_responses[0].toString());
                    res.send(query_responses[0].toString())
                }
            } else {
                console.log("No payloads were returned from query...");
            }
        }).catch((err) => {
            console.error('Failed to query successfully :: ' + err);
        });

    
});  

app.post('/api/v1/add_heat_map/', async function(req, res){
    console.log("Submiting heatmap... ");
    
    var user = req.body.user
    var name = req.body.name
    var data = req.body.data


    var fabric_client = new Fabric_Client();
    var channel = fabric_client.newChannel('memmap');
    var peer = fabric_client.newPeer('grpc://localhost:7051');
    channel.addPeer(peer);
    var order = fabric_client.newOrderer('grpc://localhost:7050')
    channel.addOrderer(order);
    
    var member_user = null;
    var store_path = path.join(os.homedir(), '.hfc-key-store');
    var tx_id = null;

    // create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
    Fabric_Client.newDefaultKeyValueStore({ path: store_path
    }).then((state_store) => {

        fabric_client.setStateStore(state_store);
        var crypto_suite = Fabric_Client.newCryptoSuite();
        var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
        crypto_suite.setCryptoKeyStore(crypto_store);
        fabric_client.setCryptoSuite(crypto_suite);

        return fabric_client.getUserContext(user, true);
    }).then((user_from_store) => {
        //VERIFY USER AND PROPOSE TRANSACTION
        if (user_from_store && user_from_store.isEnrolled()) {
            console.log('Successfully loaded user...');
            member_user = user_from_store;
        } else {
            throw new Error('Failed to get user....');
        }

        tx_id = fabric_client.newTransactionID();
        console.log("Assigning transaction ID: ", tx_id._transaction_id);
        const request = {
            chaincodeId: 'BFT',
            fcn: 'addHeatMap',
            args: [name, data],
            chainId: 'memmap',
            txId: tx_id
        };

        return channel.sendTransactionProposal(request);
    }).then((results) => {
        //COLLECT RESPONSES
        var proposalResponses = results[0];
        var proposal = results[1];
        let isProposalGood = false;
        if (proposalResponses && proposalResponses[0].response &&
            proposalResponses[0].response.status === 200) {
                isProposalGood = true;
                console.log('Transaction proposal was good...');
            } else {
                console.error('Transaction proposal was bad...');
            }
        if (isProposalGood) {
            //ORDER THE PROPOSAl
            console.log(util.format(
                'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
                proposalResponses[0].response.status, proposalResponses[0].response.message));
            var request = {
                proposalResponses: proposalResponses,
                proposal: proposal
            };

            // SET EVENT LISTENER FOR TIME OUT (30SECONDS)
            var transaction_id_string = tx_id.getTransactionID();
            var promises = [];
            var sendPromise = channel.sendTransaction(request);
            promises.push(sendPromise); 

            // INIT EVENTHUB
            let event_hub = fabric_client.newEventHub();
            event_hub.setPeerAddr('grpc://localhost:7053');
            let txPromise = new Promise((resolve, reject) => {
                let handle = setTimeout(() => {
                    event_hub.disconnect();
                    resolve({event_status : 'TIMEOUT'}); 
                }, 1500);
                event_hub.connect();
                event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
                    clearTimeout(handle);
                    event_hub.unregisterTxEvent(transaction_id_string);
                    event_hub.disconnect();

                    //RETURN STATUS OF TRANSACTION COMMIT
                    var return_status = {event_status : code, tx_id : transaction_id_string};
                    if (code !== 'VALID') {
                        console.error('The transaction was invalid, code = ' + code);
                        resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
                    } else {
                        console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
                        resolve(return_status);
                    }
                }, (err) => {
                    reject(new Error('There was a problem with the eventhub ::'+err));
                });
            });
            promises.push(txPromise);
            return Promise.all(promises);
        } else {
            console.error('Transaction proposal failed...');
            throw new Error('Transaction proposal failed...');
        }
    }).then((results) => {
        //INFORM CALLING FUNCTION OF STATUS
        console.log('Send transaction promise and event listener promise have completed');
        if (results && results[0] && results[0].status === 'SUCCESS') {
            console.log('Successfully sent transaction to the orderer.');
            res.send(tx_id.getTransactionID());
        } else {
            console.error('Failed to order the transaction. Error code: ' + response.status);
        }

        if(results && results[1] && results[1].event_status === 'VALID') {
            console.log('Successfully committed the change to the ledger by the peer');
            res.send(tx_id.getTransactionID());
        } else {
            console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
        }
    }).catch((err) => {
        console.error('Failed to invoke successfully :: ' + err);
    });

});
// Register New User and provide CA certificate
app.post('/api/v1/register_user/', async function(req, res){
    console.log("Registering User... ");
    var user_val = req.body.usrname
        
    var fabric_client = new Fabric_Client();
    var fabric_ca_client = null;
    var admin_user = null;
    var member_user = null;
    var store_path = path.join(os.homedir(), '.hfc-key-store');
    console.log(' Store path:'+store_path);
    Fabric_Client.newDefaultKeyValueStore({ path: store_path
    }).then((state_store) => {
        fabric_client.setStateStore(state_store);
        var crypto_suite = Fabric_Client.newCryptoSuite();
        var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
        crypto_suite.setCryptoKeyStore(crypto_store);
        fabric_client.setCryptoSuite(crypto_suite);
        var	tlsOptions = {
            trustedRoots: [],
            verify: false
        };
        fabric_ca_client = new Fabric_CA_Client('http://localhost:7054', null , '', crypto_suite);
        return fabric_client.getUserContext('admin', true);
    }).then((user_from_store) => {
        if (user_from_store && user_from_store.isEnrolled()) {
            console.log('Successfully loaded admin...');
            admin_user = user_from_store;
        } else {
            throw new Error('Failed to get admin....');
        }
        return fabric_ca_client.register({enrollmentID: user_val, affiliation: 'org1.department1'}, admin_user);
    }).then((secret) => {
        // next we need to enroll the user with CA server
        console.log('Successfully registered user...');
        console.log("Secret:"+secret);
        return fabric_ca_client.enroll({enrollmentID: user_val, enrollmentSecret: secret});
    }).then((enrollment) => {
    console.log('Successfully enrolled member user...');
    return fabric_client.createUser(
        {username: user_val,
        mspid: 'Org1MSP',
        cryptoContent: { privateKeyPEM: enrollment.key.toBytes(), signedCertPEM: enrollment.certificate }
        });
    }).then((user) => {
        member_user = user;
        return fabric_client.setUserContext(member_user);
    }).then(()=>{
        console.log('User was successfully registered...');
    }).catch((err) => {
        console.error('Failed to register: ' + err);
        if(err.toString().indexOf('Authorization') > -1) {
            console.error('Authorization failure...user exists'+store_path);
        }
    });

});

app.post('/api/v1/delete_heat_map/', async function(req, res){
    console.log("Deleting heatmap... ");
    
    var user = req.body.user
    var name = req.body.name

    var fabric_client = new Fabric_Client();
    var channel = fabric_client.newChannel('memmap');
    var peer = fabric_client.newPeer('grpc://localhost:7051');
    channel.addPeer(peer);
    var order = fabric_client.newOrderer('grpc://localhost:7050')
    channel.addOrderer(order);
    
    var member_user = null;
    var store_path = path.join(os.homedir(), '.hfc-key-store');
    var tx_id = null;

    // create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
    Fabric_Client.newDefaultKeyValueStore({ path: store_path
    }).then((state_store) => {

        fabric_client.setStateStore(state_store);
        var crypto_suite = Fabric_Client.newCryptoSuite();
        var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
        crypto_suite.setCryptoKeyStore(crypto_store);
        fabric_client.setCryptoSuite(crypto_suite);

        return fabric_client.getUserContext(user, true);
    }).then((user_from_store) => {
        //VERIFY USER AND PROPOSE TRANSACTION
        if (user_from_store && user_from_store.isEnrolled()) {
            console.log('Successfully loaded user...');
            member_user = user_from_store;
        } else {
            throw new Error('Failed to get user....');
        }

        tx_id = fabric_client.newTransactionID();
        console.log("Assigning transaction ID: ", tx_id._transaction_id);
        const request = {
            chaincodeId: 'BFT',
            fcn: 'deleteHeatMap',
            args: [name],
            chainId: 'memmap',
            txId: tx_id
        };

        return channel.sendTransactionProposal(request);
    }).then((results) => {
        //COLLECT RESPONSES
        var proposalResponses = results[0];
        var proposal = results[1];
        let isProposalGood = false;
        if (proposalResponses && proposalResponses[0].response &&
            proposalResponses[0].response.status === 200) {
                isProposalGood = true;
                console.log('Transaction proposal was good...');
            } else {
                console.error('Transaction proposal was bad...');
            }
        if (isProposalGood) {
            //ORDER THE PROPOSAl
            console.log(util.format(
                'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
                proposalResponses[0].response.status, proposalResponses[0].response.message));
            var request = {
                proposalResponses: proposalResponses,
                proposal: proposal
            };

            // SET EVENT LISTENER FOR TIME OUT (30SECONDS)
            var transaction_id_string = tx_id.getTransactionID();
            var promises = [];
            var sendPromise = channel.sendTransaction(request);
            promises.push(sendPromise); 

            // INIT EVENTHUB
            let event_hub = fabric_client.newEventHub();
            event_hub.setPeerAddr('grpc://localhost:7053');
            let txPromise = new Promise((resolve, reject) => {
                let handle = setTimeout(() => {
                    event_hub.disconnect();
                    resolve({event_status : 'TIMEOUT'}); 
                }, 1500);
                event_hub.connect();
                event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
                    clearTimeout(handle);
                    event_hub.unregisterTxEvent(transaction_id_string);
                    event_hub.disconnect();

                    //RETURN STATUS OF TRANSACTION COMMIT
                    var return_status = {event_status : code, tx_id : transaction_id_string};
                    if (code !== 'VALID') {
                        console.error('The transaction was invalid, code = ' + code);
                        resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
                    } else {
                        console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
                        resolve(return_status);
                    }
                }, (err) => {
                    reject(new Error('There was a problem with the eventhub ::'+err));
                });
            });
            promises.push(txPromise);
            return Promise.all(promises);
        } else {
            console.error('Transaction proposal failed...');
            throw new Error('Transaction proposal failed...');
        }
    }).then((results) => {
        //INFORM CALLING FUNCTION OF STATUS
        console.log('Send transaction promise and event listener promise have completed');
        if (results && results[0] && results[0].status === 'SUCCESS') {
            console.log('Successfully sent transaction to the orderer.');
            res.send(tx_id.getTransactionID());
        } else {
            console.error('Failed to order the transaction. Error code: ' + response.status);
        }

        if(results && results[1] && results[1].event_status === 'VALID') {
            console.log('Successfully committed the change to the ledger by the peer');
            res.send(tx_id.getTransactionID());
        } else {
            console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
        }
    }).catch((err) => {
        console.error('Failed to invoke successfully :: ' + err);
    });

});

app.get('/api/v1/query_heat_map/:hm', async function(req, res){
    console.log("Verifying heatmap...");
        var hm = req.params.hm

		var fabric_client = new Fabric_Client();
		var channel = fabric_client.newChannel('memmap');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);
		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
	
		    fabric_client.setStateStore(state_store);
		    var crypto_suite = Fabric_Client.newCryptoSuite();
		    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		    crypto_suite.setCryptoKeyStore(crypto_store);
		    fabric_client.setCryptoSuite(crypto_suite);

		    return fabric_client.getUserContext(user1, true);
		}).then((user_from_store) => {
            //VERIFY USER AND PROPOSE TRANSACTION
		    if (user_from_store && user_from_store.isEnrolled()) {
		        console.log('Successfully loaded user...');
		        member_user = user_from_store;
		    } else {
		        throw new Error('Failed to get user....');
		    }

		    const request = {
                chaincodeId: 'BFT',
                txId: tx_id,
                fcn: 'queryHeatMap',
                args: [hm]
            };
        
            //SEND QUERY TO CHAINCODE
            return channel.queryByChaincode(request);
        }).then((query_responses) => {
            // INFORM CALLING FUNCTION OF RESULT
            console.log("Query has completed...");
            if (query_responses && query_responses.length == 1) {
                if (query_responses[0] instanceof Error) {
                    console.error("error from query = ", query_responses[0]);
                } else {
                    console.log("Response is ", query_responses[0].toString());
                    res.send(query_responses[0].toString())
                }
            } else {
                console.log("No payloads were returned from query...");
            }
        }).catch((err) => {
            console.error('Failed to query successfully :: ' + err);
        });

    
});  


//WebServer Functions

app.post('/api/v1/forward_login',async function(req,res){
    console.log("Fowarding login request... ");
 
    request({
        uri: "example.com/login",
        method: "POST",
        json: true,
        body: {
            username: req.body.user,
            passwd: req.body.pass
        }
      }, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body.id)
            res.send(JSON.stringify({value: 1}));
        }
      });

});

app.post('/api/v1/forward_formsubmit',async function(req,res){
    console.log("Fowarding form request... ");
    request({
        uri: "example.com/formsubmit",
        method: "POST",
        json: true,
        body: {
            name: req.body.name,
            card_num:req.body.card_num,
            card_exp:req.body.card_exp,
            card_cvv:req.body.card_cvv
        }
      }, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body.id)
            res.send(JSON.stringify({value: 1}));
        }
      });
});


//Server listening
var port = process.env.PORT || 8000;
app.listen(port,function(){
  console.log("Live on port: " + port);
});