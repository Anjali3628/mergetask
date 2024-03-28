var mysql = require('mysql2');

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "mergerdatabase"
});

con.connect(function(err) {
  if (err) console.log(err);
  console.log("Connected!");
});


module.exports=con;