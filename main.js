var http = require('http');
var fs = require('fs');
var url = require('url');
var qs = require('querystring');
var path = require('path');
var mysql = require('./lib/db');
var template = require('./lib/map_making_template');
'<script type="text/javascript" src="//dapi.kakao.com/v2/maps/sdk.js?appkey=ec37ce7ff126878e77d2c814181f7794&libraries=services,clusterer,drawing"></script>';

//query문
var sql = 'SELECT * FROM trash_addrs';

//db에서 가져온 것을 담기위한 배열
var trash_data = new Array();

mysql.query(sql, async function(err, results, fields){
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
      trash_data.push(results[idx]);
      idx++;
    }
  }
});
mysql.end();


var app = http.createServer(function(request, response){
    var map_html = template.map_making(trash_data);
    response.writeHead(200);
    console.log("모바일 되니");
    response.end(map_html);
});

app.listen(3978);
