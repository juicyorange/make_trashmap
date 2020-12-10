var mysql = require('mysql');

var db = mysql.createConnection({

  // 로컬 mysql에서 가져올때 
  // host : 'localhost', 

  // aws 가상 컴퓨터의 주소에 있는 mysql에서 가져온다.
  host     : '',
  user     : 'root',
  password : '',
  database : 'trashmap',
  dateStrings: 'date'
});

db.connect();

module.exports = db;
