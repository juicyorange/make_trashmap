var http = require('http');
var fs = require('fs');
var url = require('url');
var qs = require('querystring');
var path = require('path');
var mysql = require('./lib/db');
var template = require('./lib/map_making_template');
var bodyParser = require('body-parser');
var ejs = require('ejs');
var express = require('express') // express 모듈. npm install express를 통해 설치가능.
var session = require('express-session')

'<script type="text/javascript" src="//dapi.kakao.com/v2/maps/sdk.js?appkey=ec37ce7ff126878e77d2c814181f7794&libraries=services,clusterer,drawing"></script>';

var app = express(); //express의 리턴값을 app에 담는다.

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//세션설정
app.use(session({ secret: 'keyboard cat', cookie: { maxAge: 60000*10 }}))

//public 디렉토리에 있는 파일들을 모두 받아온다.
//정적인 파일을 서비스할 수 있게 해준다.
app.use(express.static('public'));

//use를 사용해 매 접속마다 db에서 값을 갱신하도록 한다.
app.use(function(req, res, next){
    //query문
    //validity : (0: 표시x, 1: 표시o, 2: 추가요청, 3: 삭제요청)
  var sql = 'SELECT * FROM trash_addrs WHERE validity=1 or validity=3';
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
      req.trash_data = temp_trash_data;
      next();
    });
});

app.get('/', function(req, res){
  data = req.trash_data
  var map_html = template.map_making(data);
  res.send(map_html);
});

app.post('/add', function(req,res){

    trash_addr = req.body.addr;
    gu_name = req.body.gu_name;
    trash_lat = req.body.lat;
    trash_lng = req.body.lng;

    //validity : (0: 표시x, 1: 표시o, 2: 추가요청, 3: 삭제요청)
    var sql = "INSERT INTO trash_addrs (gu_name, trash_addr, trash_lng, trash_lat, validity, adit_time) VALUES(?,?,?,?,?,NOW())";
    mysql.query(sql, [gu_name, trash_addr, trash_lng, trash_lat, 2], function(err, result, field){
      if(err){
        console.log(err);
        res.status(500).send("Internal Server Error");
      }
      res.redirect('/');
    })
});

app.post('/invisible_wait', function(req,res){

  trash_addr = req.body.addr;
  gu_name = req.body.gu_name;
  trash_lat = req.body.lat;
  trash_lng = req.body.lng;
  id = req.body.id;

  var sql = "UPDATE trash_addrs SET validity=?, adit_time=NOW() WHERE id = ?";

  mysql.query(sql, [3, id], function(err, result) {
    console.log("Record Updated!!");
    console.log(result);
  });
res.redirect('/');
});


app.post('/admin', function(req,res){
  admin_code = "iaubewgivgreinvlkjrbwljvhb";
  code = req.body.code;
  if(code == admin_code){
    req.session.code = code
    req.session.save(function(err){});
    res.redirect("/admin/list?category=0&cur=1");
  }
  else{
    res.send("Wrong code");
  }
});

var auth = function (req, res, next) {
// Session Check
// 어드민 여부 체크 필요
if (req.session.code != null){
    //비어있지 않다면 session이 저장되어 있는 것이다.
    next();
}
//세션이 비어있는 경우 Error라고 출력한다.
else
  res.send("The wrong approach.");
};

app.post('/visible', auth, function(req,res){
  id = req.body.id;

  var sql = "UPDATE trash_addrs SET validity=?, adit_time=NOW() WHERE id = ?";

  mysql.query(sql, [1, id], function(err, result) {
    console.log("Record Updated!!");
    console.log(result);
  });
  res.redirect('/admin/list?category='+req.body.category+'&cur='+req.body.curPage);
});

app.post('/invisible',auth, function(req,res){
  id = req.body.id;

  var sql = "UPDATE trash_addrs SET validity=?, adit_time=NOW() WHERE id = ?";

  mysql.query(sql, [0, id], function(err, result) {
    console.log("Record Updated!!");
    console.log(result);
  });
  res.redirect('/admin/list?category='+req.body.category+'&cur='+req.body.curPage);
});

app.post('/delete',auth, function(req,res){
  id = req.body.id;

  var sql = "DELETE FROM trash_addrs WHERE id = ?";
  mysql.query(sql, [id], function(err, result) {
    console.log("Record Updated!!");
    console.log(result);
  });

res.redirect('/admin/list?category='+req.body.category+'&cur='+req.body.curPage);
});



app.get("/admin/list/",auth, function(req,res){
  ///admin/list?category=int&cur=int
  //한 페이지에 게시물 수
  var page_size = 10;
  //페이지의 갯수 : 1~10개 페이지
  var page_list_size = 10;
  //limit 변수
  var no = "";
  //전체 게시물의 숫자 (0으로 초기화)
  var totalPageCount = 0;
  //카테고리별 번호. (0: 표시x 처리, 1: 표시o 처리 , 2: 추가요청처리, 3: 삭제요청처리)(self)
  var category = req.query.category;

  var sql = 'SELECT count(*) as cnt FROM trash_addrs WHERE validity=?';

  mysql.query(sql, [category], function(err, result) {
    if(err){
      console.log(err);
      res.status(500).send("Internal Server Error");
    }
    //전체 게시물의 숫자.
    totalPageCount = result[0].cnt;
    //현재 페이지
    var curPage = req.query.cur;

    console.log("현재 페이지 : " + curPage, "전체 페이지 : " + totalPageCount);

    var totalPage = Math.ceil(totalPageCount /page_size);//전체 페이지수 ceil함수로 정수로 변환
    var totalSet = Math.ceil(totalPage/page_list_size);//전체 세트수(ex)1~10 1세트 1~15 2세트 1~33 : 4세트)
    var curSet = Math.ceil(curPage/page_list_size); //현재 세트번호
    var startPage = ((curSet-1)*10)+1; //현재 세트에서 출력된 시작 페이지 번호
    var endPage = (startPage + page_list_size) -1 ; //현재 세트내 출력될 마지막 페이지 번호
    
    //현재페이지가 0보다 작으면
    if(curPage<0){
      no = 0;
    }
    else{
      no = (curPage-1) *10; //db에서 가져올 첫번째 게시물 번호
    }

    var result2 = {
      "category": category,
      "curPage": curPage,
      "page_list_size": page_list_size,
      "page_size": page_size,
      "totalPage": totalPage,
      "totalSet": totalSet,
      "curSet": curSet,
      "startPage": startPage,
      "endPage": endPage
      };
      
    //나중에 db에 들어온 시간도 적어서 ORDER BY id해주자.
    var sql = 'SELECT * FROM trash_addrs WHERE validity=? limit ?,?';
    mysql.query(sql, [category, no, page_size], function(err, result) {
      if(err){
        console.log(err);
        res.status(500).send("Internal Server Error");
      }
      console.log("몇번부터 몇번까지냐~~~~~~~" + no);

      res.render('list',{data:result, paging:result2});
    })
  })
})

app.post('/admin_out', auth, function(req,res){
  if(req.session.code != null)
	{
		req.session.destroy();
		res.redirect('/');
	}
	else
		res.send("Session is not present");
})



//서버가 비로소 여기에서 열린다. listen이 성공적으로 되면 function안에 있는 기능 수행.
app.listen(3978, function() {
  console.log('Example app listening on port 3978!')
});