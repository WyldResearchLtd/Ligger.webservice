/*****************************************************************************************
 *
 * Developed by : Gene Myers
 * Date: 18 July 2015
 * A Node.js web service with PostgreSQL DB
 * 
 ****************************************************************************************/
 
var pg = require("pg");
var http = require("http");
var crypto = require("crypto");
//var toobusy = require('toobusy');
require('console-stamp')(console, '[ddd mmm dd yyyy HH:MM:ss.l]');

var defaultport = 8081;
var sharedSecret = process.env.SHAREDSECRET;
var strDBconn = "postgres://fezzee:=3Balmoral@ligger.culaminlpann.eu-west-1.rds.amazonaws.com:5432/wyldlu"; //"postgres://gene@localhost:5432/gene"; //process.env.DBCONN;




//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
//    POST  - insert_records                                                            //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

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
		       //check HMAC- Uncomment the Three Blocks to enable HMAC authentication
			   //console.log("HEADERS: " +JSON.stringify(req.headers));
//BLOCK1	   var hmac = req.headers['content-hmac'];  //needs to be lowercase because node.js returns headers as json
// 			   console.log("content-hmac: " + hmac);
// 			   //we do not have to worry about replay attacks, because the
			   var query = "post /\nhost: http://" + req.headers['host'] + " /\nbody: " + data;
//BLOCK2 	   var signature = crypto.createHmac("sha256", sharedSecret).update(query).digest("hex");
// 			   console.log("   Signature: " + signature);
// 			   //only if true connect to DB
// 			   if (hmac == signature)
// 			   {
// 		           

/*  Here we show the json expected below 

"status": {
		"statusId": 2,
		"lineId": "bakerloo",
		"statusSeverityDescription": "Minor Delays",
		"statusSeverity": 10,
		"reason":"Bakerloo Line: Minor delays due to an earlier signal failure at Lambeth North.",
		"created": "2016-03-03T11:04:59.517",
		"archive": false
	}
//see the end of this file for the entire jsonData object, which contains the Log, but note how the 
log is never saved anywhere on its own

//Database schema- status
 
    statusId				     integer NOT NULL, --added later- may not need it- lineId could be ok as only one entry ever needed per line
    lineId           			 varchar(80),   -- description
    statusSeverityDescription    varchar(80),   -- "Good Service"
    statusSeverity        	     integer,       -- 10
    created         			 timestamp,     -- without timezone "2016-03-03T11:04:59.517"
    archive         			 boolean  
    
    NOTE- see Environ.sh for the TFL Status Schema
*/

                   //Add to DB                  
		           var jsonData = JSON.parse(data);
		           //pass json data to the func below, and from it identify the structure
		           
		           
		           pg.connect(strDBconn, function(err, client, done) {
		           
	               var query = client.query("INSERT INTO status(statusId, lineId, statusSeverityDescription, statusSeverity, reason, created, archive) values($1, $2, $3, $4, $5, $6, $7)", 
	                   [jsonData.status.statusId,
	                   jsonData.status.lineId, 
	                   jsonData.status.statusSeverityDescription, 
	                   jsonData.status.statusSeverity, 
	                   jsonData.status.reason, 
	                   new Date(jsonData.status.created), 
	                   jsonData.status.archive, 
	                   ],function(err, result){
						if(err) {
					          console.log("INSERT INTO Query: " + err);
					          res.writeHead(409, {'Content-Type': 'text/plain'}); //409 Conflict: Indicates that the request could not be processed because of conflict in the request, such as an edit conflict in the case of multiple updates.
							  res.write("DB Write Error:" + err + "\n");  //most commonly, constraint conflict
							  res.end();
					    }
	                });
	                console.log("Attempt to Insert Data");
	                //close connection on end
	                query.on('end', function() {
				            client.end();
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
//BLOCK3          } else {
// 					console.log(">>ERROR: Signatures did not match");
// 					//console.log(data);
// 					res.writeHead(401, {'Content-Type': 'text/plain'}); //401 Unauthorized: 
// 					res.write("POST Error: Signatures did not match\n");
// 					res.end();
//                }
		    } catch (e) {
			    console.log("insert_records EXCEPTION: " + e);
			    res.writeHead(500, {'Content-Type': 'text/plain'}); //500 Internal server error: 
			    res.write("POST Exception" + e + "\n");
				res.end();
		        //return false;
		    }
	});
/*    
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
	          try {
	            client.end();
	            console.log("CREATE TABLE IF NOT EXISTS Sucessful, Connection Closed");
	          } catch (e) {
				console.log("POST query.on('end') EXCEPTION: " + e);
		      }
	     });

	     // Handle Connection Errors
	     if(err) {
	          console.log("Connection (CREATE TABLE IF NOT EXISTS) Error:" + err);
	            res.writeHead(500, {'Content-Type': 'text/plain'}); //500 Internal server error: 
			    res.write("POST CREATE TABLE Connection Error" + err + "\n");
				res.end();
	      }
   });
*/
   console.log("POST data initialised");
   }


//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
//    GET  - list_records                                                               //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

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
		   var query = client.query("SELECT statusId, lineId, statusSeverityDescription, statusSeverity, created, archive FROM status");
/* Database structure
    statusId				     integer NOT NULL, --added later- may not need it- lineId could be ok as only one entry ever needed per line
    lineId           			 varchar(80),   -- description
    statusSeverityDescription    varchar(80),   -- "Good Service"
    statusSeverity        	     integer,       -- 10
    created         			 timestamp,     -- without timezone "2016-03-03T11:04:59.517"
    archive         			 boolean  
*/
	       query.on("row", function (row, result) {
			  result.addRow(row);
		   });

		   query.on("end", function (result) {
			  try {
				client.end();
				console.log("SELECT Sucessful, Connection Closed");
				res.writeHead(200, {'Content-Type': 'text/plain'});
				res.write(JSON.stringify(result.rows) + "\n");
				res.end();
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
/*  
  pg.connect(strDBconn, function(err, client, done) {
  	// Create table if it doesn't exist - NOTE- DB MUST exist!
  	var query = client.query("CREATE TABLE IF NOT EXISTS scores(userID text NOT NULL, deviceID text NOT NULL, name text, score integer, level integer, datetime text, log text, timeremaining integer, CONSTRAINT users_pkey PRIMARY KEY (userID, deviceID, datetime))");

    query.on('end', function() {
         try {
           client.end();
           console.log("GET- CREATE TABLE IF NOT EXISTS Sucessful, Connection Closed");
         } catch (e) {
			console.log("GET query.on('end') EXCEPTION: " + e);
	      }
    });

    // Handle Connection Errors
    if(err) {
         console.log("Connection (CREATE TABLE IF NOT EXISTS) Error:" + err);
     }
  });
*/
  console.log("GET data initialised");
}


//////////////////////////////////////////////////////////////////////////////////////////
//
//          Create server 
// Calls loader.io (for load/stress testing) when its a GET with the correct url /Identifier/ 
// The Identifier is defined in Environ.sh
//
//////////////////////////////////////////////////////////////////////////////////////////

var server = http.createServer(function(req, res) {


     if(req.method == 'POST') {
	        console.log("POST " + req.url + "' from " + req.connection.remoteAddress)
            insert_records(req,res);
     }
     else if(req.method == 'GET') {
	     console.log("GET '" + req.url + "' from " + req.connection.remoteAddress)

	     if (req.url == "/")
	     {
         	list_records(req,res);
         } 	else if (req.url == "/" + process.env.LOADERIO + "/") {   //replace this with an eviron var too!
	              console.log("Loadio verified: " + process.env.LOADERIO);
                  //res.writeHead(200, {'Content-Type': 'text/plain'});
                  //res.write(process.env.LOADERIO);
                  //res.end();
         }
     }
     else {
     	console.log("[405] " + req.method + " not supported");
     	res.writeHead(405, "Method not supported", {'Content-Type': 'text/html'});
     	res.end('<html><head><title>405 - Method not supported</title></head><body><h1>Method not supported.</h1></body></html>');
     }
    
}).listen(process.env.PORT || defaultport);

server.on ('listening', function(){
    console.log("Connection String: " + strDBconn);
	console.log('ok, server is running');
});

console.log("SERVER STARTED: Listening on " + process.env.PORT);


/*
{
	"Movement": 0,
	"LeaderB": {
		"deviceid": "970A7E67-1227-42B9-B7A7-BD1A2891DDAF",
		"level": 5,
		"score": 18300,
		"name": "Tezza",
		"userid": "562BCB02-D5D5",
		"datetime": "2015-11-02 22:53"
	},
	"UserIdentifier": "562A18BB-46B6",
	"Soundtrack": "0",
	"log": [" Msg: GameStarted at: 2015-11-08 06:45:20 +0000", "Seconds: 3 Position: 
	280.268311.2,112.001999.2 Msg: moveForward", "Seconds: 3 Position: 280.268311.2,
	176.001999.2 Msg: moveForward", "Seconds: 5 Position: 176.268311.2,240.001999.2 Msg: 
	moveForward", "Seconds: 7 Position: 280.268311.2,304.002014.2 Msg: moveForward", 
	"Seconds: 7 Position: 280.268311.2,368.002014.2 Msg: moveForward", "Seconds: 7 
	Position: 280.268311.2,432.002014.2 Msg: moveForward", "Seconds: 8 Position: 
	280.268311.2,496.002014.2 Msg: moveForward", "Seconds: 8 Position: 280.268311.2,
	560.002014.2 Msg: moveForward", "Seconds: 10 Position: 176.268311.2,560.002014.2 
	Msg: moveForward", "Seconds: 10 Position: 176.268311.2,624.002014.2 Msg: moveForward", 
	"Seconds: 10 Position: 176.268311.2,688.002014.2 Msg: moveForward", "Seconds: 10 
	Position: 176.268311.2,752.002014.2 Msg: moveForward", "Seconds: 11 Position: 
	176.268311.2,816.002014.2 Msg: moveForward", "Seconds: 11 Msg: reachBartender", 
	"Seconds: 13 Position: 280.268311.2,752.002014.2 Msg: moveBack2", "Seconds: 14 
	Position: 176.268311.2,688.002014.2 Msg: moveBack2", "Seconds: 14 Position: 
	176.268311.2,624.002014.2 Msg: moveBack2", "Seconds: 14 Position: 176.268311.2,
	560.002014.2 Msg: moveBack2", "Seconds: 16 Position: 332.268311.2,496.002014.2 
	Msg: moveBack2", "Seconds: 16 Position: 332.268311.2,432.002014.2 Msg: moveBack2", 
	"Seconds: 16 Position: 332.268311.2,368.002014.2 Msg: moveBack2", "Seconds: 17 
	Position: 332.268311.2,304.002014.2 Msg: moveBack2", "Seconds: 17 Position: 
	332.268311.2,240.002014.2 Msg: moveBack2", "Seconds: 18 Position: 332.268311.2,
	176.002014.2 Msg: moveBack2", "Seconds: 19 Position: 228.268311.2,112.002014.2 
	Msg: moveBack2", "Seconds: 19 Position: 332.268311.2,112.002014.2 Msg: moveBack", 
	"Seconds: 19 Msg: finishOneBeer", " Msg: Bonus SecsRemaing: 103 Index: 1", "Seconds: 
	22 Position: 280.268311.2,112.001999.2 Msg: moveForward", "Seconds: 23 Position: 
	332.268311.2,176.001999.2 Msg: moveForward", "Seconds: 23 Position: 332.268311.2,
	240.001999.2 Msg: moveForward", "Seconds: 23 Position: 332.268311.2,304.002014.2 
	Msg: moveForward", "Seconds: 24 Position: 332.268311.2,368.002014.2 Msg: moveForward", 
	"Seconds: 24 Position: 332.268311.2,432.002014.2 Msg: moveForward", "Seconds: 24 
	Position: 332.268311.2,496.002014.2 Msg: moveForward", "Seconds: 25 Position: 
	228.268311.2,560.002014.2 Msg: moveForward", "Seconds: 26 Position: 228.268311.2,
	624.002014.2 Msg: moveForward", "Seconds: 26 Position: 228.268311.2,688.002014.2 
	Msg: moveForward", "Seconds: 26 Position: 228.268311.2,752.002014.2 Msg: moveForward", 
	"Seconds: 28 Position: 124.268311.2,816.002014.2 Msg: moveForward", "Seconds: 29 
	Msg: reachBartender", "Seconds: 31 Position: 384.268311.2,752.002014.2 Msg: 
	moveBack2", "Seconds: 31 Position: 384.268311.2,688.002014.2 Msg: moveBack2", 
	"Seconds: 31 Position: 384.268311.2,624.002014.2 Msg: moveBack2", "Seconds: 32 
	Position: 384.268311.2,560.002014.2 Msg: moveBack2", "Seconds: 32 Position: 
	384.268311.2,560.002014.2 Msg: moveBack", "Seconds: 32 Position: 436.268311.2,
	752.002014.2 Msg: moveBack", "Seconds: 32 Position: 488.268311.2,752.002014.2 
	Msg: moveBack", "Seconds: 32 Msg: reachBartender", "Seconds: 32 Position: 
	228.268311.2,816.002014.2 Msg: moveBack", "Seconds: 32 Msg: reachBartender", 
	"Seconds: 32 Position: 436.268311.2,752.002014.2 Msg: moveBack2", "Seconds: 32 
	Position: 436.268311.2,688.002014.2 Msg: moveBack2", "Seconds: 32 Position: 
	436.268311.2,624.002014.2 Msg: moveBack2", "Seconds: 32 Position: 280.268311.2,
	560.002014.2 Msg: moveBack2", "Seconds: 32 Position: 280.268311.2,496.002014.2 Msg: 
	moveBack2", "Seconds: 32 Position: 280.268311.2,432.002014.2 Msg: moveBack2", 
	"Seconds: 32 Position: 280.268311.2,368.002014.2 Msg: moveBack2", "Seconds: 32 
	Position: 280.268311.2,368.002014.2 Msg: moveBack", "Seconds: 32 Position: 
	280.268311.2,368.002014.2 Msg: moveBack", "Seconds: 32 Position: 280.268311.2,
	304.002014.2 Msg: moveBack", "Seconds: 32 Position: 280.268311.2,240.002014.2 
	Msg: moveBack", "Seconds: 32 Position: 280.268311.2,176.002014.2 Msg: moveBack", 
	"Seconds: 32 Position: 280.268311.2,112.002014.2 Msg: moveBack", "Seconds: 32 Msg: 
	finishOneBeer", " Msg: Bonus SecsRemaing: 90 Index: 1", "Seconds: 33 Position: 
	280.268311.2,112.001999.2 Msg: moveForward", "Seconds: 34 Position: 332.268311.2,
	176.001999.2 Msg: moveForward", "Seconds: 34 Position: 332.268311.2,240.001999.2 
	Msg: moveForward", "Seconds: 35 Position: 332.268311.2,304.002014.2 Msg: moveForward", 
	"Seconds: 35 Position: 332.268311.2,368.002014.2 Msg: moveForward", "Seconds: 36 
	Position: 280.268311.2,112.001999.2 Msg: moveForward", "Seconds: 36 Position: 
	280.268311.2,176.001999.2 Msg: moveForward", "Seconds: 37 Position: 280.268311.2,
	240.001999.2 Msg: moveForward", "Seconds: 38 Position: 436.268311.2,304.002014.2 Msg: 
	moveForward", "Seconds: 38 Position: 436.268311.2,368.002014.2 Msg: moveForward", 
	"Seconds: 39 Position: 436.268311.2,432.002014.2 Msg: moveForward", "Seconds: 40 
	Position: 384.268311.2,496.002014.2 Msg: moveForward", "Seconds: 40 Position: 
	332.268311.2,560.002014.2 Msg: moveForward", "Seconds: 41 Position: 332.268311.2,
	624.002014.2 Msg: moveForward", "Seconds: 42 Position: 436.268311.2,624.002014.2 
	Msg: moveForward", "Seconds: 43 Position: 332.268311.2,688.002014.2 Msg: moveForward", 
	"Seconds: 44 Position: 436.268311.2,752.002014.2 Msg: moveForward", "Seconds: 47 
	Position: 176.268311.2,816.002014.2 Msg: moveForward", "Seconds: 47 Msg: r
	eachBartender", "Seconds: 47 Position: 176.268311.2,752.002014.2 Msg: moveBack2", 
	"Seconds: 48 Position: 176.268311.2,688.002014.2 Msg: moveBack2", "Seconds: 48 
	Position: 176.268311.2,624.002014.2 Msg: moveBack2", "Seconds: 49 Position: 
	228.268311.2,560.002014.2 Msg: moveBack2", "Seconds: 49 Position: 228.268311.2,
	560.002014.2 Msg: moveBack", "Seconds: 49 Position: 488.268311.2,752.002014.2 Msg: 
	moveBack", "Seconds: 49 Msg: reachBartender", "Seconds: 49 Position: 176.268311.2,
	752.002014.2 Msg: moveBack2", "Seconds: 49 Position: 176.268311.2,688.002014.2 
	Msg: moveBack2", "Seconds: 49 Position: 176.268311.2,624.002014.2 Msg: moveBack2", 
	"Seconds: 49 Position: 176.268311.2,560.002014.2 Msg: moveBack2", "Seconds: 49 
	Position: 176.268311.2,496.002014.2 Msg: moveBack2", "Seconds: 49 Position: 
	280.268311.2,496.002014.2 Msg: moveBack2", "Seconds: 49 Position: 280.268311.2,
	432.002014.2 Msg: moveBack2", "Seconds: 49 Position: 280.268311.2,368.002014.2 Msg: 
	moveBack2", "Seconds: 49 Position: 280.268311.2,304.002014.2 Msg: moveBack2", 
	"Seconds: 49 Position: 176.268311.2,240.002014.2 Msg: moveBack2", "Seconds: 49 
	Position: 332.268311.2,176.002014.2 Msg: moveBack2", "Seconds: 49 Position: 332.268311.2,
	176.002014.2 Msg: moveBack2", "Seconds: 49 Position: 332.268311.2,176.002014.2 Msg: 
	moveBack", "Seconds: 49 Position: 332.268311.2,112.002014.2 Msg: moveBack", "Seconds: 
	49 Msg: finishOneBeer", " Msg: Bonus SecsRemaing: 73 Index: 2", "Seconds: 49 Position: 
	280.268311.2,112.001999.2 Msg: moveForward", "Seconds: 49 Position: 332.268311.2,176.001999.2 
	Msg: moveForward", "Seconds: 50 Position: 332.268311.2,240.001999.2 Msg: moveForward", 
	"Seconds: 50 Position: 332.268311.2,304.002014.2 Msg: moveForward", "Seconds: 52 
	Position: 280.268311.2,368.002014.2 Msg: moveForward", "Seconds: 52 Position: 
	280.268311.2,432.002014.2 Msg: moveForward", "Seconds: 53 Position: 332.268311.2,
	496.002014.2 Msg: moveForward", "Seconds: 53 Position: 332.268311.2,560.002014.2 Msg: 
	moveForward", "Seconds: 54 Position: 332.268311.2,624.002014.2 Msg: moveForward", 
	"Seconds: 54 Position: 280.268311.2,688.002014.2 Msg: moveForward", "Seconds: 55 
	Position: 384.268311.2,752.002014.2 Msg: moveForward", "Seconds: 57 Position: 176.268311.2,
	816.002014.2 Msg: moveForward", "Seconds: 57 Msg: reachBartender", "Seconds: 58 Position: 
	176.268311.2,752.002014.2 Msg: moveBack2", "Seconds: 58 Position: 124.268311.2,
	688.002014.2 Msg: moveBack2", "Seconds: 60 Position: 280.268311.2,624.002014.2 Msg: 
	moveBack2", "Seconds: 61 Position: 176.268311.2,560.002014.2 Msg: moveBack2", "Seconds: 
	62 Position: 280.268311.2,496.002014.2 Msg: moveBack2", "Seconds: 63 Position: 
	280.268311.2,432.002014.2 Msg: moveBack2", "Seconds: 64 Position: 176.268311.2,
	368.002014.2 Msg: moveBack2", "Seconds: 64 Position: 176.268311.2,304.002014.2 Msg: 
	moveBack2", "Seconds: 66 Position: 72.268311.2,240.002014.2 Msg: moveBack2", 
	"Seconds: 67 Position: 228.268311.2,176.002014.2 Msg: moveBack2", "Seconds: 68 Position: 
	124.268311.2,112.002014.2 Msg: moveBack2", "Seconds: 69 Msg: finishTwoBeers", " Msg: 
	Bonus SecsRemaing: 53 Index: 2", "Seconds: 70 Position: 280.268311.2,48.001999.2 Msg: 
	moveForward", "Seconds: 73 Position: 280.268311.2,112.001999.2 Msg: moveForward", 
	"Seconds: 73 Position: 332.268311.2,176.001999.2 Msg: moveForward", "Seconds: 75 
	Position: 228.268311.2,240.001999.2 Msg: moveForward", "Seconds: 76 Position: 
	332.268311.2,304.002014.2 Msg: moveForward", "Seconds: 77 Position: 228.268311.2,
	368.002014.2 Msg: moveForward", "Seconds: 78 Position: 228.268311.2,432.002014.2 Msg: 
	moveForward", "Seconds: 79 Position: 332.268311.2,496.002014.2 Msg: moveForward", 
	"Seconds: 80 Position: 280.268311.2,560.002014.2 Msg: moveForward", "Seconds: 81 
	Position: 384.268311.2,624.002014.2 Msg: moveForward", "Seconds: 82 Position: 
	280.268311.2,688.002014.2 Msg: moveForward", "Seconds: 82 Position: 280.268311.2,
	752.002014.2 Msg: moveForward", "Seconds: 84 Position: 124.268311.2,816.002014.2 Msg: 
	moveForward", "Seconds: 89 Position: 280.268311.2,816.002014.2 Msg: moveForward", 
	"Seconds: 89 Msg: reachBartender", "Seconds: 90 Position: 384.268311.2,752.002014.2 
	Msg: moveBack2", "Seconds: 91 Position: 280.268311.2,688.002014.2 Msg: moveBack2", 
	"Seconds: 92 Position: 384.268311.2,624.002014.2 Msg: moveBack2", "Seconds: 93 
	Position: 280.268311.2,560.002014.2 Msg: moveBack2", "Seconds: 94 Position: 
	280.268311.2,496.002014.2 Msg: moveBack2", "Seconds: 94 Position: 280.268311.2,
	432.002014.2 Msg: moveBack2", "Seconds: 96 Position: 228.268311.2,368.002014.2 Msg: 
	moveBack2", "Seconds: 96 Position: 228.268311.2,304.002014.2 Msg: moveBack2", 
	"Seconds: 97 Position: 124.268311.2,240.002014.2 Msg: moveBack2", "Seconds: 98 
	Position: 280.268311.2,176.002014.2 Msg: moveBack2", "Seconds: 99 Position: 
	176.268311.2,112.002014.2 Msg: moveBack2", "Seconds: 100 Msg: finishTwoBeers", " Msg: 
	Bonus SecsRemaing: 22 Index: 3", "Seconds: 101 Position: 280.268311.2,112.001999.2 
	Msg: moveForward", "Seconds: 101 Position: 332.268311.2,176.001999.2 Msg: moveForward", 
	"Seconds: 102 Position: 228.268311.2,240.001999.2 Msg: moveForward", "Seconds: 104 
	Position: 332.268311.2,304.002014.2 Msg: moveForward", "Seconds: 105 Position: 
	228.268311.2,368.002014.2 Msg: moveForward", "Seconds: 105 Position: 228.268311.2,
	432.002014.2 Msg: moveForward", "Seconds: 107 Position: 332.268311.2,496.002014.2 
	Msg: moveForward", "Seconds: 107 Position: 280.268311.2,560.002014.2 Msg: moveForward", 
	"Seconds: 109 Position: 436.268311.2,624.002014.2 Msg: moveForward", "Seconds: 110 
	Position: 280.268311.2,688.002014.2 Msg: moveForward", "Seconds: 110 Position: 
	280.268311.2,752.002014.2 Msg: moveForward", "Seconds: 111 Position: 280.268311.2,
	816.002014.2 Msg: moveForward", "Seconds: 111 Msg: reachBartender", "Seconds: 112 
	Position: 384.268311.2,752.002014.2 Msg: moveBack2", "Seconds: 113 Position: 
	332.268311.2,688.002014.2 Msg: moveBack2", "Seconds: 114 Position: 436.268311.2,
	624.002014.2 Msg: moveBack2", "Seconds: 115 Position: 332.268311.2,560.002014.2 Msg: 
	moveBack2", "Seconds: 115 Position: 332.268311.2,496.002014.2 Msg: moveBack2", 
	"Seconds: 115 Position: 332.268311.2,432.002014.2 Msg: moveBack2", "Seconds: 117 
	Position: 228.268311.2,368.002014.2 Msg: moveBack2", "Seconds: 118 Position: 
	384.268311.2,304.002014.2 Msg: moveBack2", "Seconds: 119 Position: 280.268311.2,
	240.002014.2 Msg: moveBack2", "Seconds: 120 Position: 384.268311.2,176.002014.2 Msg: 
	moveBack2", "Seconds: 121 Position: 280.268311.2,112.002014.2 Msg: moveBack2", 
	"Seconds: 121 Msg: finishTwoBeers", " Msg: Bonus SecsRemaing: 1 Index: 3", "Seconds: 
	121 Position: 280.268311.2,112.001999.2 Msg: moveForward"],
		"scoreLevel": 6,
		"scoreName": "Sam",
		"DeviceGUID": "097F9769-3099-456B-AB7B-2C1DEF205CE0",
		"scoreDate": "2015-11-05 14:24",
		"scoreValue": 15310,
		"UserGUID": "562A18BB-46B6",
		"timeRemaining": 0
	},
	"Audio": true,
	"LeaderA": {
		"deviceid": "970A7E67-1227-42B9-B7A7-BD1A2891DDAF",
		"level": 7,
		"score": 19460,
		"name": "Tezza",
		"userid": "562BCB02-D5D5",
		"datetime": "2015-11-02 21:29"
	},
	"Character": 0,
	"Best-2": {
		"scoreLevel": 6,
		"scoreName": "Sam",
		"DeviceGUID": "097F9769-3099-456B-AB7B-2C1DEF205CE0",
		"scoreDate": "2015-11-08 06:49",
		"scoreValue": 17290,
		"UserGUID": "562A18BB-46B6",
		"timeRemaining": 0
	},
	"Username": "Sam",
	"Best-1": {
		"scoreLevel": 5,
		"scoreName": "Sam",
		"DeviceGUID": "097F9769-3099-456B-AB7B-2C1DEF205CE0",
		"scoreDate": "2015-10-29 11:13",
		"scoreValue": 17900,
		"UserGUID": "562A18BB-46B6",
		"timeRemaining": 15
	},
	"LeaderC": {
		"deviceid": "097F9769-3099-456B-AB7B-2C1DEF205CE0",
		"level": 5,
		"score": 17900,
		"name": "Sam",
		"userid": "562A18BB-46B6",
		"datetime": "2015-10-29 11:13"
	},
	"DeviceIdentifier": "097F9769-3099-456B-AB7B-2C1DEF205CE0",
	"scoreObj": {
		"scoreLevel": 6,
		"scoreName": "Sam",
		"DeviceGUID": "097F9769-3099-456B-AB7B-2C1DEF205CE0",
		"scoreDate": "2015-11-08 06:49",
		"scoreValue": 17290,
		"UserGUID": "562A18BB-46B6",
		"timeRemaining": 0
	}
}

*/