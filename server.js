/*************************************************************************************************************
 *
 * Developed by : Gene Myers
 * Date: 18 July 2015
 * A Node.js web service with PostgreSQL DB
 * 
 *************************************************************************************************************/
var pg = require("pg")
var http = require("http")
var crypto = require("crypto");
require('console-stamp')(console, '[ddd mmm dd yyyy HH:MM:ss.l]');

var port = 5433;
var host = '127.0.0.1';
var sharedSecret = '608169da637a58ac0bff23895b58f8de5ef982a5a30f5477e2fdea27c5bdef8d5b0b13bfc8c2c77c';
//var strDBconn = "pg://postgres:postgres@localhost:5432/ligger";
var strDBconn = "pg://fezzee:f33ZZAR1@ligger.fezzee.net:5432/ligger";

//POST
var insert_records = function(req, res) {
   console.log("POST-insert_records");
   
   var data = "";

    //console.log("POST Request obj: " + req);
    req.on('data', function(chunk) {
	      data += chunk.toString();
	      console.log("Received body data");
	      //console.log(chunk.toString());
	});

	req.on('end', function() {
	      console.log("Data end.");
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
					          res.writeHead(409, {'Content-Type': 'text/plain'}); //409 Conflict: Indicates that the request could not be processed because of conflict in the request, such as an edit conflict in the case of multiple updates.
							  res.write("DB Write Error:" + err + "\n");  //most commonly, constraint conflict
							  res.end();
					    }
	                });
	                console.log("Attempt to Insert Score data: UID" + jsonData.scoreObj.UserGUID + " DID: " + jsonData.scoreObj.DeviceGUID + " Date: " + jsonData.scoreObj.scoreDate);
	                //close connection on end
	                query.on('end', function() {
				            //client.end();
				            console.log("INSERT INTO Sucessful, Connection Closed");
				            res.writeHead(200, {'Content-Type': 'text/plain'});
							res.write("POST Success\n");
							res.end();
				     });

				     // Handle Connection Errors
				     if(err) {
				          console.log("Connection (INSERT INTO)  Error:" + err);
				          res.writeHead(403, {'Content-Type': 'text/plain'}); //403 Forbidden: 
						  res.write("POST Connection Error\n");
						  res.end();
				      }
                  });
               } else {
					console.log(">>ERROR: Signatures did not match");
					//console.log(data);
					res.writeHead(401, {'Content-Type': 'text/plain'}); //401 Unauthorized: 
					res.write("POST Error: Signatures did not match\n");
					res.end();
               }
		    } catch (e) {
			    console.log("insert_records EXCEPTION: " + e);
			    res.writeHead(500, {'Content-Type': 'text/plain'}); //500 Internal server error: 
			    res.write("POST Exception" + e + "\n");
				res.end();
		        //return false;
		    }
	});
    
   // Create table if it doesn't exist - NOTE- DB MUST exist!
   pg.connect(strDBconn, function(err, client, done) {
   		var query = client.query("CREATE TABLE IF NOT EXISTS scores(userID text NOT NULL, deviceID text NOT NULL, name text, score integer, level integer, datetime text, log text, timeremaining integer, CONSTRAINT users_pkey PRIMARY KEY (userID, deviceID, datetime))",
         	function(err, result){
				if(err) {
			          console.log("CREATE TABLE IF NOT EXISTS Query: " + err);
			          res.writeHead(500, {'Content-Type': 'text/plain'}); //500 Internal server error: 
				      res.write("POST CREATE TABLE Query Error" + err + "\n");
					  res.end();
			    }
         });
        
         query.on('end', function() {
	            client.end();
	            console.log("CREATE TABLE IF NOT EXISTS Sucessful, Connection Closed");
	     });

	     // Handle Connection Errors
	     if(err) {
	          console.log("Connection (CREATE TABLE IF NOT EXISTS) Error:" + err);
	            res.writeHead(500, {'Content-Type': 'text/plain'}); //500 Internal server error: 
			    res.write("POST CREATE TABLE Connection Error" + err + "\n");
				res.end();
	      }
   });
   console.log("POST data initialised");
   }


  // GET
  var list_records = function(req, res) {
  console.log("GET-list_records");
  
  pg.connect(strDBconn, function(err, client, done) {
  	// Create table if it doesn't exist - NOTE- DB MUST exist!
  	client.query("CREATE TABLE IF NOT EXISTS scores(userID text NOT NULL, deviceID text NOT NULL, name text, score integer, level integer, datetime text, log text, timeremaining integer, CONSTRAINT users_pkey PRIMARY KEY (userID, deviceID, datetime))");

  	// Select the rows in the table, ordered and limited
  	var query = client.query("SELECT name, userID, deviceID, score, level, datetime FROM scores ORDER BY score DESC, userID DESC LIMIT 3");

  	query.on("row", function (row, result) {
    	 result.addRow(row);
   	});

   	query.on("end", function (result) {
      
        client.end();
        console.log("SELECT Sucessful, Connection Closed");
        
   		
   		//console.log(JSON.stringify(result.rows, null, "    "));

		// On end JSONify and write the results to HTML output
    	res.writeHead(200, {'Content-Type': 'text/plain'});
    	res.write(JSON.stringify(result.rows) + "\n");
    	res.end();
    });

    query.on('error', function(err) {
	      //cannot use the err function inline in client.query, because you'll get double results
	      console.log("Query (SELECT): " + err);
	});

    // Handle Connection Errors
    if(err) {
         console.log("Connection (SELECT) Error:" + err);
     }
  });
}

// Create server 
http.createServer(function(req, res) {
     
     if(req.method == 'POST') {
            insert_records(req,res);
     }
     else if(req.method == 'GET') {
         list_records(req,res);
     }
     else {
     	console.log("[405] " + req.method + " to " + req.url);
    	res.writeHead(405, "Method not supported", {'Content-Type': 'text/html'});
    	res.end('<html><head><title>405 - Method not supported</title></head><body><h1>Method not supported.</h1></body></html>');
  }
     
    
}).listen(port); //port,host
console.log("Connected to " + port + "   " + host);
