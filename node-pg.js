/*************************************************************************************************************
 *
 * Developed by : Gene Myers                                  Date: 18 July 2015
 * A Node.js server with PostgreSQL DB
 * 
 *************************************************************************************************************/
var pg = require("pg")
var http = require("http")
var port = 5433;
var host = '127.0.0.1';

//POST
var insert_records = function(req, res) {
   console.log("In insert");
   // Connect to DB
   var conString = "pg://postgres:postgres@localhost:5432/ligger";
   var client = new pg.Client(conString);
   client.connect(); 

    //console.log("POST Request obj: " + req);
    req.on('data', function(chunk) {
	      console.log("Received body data:");
	      console.log(chunk.toString());
	    });

	req.on('end', function() {
	      // empty 200 OK response for now
	      res.writeHead(200, "OK", {'Content-Type': 'text/html'});
	      res.end();
	      console.log("Data end.");
	    });
    
   //Drop table if it exists
   //client.query("DROP TABLE IF EXISTS scores");

   // Creat table and insert 2 records into it
   client.query("CREATE TABLE IF NOT EXISTS scores(userID text NOT NULL, deviceID text NOT NULL, name text, score integer, level integer, datetime text, log text, CONSTRAINT users_pkey PRIMARY KEY (userID, deviceID, datetime))");
   // Write output
   res.writeHead(200, {'Content-Type': 'text/plain'});
   res.write("0 records is inserted.\n");
   res.end();
   console.log("Inserted 0 records");
   }


  // GET
  var list_records = function(req, res) {
  console.log("In listing records");

  // Connect to DB
  var conString = "pg://postgres:postgres@localhost:5432/ligger";
  var client = new pg.Client(conString);
  client.connect(); 

  // Select all rows in the table
  var query = client.query("SELECT name, userID, deviceID, score, level FROM scores ORDER BY score DESC, userID DESC LIMIT 3");
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

//     // PUT
//     var update_record = function(req, res) {
//     console.log("In update");
// 
//     // Connect to DB
//     var conString = "pg://postgres:postgres@localhost:5432/ligger";
//     var client = new pg.Client(conString);
//     client.connect(); 
// 
//     // Update the record where the name is Bob
//     query = client.query("UPDATE scores set score = 1990 WHERE name='Bob'");
//      	res.writeHead(200, {'Content-Type': 'text/plain'});
//      	res.write("Updated record  - Set record with name Bob, a new score of 1990\n");
//      	res.end();
//     console.log("Updated record - Set record with name Bob, a new score");
//    }
// 
// // DELETE
// var delete_record = function(req, res) {
//    console.log("In delete");
// 
//    // Connect to DB
//    var conString = "pg://postgres:postgres@localhost:5432/ligger";
//     var client = new pg.Client(conString);
//     client.connect(); 
// 
//     // Delete the record where userID is 7890
//     client.query("DELETE FROM scores WHERE userID = '7890'");
//     res.writeHead(200, {'Content-Type': 'text/plain'});
//     res.write("Deleted record where userID was 7890\n");
//     res.end();
//     console.log("Deleted record where userID is 7890");
//     
// }


// Create server 
http.createServer(function(req, res) {
     
     if(req.method == 'POST') {
            insert_records(req,res);
     }
     else if(req.method == 'GET') {
         list_records(req,res);
     }
     // else if(req.method == 'PUT') {
     //     update_record(req,res);
     // }
     // else if(req.method == 'DELETE') {
     //     delete_record(req,res);
     // }
     else {
     	console.log("[405] " + req.method + " to " + req.url);
    	res.writeHead(405, "Method not supported", {'Content-Type': 'text/html'});
    	res.end('<html><head><title>405 - Method not supported</title></head><body><h1>Method not supported.</h1></body></html>');
  }
     
    
}).listen(port,host);
console.log("Connected to " + port + "   " + host);