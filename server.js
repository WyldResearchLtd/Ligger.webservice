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
	      // empty 200 OK response for now
	      res.writeHead(200, "OK", {'Content-Type': 'text/html'});
	      res.end();
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
					    }
	                });
	                console.log("Attempt to Insert Score data: UID" + jsonData.scoreObj.UserGUID + " DID: " + jsonData.scoreObj.DeviceGUID + " Date: " + jsonData.scoreObj.scoreDate);
	                //close connection on end
	                query.on('end', function() {
				            client.end();
				            console.log("INSERT INTO Sucessful, Connection Closed");
				     });

				     // Handle Connection Errors
				     if(err) {
				          console.log("Connection (INSERT INTO)  Error:" + err);
				      }
				     
                  });
               } else {
					console.log("ERROR: Signatures did not match");
					console.log(data);
               }
		    } catch (e) {
			    console.log("insert_records EXCEPTION: " + e);
		        return false;
		    }
	});
    
   // Create table if it doesn't exist - NOTE- DB MUST exist!
   pg.connect(strDBconn, function(err, client, done) {
   		var query = client.query("CREATE TABLE IF NOT EXISTS scores(userID text NOT NULL, deviceID text NOT NULL, name text, score integer, level integer, datetime text, log text, timeremaining integer, CONSTRAINT users_pkey PRIMARY KEY (userID, deviceID, datetime))",
         	function(err, result){
				if(err) {
			          console.log("CREATE TABLE IF NOT EXISTS Query: " + err);
			    }
         });
        
         query.on('end', function() {
	            client.end();
	            console.log("CREATE TABLE IF NOT EXISTS Sucessful, Connection Closed");
	     });

	     // Handle Connection Errors
	     if(err) {
	          console.log("Connection (CREATE TABLE IF NOT EXISTS) Error:" + err);
	      }
   });
   // Write output
   res.writeHead(200, {'Content-Type': 'text/plain'});
   res.write("POST data initialised\n");
   res.end();
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
     
    
}).listen(port,host);
console.log("Connected to " + port + "   " + host);