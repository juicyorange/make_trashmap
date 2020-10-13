var http = require('http');
var fs = require('fs');
var url = require('url');
var qs = require('querystring');
var path = require('path');
var mysql = require('./lib/db');
var template = require('./lib/map_making_template');
var express = require('express') // express 모듈. npm install express를 통해 설치가능.

'<script type="text/javascript" src="//dapi.kakao.com/v2/maps/sdk.js?appkey=ec37ce7ff126878e77d2c814181f7794&libraries=services,clusterer,drawing"></script>';


var app = express(); //express의 리턴값을 app에 담는다.

//public 디렉토리에 있는 파일들을 모두 받아온다.
//정적인 파일을 서비스할 수 있게 해준다.
app.use(express.static('public'));

//use를 사용해 매 접속마다 db에서 값을 갱신하도록 한다.
app.use(function(req, res, next){
    //query문
  var sql = 'SELECT * FROM trash_addrs';
    //db에서 가져온 것을 담기위한 배열
  var temp_trash_data = new Array();

  mysql.query(sql, function(err, results, fields){
      if(err){
        console.log(err);
        }
        else {
        //console.log(results) 어떤형식으로 넘어오는지 궁금하면 해보기!
        idx = 0;
        //주요 데이터들은 results에 저장되어 넘어온다. 함수의 두번째파라미터
        while(idx<results.length){
          //이렇게 넣어주지 않으면 result는 함수안의 데이터이기 때문에
          //함수가 종료되면 사라진다. 그래서 전역변수인 trash_data를 선언하고
          //그곳에 results의 값들을 하나하나 할당한다.
          temp_trash_data.push(results[idx]);
          idx++;
        }
      }
      req.trash_data = temp_trash_data
      mysql.end();
      next();
    });
});

app.get('/', function(req, res){
  data = req.trash_data
  var map_html = template.map_making(data);
  res.send(map_html);

});

//서버가 비로소 여기에서 열린다. listen이 성공적으로 되면 function안에 있는 기능 수행.
app.listen(3978, function() {
  console.log('Example app listening on port 3978!')
});