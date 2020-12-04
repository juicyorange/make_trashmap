var mysql = require('mysql');

var db = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '비밀번호를 입력해주세요.',
  database : 'trashmap',
  dateStrings: 'date'
});

db.connect();

module.exports = db;
