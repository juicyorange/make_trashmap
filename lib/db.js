var mysql = require('mysql');

var db = mysql.createConnection({
  host     : '',
  user     : 'root',
  password : '',
  database : 'trashmap',
  dateStrings: 'date'
});

db.connect();

module.exports = db;
