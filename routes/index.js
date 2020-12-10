var express = require('express');
var mysql = require('../lib/db.js');
var router = express.Router();

var appkey = "키입력";

// GET main page.
router.get('/', function(req, res, next) {
    //query문
    //validity : (0: 표시x, 1: 표시o, 2: 추가요청, 3: 삭제요청)
    var sql = 'SELECT * FROM trash_addrs WHERE validity=1 or validity=3 ' ;

    mysql.query(sql, function(err, results, fields){
        //sql오류면 여기로 들어와 오류메시지 send
        if(err){
            console.log(err);
            res.status(500).send("Internal Server Error");
        }
        //잘 됬다면 쿼리문의 결과를 보내준다.
        res.render('index', { title: 'SEOUL TRASH MAP' , data: results , appkey : appkey} );
    });
});

router.post('/add', function(req,res, next){

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
    })
    res.status(200).send("Success request");
});

router.post('/invisible_wait', function(req,res, next){

    reason = req.body.reason;
    id = req.body.id;

    //validity : (0: 표시x, 1: 표시o, 2: 추가요청, 3: 삭제요청)
    //기존에 있던 정보들이기 때문에 일치하는 id를 찾아서 validity와 삭제이유만 추가해주면 된다.
    var sql = "UPDATE trash_addrs SET validity=?, reason=?, adit_time=NOW() WHERE id = ?";

    mysql.query(sql, [3, reason, id], function(err, result) {
        if(err){
            console.log(err);
            res.status(500).send("Internal Server Error");
        }
        console.log("Record Updated!!");
        console.log(result);
    });

    res.status(200).send("Success request");
});

module.exports = router;
