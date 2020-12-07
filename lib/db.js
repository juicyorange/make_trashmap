var mysql = require('mysql');

var db = mysql.createConnection({

  // 로컬 mysql에서 가져올때 
  // host : 'localhost', 

  // aws 가상 컴퓨터의 주소에 있는 mysql에서 가져온다.
  host     : '사용할 db의 주소를 적어주세요',
  user     : 'root',
  password : '비밀번호를 입력해주세요.',
  database : 'trashmap',
  dateStrings: 'date'
});

db.connect();

module.exports = db;
