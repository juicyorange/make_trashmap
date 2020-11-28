var path = require('path');
var bodyParser = require('body-parser'); //req.body를 통해 요청을 받는다.
var express = require('express') // express 모듈. npm install express를 통해 설치가능.
var session = require('express-session'); // session를 위한 모듈


var app = express(); //express의 리턴값을 app에 담는다.

//세션설정
app.use(session({ 
  secret: 'keyboard cat', 
  resave: false, 
  çcookie: { maxAge: 60000*10 },
  saveUninitialized: true,
  }));

var indexRouter = require('./routes/index');
var adminRouter = require('./routes/admin');

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());//json타입으로 파싱


//public 디렉토리에 있는 파일들을 모두 받아온다.
//정적인 파일을 서비스할 수 있게 해준다.
app.use(express.static('public'));


app.use('/', indexRouter);
app.use('/admin', adminRouter);
app.post('/admin_check', function(req, res){
  admin_code = "iaubewgivgreinvlkjrbwljvhb"; //그냥 따로 가입없이 코드로 진행.
  code = req.body.code;
  if(code == admin_code){
    req.session.code = code
    req.session.save(function(err){});
    res.send(true);
  }
  else{
    console.log("뭐야");
    res.send(false);
  }
});


//서버가 비로소 여기에서 열린다. listen이 성공적으로 되면 function안에 있는 기능 수행.
app.listen(3978, function() {
  console.log('Example app listening on port 3978!')
});