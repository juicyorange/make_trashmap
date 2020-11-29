var mysql = require('mysql');

var db = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'Kim@1468433',
  database : 'trashmap',
  dateStrings: 'date'
});

db.connect();

module.exports = db;
