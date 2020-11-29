var express = require('express');
var mysql = require('../lib/db.js');
var router = express.Router();

// GET admin listing. 
router.get('/', function(req, res, next) {
    res.redirect('/admin/list?category=0&cur=1');
});

// Session Check
// 어드민 여부 체크 필요
var auth = function (req, res, next) {
  if (req.session.code != null){
  //비어있지 않다면 session이 저장되어 있는 것이다.
    next();
  }
  //세션이 비어있는 경우 Error라고 출력한다.
  else
    res.status(500).send("The wrong approach.");
};

//페이징 부분 구현은 아래 페이지를 이용.
//https://abc1211.tistory.com/533
router.get("/list", auth, function(req,res,next){
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

  mysql.query(sql, [category], function(err, result,next) {
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

    var paging_info = {
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
    //처리완료.
    var sql = 'SELECT * FROM trash_addrs WHERE validity=? ORDER BY adit_time DESC limit ?,?  ';
    mysql.query(sql, [category, no, page_size], function(err, result) {
      if(err){
        console.log(err);
        res.status(500).send("Internal Server Error");
      }
      res.render('list',{data:result, paging:paging_info});
    })
  })
})

//관리자 페이지에서 '보이게' 눌렀을때 처리
//지도에서 해당 마커가 출력되게 해준다.
router.post('/visible', auth, function(req,res, next){
  id = req.body.id;

  var sql = "UPDATE trash_addrs SET validity=?, adit_time=NOW() WHERE id = ? ";

  mysql.query(sql, [1, id], function(err, result) {
    if(err){
      console.log(err);
      res.status(500).send("Internal Server Error");
    }
    console.log("Record Updated!!");
    console.log(result);
  });
  res.redirect('/admin/list?category='+req.body.category+'&cur='+req.body.curPage);
});

//관리자 페이지에서 '안보이게' 를 눌렀을떄처리
//db에서는 지우지않고 지도에서만 안보이게 해준다.
router.post('/invisible',auth, function(req,res,next){
  id = req.body.id;

  var sql = "UPDATE trash_addrs SET validity=?, adit_time=NOW() WHERE id = ?";

  mysql.query(sql, [0, id], function(err, result) {
    if(err){
      console.log(err);
      res.status(500).send("Internal Server Error");
    }
    console.log("Record Updated!!");
    console.log(result);
    
  });
  res.redirect('/admin/list?category='+req.body.category+'&cur='+req.body.curPage);
});

//관리자 페이지에서 '삭제' 를 눌렀을떄처리
//db에서도 지우고 지도에서도 지운다. 
router.post('/delete',auth, function(req,res,next){
  id = req.body.id;

  var sql = "DELETE FROM trash_addrs WHERE id = ?";
  mysql.query(sql, [id], function(err, result) {
    if(err){
      console.log(err);
      res.status(500).send("Internal Server Error");
    }
    console.log("Record Updated!!");
    console.log(result);
  });

res.redirect('/admin/list?category='+req.body.category+'&cur='+req.body.curPage);
});

//logout구현.
//세션을 지우고 메인페이지로 이동한다. 
router.get('/admin_out', auth, function(req,res,next){
  if(req.session.code != null)
	{
		req.session.destroy();
		res.redirect('/');
	}
	else
  res.status(500).send("The wrong approach.");
})

module.exports = router;
