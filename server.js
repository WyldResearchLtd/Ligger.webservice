/*************************************************************************************************************
 *
 * Developed by : Gene Myers
 * Date: 18 July 2015
 * A Node.js web service with PostgreSQL DB
 * 
 *************************************************************************************************************/
var pg = require("pg")
var http = require("http")
var port = 5433;
var host = '127.0.0.1';
//var strDBconn = "pg://postgres:postgres@localhost:5432/ligger";
var strDBconn = "pg://fezzee:f33ZZAR1@ligger.fezzee.net:5432/ligger";

//POST
var insert_records = function(req, res) {
   console.log("In insert");
   // Connect to DB
   //var strDBconn = "pg://postgres:postgres@"+ host+ ":" + port + "/ligger";
   var client = new pg.Client(strDBconn);
   client.connect(); 

   var data = "";

    //console.log("POST Request obj: " + req);
    req.on('data', function(chunk) {
	      data += chunk.toString();
	      console.log("Received body data:");
	      console.log(chunk.toString());
	});

	req.on('end', function() {
	      // empty 200 OK response for now
	      res.writeHead(200, "OK", {'Content-Type': 'text/html'});
	      res.end();
	      //data = "{\"Audio\":0}";
	      console.log("Data end.");
	      //add to DB here
	        try {
		        var jsonData = JSON.parse(data);
	            client.query("INSERT INTO scores(name, userID, deviceID, score, level, datetime, log, timeremaining) values($1, $2, $3, $4, $5, $6, $7, $8)", 
	              [jsonData.scoreObj.scoreName, 
	               jsonData.scoreObj.UserGUID, 
	               jsonData.scoreObj.DeviceGUID, 
	               jsonData.scoreObj.scoreValue, 
	               jsonData.scoreObj.scoreLevel, 
	               jsonData.scoreObj.scoreDate, 
	               jsonData, 
	               jsonData.scoreObj.timeRemaining]);
	            console.log("Inserted Score data");
		    } catch (e) {
			    console.log("Bad POST Data");
		        return false;
		    }
	});
    
   // Create table if it doesn't exist - NOTE- DB MUST exist!
   client.query("CREATE TABLE IF NOT EXISTS scores(userID text NOT NULL, deviceID text NOT NULL, name text, score integer, level integer, datetime text, log text, timeremaining integer, CONSTRAINT users_pkey PRIMARY KEY (userID, deviceID, datetime))");
   // Write output
   res.writeHead(200, {'Content-Type': 'text/plain'});
   res.write("POST data initialised\n");
   res.end();
   console.log("POST data initialised");
   }


  // GET
  var list_records = function(req, res) {
  console.log("In listing records");

  // Connect to DB
  //var strDBconn = "pg://postgres:postgres@"+ host+ ":" + port + "/ligger";
  var client = new pg.Client(strDBconn);
  client.connect(); 

  // Create table if it doesn't exist - NOTE- DB MUST exist!
  client.query("CREATE TABLE IF NOT EXISTS scores(userID text NOT NULL, deviceID text NOT NULL, name text, score integer, level integer, datetime text, log text, timeremaining integer, CONSTRAINT users_pkey PRIMARY KEY (userID, deviceID, datetime))");

  // Select the rows in the table, ordered and limited
  var query = client.query("SELECT name, userID, deviceID, score, level, datetime FROM scores ORDER BY score DESC, userID DESC LIMIT 3");
  //ASC or DESC
  query.on("row", function (row, result) {
    	 result.addRow(row);
   });
   query.on("end", function (result) {
      
   // On end JSONify and write the results to console and to HTML output
   console.log(JSON.stringify(result.rows, null, "    "));
    	res.writeHead(200, {'Content-Type': 'text/plain'});
    	res.write(JSON.stringify(result.rows) + "\n");
    	res.end();
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
