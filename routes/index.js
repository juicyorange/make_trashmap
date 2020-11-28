var express = require('express');
var mysql = require('../lib/db.js');
var router = express.Router();

/* GET main page. */
router.get('/', function(req, res, next) {
    //query문
    //validity : (0: 표시x, 1: 표시o, 2: 추가요청, 3: 삭제요청)
    var sql = 'SELECT * FROM trash_addrs WHERE validity=1 or validity=3';
    //db에서 가져온 것을 담기위한 배열
    var trash_data = new Array();

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
                trash_data.push(results[idx]);
                idx++;
            }
        }
        res.render('index', { title: 'SEOUL TRASH MAP' , data: trash_data});
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
    res.send({ok:true});
});

router.post('/invisible_wait', function(req,res, next){

    reason = req.body.reason;
    id = req.body.id;

    var sql = "UPDATE trash_addrs SET validity=?, reason=?, adit_time=NOW() WHERE id = ?";

    mysql.query(sql, [3, reason, id], function(err, result) {
        console.log("Record Updated!!");
        console.log(result);
    });

    res.send("200 ok");
});

module.exports = router;
