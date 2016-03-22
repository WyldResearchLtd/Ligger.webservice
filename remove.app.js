var express = require('express');
var busy = require('busy');
var app = express();
var pg = require("pg");
var crypto = require("crypto");


var sharedSecret = process.env.SHAREDSECRET;
var strDBconn = process.env.DBCONN;


var busyCheck = busy(function(amount) {
    console.log('Loop was busy for', amount, 'ms');
});

// middleware which blocks requests when we're too busy
app.use(function(req, res, next) {
    if (busyCheck.blocked) {
        res.send(503, "Server is too busy right now, try again.");
        console.log("Server rejected request- 503- too busy");
    } else {
        next();
    }
});

app.get('/', function (req, res) {
  list_records(req, res);
});

app.get('/' + process.env.LOADERIO + "/", function (req, res) {
  res.status(200).send(process.env.LOADERIO);
});

app.post('/', function (req, res) {
  //res.status(500).send('Service Error');
  insert_records(req, res);
});

var server = app.listen(process.env.PORT, function () {
  var port = server.address().port;

  console.log('Server listening on port %s', port);
});

process.on('SIGINT', function() {
    server.close();
    // calling .stop allows your process to exit normally
    busyCheck.stop();
    process.exit();
});

/////////////GET//////////////////////////////////////////////////////////////////////////////
var list_records = function(req, res) {
    console.log("GET-list_records");

    //this required to make req.on(end) work- never called!
    req.on('data', function(chunk) {
	   console.log("GET Received body data");
	});

    req.on('end', function() {
	
	   console.log("GET query.on(end)-list_records");
	
	   pg.connect(strDBconn, function(err, client, done) {
		   // Select the rows in the table, ordered and limited
		   var query = client.query("SELECT name, userID, deviceID, score, level, datetime FROM scores ORDER BY score DESC, userID DESC LIMIT 3");

	       query.on("row", function (row, result) {
			  result.addRow(row);
		   });

		   query.on("end", function (result) {
			  try {
				client.end();
				console.log("SELECT Sucessful, Connection Closed");
				res.status(200).send(JSON.stringify(result.rows));
			  } catch (e) {
				console.log("GET query.on(end) EXCEPTION: " + e);
				res.status(500).send("GET-EXCEPTION: "+e);
		      }
		    });
		
		    query.on('error', function(err) {
			   //cannot use the err function inline in client.query, because you'll get double results
			   console.log("Query (SELECT): " + err);
			   res.status(500).send("GET-Select: "+err);
		    });
	    }); //end of pg.connect
    }); // end of req.on('end')

  console.log("GET data initialised");
}

/////////////POST//////////////////////////////////////////////////////////////////////////////
var insert_records = function(req, res) {
   console.log("POST-insert_records");
   
   var data = "";

    //console.log("POST Request obj: " + req);
    req.on('data', function(chunk) {
	      data += chunk.toString();
	      console.log("POST Received body data");
	      //console.log(chunk.toString());
	});

	req.on('end', function() {
	      console.log("POST Data end.");
	      //Check hmac and Add to DB 
	        try {
		       //check HMAC
			   //console.log("HEADERS: " +JSON.stringify(req.headers));
			   var hmac = req.headers['content-hmac'];  //needs to be lowercase because node.js returns headers as json
			   console.log("content-hmac: " + hmac);
			   //we do not have to worry about replay attacks, because the
			   var query = "post /\nhost: http://" + req.headers['host'] + " /\nbody: " + data;
			   var signature = crypto.createHmac("sha256", sharedSecret).update(query).digest("hex");
			   console.log("   Signature: " + signature);
			   //only if true connect to DB
			   if (hmac == signature)
			   {
		           //Add to DB 
		           var jsonData = JSON.parse(data);
		           pg.connect(strDBconn, function(err, client, done) {
	               var query = client.query("INSERT INTO scores(name, userID, deviceID, score, level, datetime, log, timeremaining) values($1, $2, $3, $4, $5, $6, $7, $8)", 
	                  [jsonData.scoreObj.scoreName, 
	                   jsonData.scoreObj.UserGUID, 
	                   jsonData.scoreObj.DeviceGUID, 
	                   jsonData.scoreObj.scoreValue, 
	                   jsonData.scoreObj.scoreLevel, 
	                   jsonData.scoreObj.scoreDate, 
	                   jsonData, 
	                   jsonData.scoreObj.timeRemaining
	                  ],function(err, result){
						if(err) {
					          console.log("INSERT INTO Query: " + err);
					          res.status(409).send("DB Write Error: " + err);
					    }
	                });
	                console.log("Attempt to Insert Score data: UID" + jsonData.scoreObj.UserGUID + " DID: " + jsonData.scoreObj.DeviceGUID + " Date: " + jsonData.scoreObj.scoreDate);
	                //close connection on end
	                query.on('end', function() {
				            client.end();
				            console.log("INSERT INTO Sucessful, Connection Closed");
							 res.status(200).send("POST Success");
				     });

				     // Handle Connection Errors
				     if(err) {
				          console.log("Connection (INSERT INTO)  Error:" + err);
						  res.status(403).send("POST Connection Error");
				      }
                  });
               } else {
					console.log(">>ERROR: Signatures did not match");
					//console.log(data);
					res.status(401).send("POST Error: Signatures did not match");
               }
		    } catch (e) {
			    console.log("insert_records EXCEPTION: " + e);
			    res.status(500).send("POST Exception" + e);
		    }
	});

   console.log("POST data initialised");
}


/////////////GET//////////////////////////////////////////////////////////////////////////////
  var list_records = function(req, res) {
    console.log("GET-list_records");

    //this required to make req.on(end) work- never called!
    req.on('data', function(chunk) {
	   console.log("GET Received body data");
	});

    req.on('end', function() {
	
	   console.log("GET query.on(end)-list_records");
	
	   pg.connect(strDBconn, function(err, client, done) {
		   // Select the rows in the table, ordered and limited
		   var query = client.query("SELECT name, userID, deviceID, score, level, datetime FROM scores ORDER BY score DESC, userID DESC LIMIT 3");

	       query.on("row", function (row, result) {
			  result.addRow(row);
		   });

		   query.on("end", function (result) {
			  try {
				client.end();
				console.log("SELECT Sucessful, Connection Closed");
				res.status(200).send(JSON.stringify(result.rows));
			  } catch (e) {
				console.log("GET query.on(end) EXCEPTION: " + e);
		      }
		    });
		
		    query.on('error', function(err) {
			   //cannot use the err function inline in client.query, because you'll get double results
			   console.log("Query (SELECT): " + err);
		    });
	    }); //end of pg.connect
    }); // end of req.on('end')
}