var http = require('http');
var fs = require('fs');
var url = require('url');
var qs = require('querystring');
var path = require('path');
var mysql = require('mysql');
var template = require('./template.js')
// 비밀번호는 별도의 파일로 분리해서 버전관리에 포함시키지 않아야 합니다.
var conn = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'Kim@1468433',
  database : 'trashmap'
});

var sql = 'SELECT * FROM trash_addrs';
var trash_data = new Array();
conn.query(sql, async function(err, results, fields){
  if(err){
    console.log(err);
  }
  else {
    idx = 0;
    while(idx<results.length){
      trash_data.push(results[idx]);
      idx++;
    }
  }
});

conn.end();


function map_making(get_trash_data){
  var html = `<!DOCTYPE html>
    <html>
      <head>
          <meta charset="utf-8">
          <title>geolocation으로 마커 표시하기</title>
      		<style>
          .map_wrap {position:relative;width:100%;height:350px;}
          .title {font-weight:bold;display:block;}
          .hAddr {position:absolute;left:10px;top:10px;border-radius: 2px;background:#fff;background:rgba(255,255,255,0.8);z-index:1;padding:5px;}
          #centerAddr {display:block;margin-top:2px;font-weight: normal;}
          .bAddr {padding:5px;text-overflow: ellipsis;overflow: hidden;white-space: nowrap;}
      </style>
      </head>

      <body>
        <p style="margin-top:-12px">
            <b>Chrome 브라우저는 https 환경에서만 geolocation을 지원합니다.</b> 참고해주세요.
        </p>
        <div class="map_wrap">
            <div id="map" style="width:100%;height:100%;position:relative;overflow:hidden;"></div>
            <div class="hAddr">
                <span class="title">지도중심기준 행정동 주소정보</span>
                <span id="centerAddr"></span>
            </div>
        </div>

        <script type="text/javascript" src="//dapi.kakao.com/v2/maps/sdk.js?appkey=ec37ce7ff126878e77d2c814181f7794&libraries=services,clusterer,drawing"></script>
        <script>
          var mapContainer = document.getElementById('map'), // 지도를 표시할 div
              mapOption = {
                  center: new kakao.maps.LatLng(33.450701, 126.570667), // 지도의 중심좌표
                  level: 10 // 지도의 확대 레벨
              };

          var map = new kakao.maps.Map(mapContainer, mapOption); // 지도를 생성합니다
          var geocoder = new kakao.maps.services.Geocoder(); // 주소-좌표 변환 객체를 생성합니다

          var clusterer = new kakao.maps.MarkerClusterer({
                  map: map, // 마커들을 클러스터로 관리하고 표시할 지도 객체
                  averageCenter: true, // 클러스터에 포함된 마커들의 평균 위치를 클러스터 마커 위치로 설정
                  minLevel: 10 // 클러스터 할 최소 지도 레벨
              });

          // HTML5의 geolocation으로 사용할 수 있는지 확인합니다
          if (navigator.geolocation) {

              // GeoLocation을 이용해서 접속 위치를 얻어옵니다
              navigator.geolocation.getCurrentPosition(function(position) {

                  var lat = position.coords.latitude, // 위도
                      lon = position.coords.longitude; // 경도

                  var locPosition = new kakao.maps.LatLng(lat, lon), // 마커가 표시될 위치를 geolocation으로 얻어온 좌표로 생성합니다
                      message = '<div style="padding:5px;">여기에 계신가요?!</div>'; // 인포윈도우에 표시될 내용입니다
                  // 마커와 인포윈도우를 표시합니다
                  displayMarker(locPosition, message);
                });

          } else { // HTML5의 GeoLocation을 사용할 수 없을때 마커 표시 위치와 인포윈도우 내용을 설정합니다

              var locPosition = new kakao.maps.LatLng(33.450701, 126.570667),
                  message = 'geolocation을 사용할수 없어요..'

              displayMarker(locPosition, message);

          }
          searchAddrFromCoords(map.getCenter(), displayCenterInfo);

          // 지도에 마커와 인포윈도우를 표시하는 함수입니다
          function displayMarker(locPosition, message) {

              // 마커를 생성합니다
              var marker = new kakao.maps.Marker({
                  map: map,
                  position: locPosition
              });

              var iwContent = message, // 인포윈도우에 표시할 내용
                  iwRemoveable = true;

              // 인포윈도우를 생성합니다
              var infowindow = new kakao.maps.InfoWindow({
                  content : iwContent,
                  removable : iwRemoveable
              });

              // 인포윈도우를 마커위에 표시합니다
              infowindow.open(map, marker);

              // 지도 중심좌표를 접속위치로 변경합니다
              map.setCenter(locPosition);
          }
          kakao.maps.event.addListener(map, 'idle', function() {
              searchAddrFromCoords(map.getCenter(), displayCenterInfo);
          });

          function searchAddrFromCoords(coords, callback) {
              // 좌표로 행정동 주소 정보를 요청합니다
              geocoder.coord2RegionCode(coords.getLng(), coords.getLat(), callback);
          }

          function searchDetailAddrFromCoords(coords, callback) {
              // 좌표로 법정동 상세 주소 정보를 요청합니다
              geocoder.coord2Address(coords.getLng(), coords.getLat(), callback);
          }

          // 지도 좌측상단에 지도 중심좌표에 대한 주소정보를 표출하는 함수입니다
          function displayCenterInfo(result, status) {
              if (status === kakao.maps.services.Status.OK) {
                  var infoDiv = document.getElementById('centerAddr');

                  for(var i = 0; i < result.length; i++) {
                      // 행정동의 region_type 값은 'H' 이므로
                      if (result[i].region_type === 'H') {
                          infoDiv.innerHTML = result[i].address_name;
          								console.log(result[i].region_2depth_name);
                          break;
                      }
                  }
              }
          }
          var markers = [];
          /*
          var 데이터 = [
            [36.6029863,126.5489114,'<div style="padding:5px">신신약국</div>'],
            [36.6029863,126.1231231,'<div style="padding:5px">ㅇㅏㅇ</div>']
            ]
          */
          // 인포윈도우를 표시하는 클로저를 만드는 함수입니다
          function makeOverListener(map, marker, infowindow) {
              return function() {
                  infowindow.open(map, marker);
                };
              }
          // 인포윈도우를 닫는 클로저를 만드는 함수입니다
          function makeOutListener(infowindow) {
              return function() {
                  infowindow.close();
                };
              }

          var trash_data = ${JSON.stringify(get_trash_data)};

          for(var i=0;i<trash_data.length;i++){
            // 마커가 표시될 위치입니다
            var markerPosition  = new kakao.maps.LatLng(trash_data[i]['trash_lat'],trash_data[i]['trash_lng']);
            console.log(trash_data[i]['trash_lat']);
            // 마커를 생성합니다
            var marker = new kakao.maps.Marker({
              position: markerPosition
            });

            // 마커가 지도 위에 표시되도록 설정합니다
            marker.setMap(map);
            var where = trash_data[i]['trash_addr'];
            var iwContent = '<div style="padding:5px">'+where+'</div>';
            iwPosition = markerPosition //인포윈도우 표시 위치입니다

            // 인포윈도우를 생성합니다
            var infowindow = new kakao.maps.InfoWindow({
              position : iwPosition,
              content : iwContent
              });

            markers.push(marker);

            kakao.maps.event.addListener(marker, 'mouseover', makeOverListener(map, marker, infowindow));
            kakao.maps.event.addListener(marker, 'mouseout', makeOutListener(infowindow));
          }

          // 클러스터러에 마커들을 추가합니다
          clusterer.addMarkers(markers);
        </script>
      </body>
    </html>
    `;
  return html;
};

var app = http.createServer(function(request, response){

    _html = map_making(trash_data);
    response.writeHead(200);
    response.end(_html);
});

app.listen(3978);
