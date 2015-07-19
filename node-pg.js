/*************************************************************************************************************
 *
 * Developed by : Tinniam V Ganesh                                  Date: 20 July 2014
 * A Node.js server with PostgreSQL DB
 * 
 *************************************************************************************************************/
var pg = require("pg")
var http = require("http")
var port = 5433;
var host = '127.0.0.1';

//Insert 2 records into the emps table
var insert_records = function(req, res) {
   console.log("In insert");
   // Connect to DB
   var conString = "pg://postgres:postgres@localhost:5432/ligger";
   var client = new pg.Client(conString);
   client.connect(); 

   //Drop table if it exists
   //client.query("DROP TABLE IF EXISTS scores");

   // Creat table and insert 2 records into it
   client.query("CREATE TABLE IF NOT EXISTS scores(name text, userID text, deviceID text, score integer, level integer)");
   client.query("INSERT INTO scores(name, userID, deviceID, score, level) values($1, $2, $3, $4, $5)", ['MajesticPotatoe', '12345', 'abcdef', 2200, 4]);
   client.query("INSERT INTO scores(name, userID, deviceID, score, level) values($1, $2, $3, $4, $5)", ['Bob', '7890','blockhead',1900,5]);

   // Write output
   res.writeHead(200, {'Content-Type': 'text/plain'});
   res.write("2 records is inserted.\n");
   res.end();
   console.log("Inserted 2 records");
   }


  // List records the records in the games table
  var list_records = function(req, res) {
  console.log("In listing records");

  // Connect to DB
  var conString = "pg://postgres:postgres@localhost:5432/ligger";
  var client = new pg.Client(conString);
  client.connect(); 

  // Select all rows in the table
  var query = client.query("SELECT name, userID, deviceID, score, level FROM scores ORDER BY name");
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

    // Update a record in the emps table
    var update_record = function(req, res) {
    console.log("In update");

    // Connect to DB
    var conString = "pg://postgres:postgres@localhost:5432/ligger";
    var client = new pg.Client(conString);
    client.connect(); 

    // Update the record where the name is Bob
    query = client.query("UPDATE emps set score = 1990 WHERE name='Bob'");
     	res.writeHead(200, {'Content-Type': 'text/plain'});
     	res.write("Updated record  - Set record with name Bob, a new score of 1990\n");
     	res.end();
    console.log("Updated record - Set record with name Bob, a new score");
   }

//Delete record
var delete_record = function(req, res) {
   console.log("In delete");

   // Connect to DB
   var conString = "pg://postgres:postgres@localhost:5432/scores";
    var client = new pg.Client(conString);
    client.connect(); 

    // Delete the record where userID is 7890
    client.query("DELETE FROM  scores WHERE userID = '7890'");
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.write("Deleted record where userID was 7890\n");
    res.end();
    console.log("Deleted record where userID is 7890");
    
}


// Create a server 
http.createServer(function(req, res) {
     
     if(req.method == 'POST') {
            insert_records(req,res);
     }
     else if(req.method == 'GET') {
         list_records(req,res);
     }
     else if(req.method == 'PUT') {
         update_record(req,res);
     }
     else if(req.method == 'DELETE') {
         delete_record(req,res);
     }
     
    
}).listen(port,host);
console.log("Connected to " + port + "   " + host);
