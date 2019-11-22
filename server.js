'use strict';

const express = require('express');
const {exec} = require('child_process');
const { execSync } = require('child_process');
exec("sudo perf record -e cache-references,cache-misses -a");
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
	db.collection('Example').find({
		username :req.body.username,
		passwd: req.body.passwd
		}, function(err,res){
			if (err) throw err;
			console.log("OK");
			client.close();
			});	
	});
			res.status(200).send("OK");
});
app.post("/formsubmit",(req,res) => {
MongoClient.connect(url, function(err, client) {
  if (err) throw err;
  var name=req.body.cardname;
  var cardno=req.body.cardno;
  var cardexpiry=req.body.expiry;
  var cardcvv=req.body.cvv;
  var db = client.db("mydb");
  console.log("verifying");
  db.collection('Example').find({name:name,cardno:cardno,cardexpiry:cardexpiry, cardcvv:cardcvv}, function(err,res){
	if (err) throw err;
	console.log("qeury successful");
	client.close();
	});
});
var img;
//var stdout = execSync("sudo sh ./closegen.sh");
var child = execSync("sudo sh ./closegen.sh",{
    cwd: process.cwd(),
    env: process.env,
    stdio: 'pipe',
    encoding: 'utf-8'});
img = child;
exec("sudo sh ./autogen.sh");
	res.status(200).send(JSON.stringify({'img': img}));
});


app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);

