'use strict';

const express = require('express');
const MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017";
// Constants
const PORT = 8081;
const HOST = '0.0.0.0';

// App
const app = express();
app.get('/', (req, res) => {
  res.send('Hello world\n');
});

const bodyparser = require('body-parser');
app.use( bodyparser.json());

app.use(bodyparser.urlencoded({
extended:true
}));

//app.use(express.json());
//app.use(express.urlencoded());

app.post("/login",(req,res) => {
MongoClient.connect(url, function(err,client) {
	if (err) throw err;
	var db = client.db("mydb");
	console.log("inserting values");
	console.log(req.body.username);
	db.collection('Example').insertOne({
		username :req.body.username,
		passwd: req.body.passwd
		}, function(err,res){
			if (err) throw err;
			console.log("inserted!!!!!!");
			client.close();
			});	
	});
			res.sendStatus(200);
});
app.post("/formsubmit",(req,res) => {
MongoClient.connect(url, function(err, client) {
  if (err) throw err;
  var db = client.db("mydb");
  console.log("verifying");
  db.collection('Example').find({username:req.body.username,pwd:req.body.passwd}, function(err,res){
	if (err) throw err;
	console.log("qeury successful");
	client.close();
	});
});
	res.sendStatus(200);
});


app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);

