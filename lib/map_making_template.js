var template = {};
template.map_making = function(maker_data){
  var html = `<!DOCTYPE html>
    <html>
      <head>
          <meta charset="utf-8">
          <title>Seoul Trash_map</title>
      <style>
          body, html{
              width:100%;
              height:100%;
          }
          .map_wrap {position:relative;width:100%;height:100%;}
          .title {font-weight:bold;display:block;}
          .hAddr {position:absolute;left:10px;top:10px;border-radius: 2px;background:#fff;background:rgba(255,255,255,0.8);z-index:1;padding:5px;}
          .app_title {position:absolute;left:47%;top:10px;border-radius: 2px;background:#fff;background:rgba(255,255,255,0.8);z-index:1;padding:5px;}

          .input_code {position:absolute;right:10px;top:10px;border-radius: 2px;background:#fff;background:rgba(255,255,255,0.8);z-index:1;padding:5px;}
          #centerAddr {display:block;margin-top:2px;font-weight: normal;}
          .bAddr {padding:5px;text-overflow: ellipsis;overflow: hidden;white-space: nowrap;}
      </style>
      </head>

      <body>
        <div class="map_wrap">
            <div id="map" style="width:100%;height:100%;position:relative;overflow:hidden;"></div>
            <div class="hAddr">
                <span class="title">지도중심기준 행정동 주소정보</span>
                <span id="centerAddr"></span>
            </div>
            <div class="app_title">Trash Map</div>
            <div class="input_code">
                <form action="/admin" method="post">
                <input type="text" name="code">
                <input type="submit" value="코드입력">
                </form>
            </div>
         </div>

        <script type="text/javascript" src="//dapi.kakao.com/v2/maps/sdk.js?appkey=ec37ce7ff126878e77d2c814181f7794&libraries=services,clusterer,drawing"></script>
        <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
        <script>
          var mapContainer = document.getElementById('map'), // 지도를 표시할 div
              mapOption = {
                  center: new kakao.maps.LatLng(33.450701, 126.570667), // 지도의 중심좌표
                  level: 10 // 지도의 확대 레벨
              };

          var map = new kakao.maps.Map(mapContainer, mapOption); // 지도를 생성합니다
          var geocoder = new kakao.maps.services.Geocoder(); // 주소-좌표 변환 객체를 생성합니다

          //copyright
          kakao.maps.CopyrightPosition.BOTTOMRIGHT;

          var clusterer = new kakao.maps.MarkerClusterer({
                  map: map, // 마커들을 클러스터로 관리하고 표시할 지도 객체
                  averageCenter: true, // 클러스터에 포함된 마커들의 평균 위치를 클러스터 마커 위치로 설정
                  minLevel: 5 // 클러스터 할 최소 지도 레벨
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

          //현재 중심이 되는 위치 표시. 이때 지도를 이동하면 바로 변경된다.
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
            [36.6029863,126.5489114,'<div style="padding:5px">인포윈도우에 띄우고 싶은 내용</div>'],
            [36.6029863,126.1231231,'<div style="padding:5px">인포윈도우에 띄우고 싶은 내용</div>']
            ]
            이러한 형식으로 markers에 저장할것.
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

          var marker_data = ${JSON.stringify(maker_data)};

          //마커 이미지 변경
          var markerImage = new kakao.maps.MarkerImage(
            '/images/trash_can.png',
             new kakao.maps.Size(36, 28), new kakao.maps.Point(13, 34));

          for(var i=0;i<marker_data.length;i++){

            // 마커가 표시될 위치입니다
            var markerPosition  = new kakao.maps.LatLng(marker_data[i]['trash_lat'],marker_data[i]['trash_lng']);

            // 마커를 생성합니다
            var marker = new kakao.maps.Marker({
              position: markerPosition,
              image: markerImage
            });


            // 마커가 지도 위에 표시되도록 설정합니다
            marker.setMap(map);

            // 인포윈도우에 출력할 마커의 위치정보.
            var where = marker_data[i]['trash_addr'];

            var iwContent = '<div style="padding:5px">'+where+'</div>';
            iwPosition = markerPosition //인포윈도우 표시 위치입니다

            // 일반 인포윈도우를 생성합니다
            var infowindow = new kakao.maps.InfoWindow({
              position : iwPosition,
              content : iwContent
              });

            //markers에 만든 marker를 넣음.
            markers.push(marker);

            //인포윈도우를 지도에 출력하는 부분.
            kakao.maps.event.addListener(marker, 'mouseover', makeOverListener(map, marker, infowindow));
            kakao.maps.event.addListener(marker, 'mouseout', makeOutListener(infowindow));

            // 우클릭 했을때 띄울 인포윈도우
            var iwContent = '<div class="bAddr">' +
            '<span class="title">삭제요청</span>' + 
            where + 
            '</div>'+
            '<div>'+
                '<form action="/invisible_wait" method="post">'+
                    '<textarea name="reason" placeholder="삭제이유를 적어주세요"></textarea>'+
                    '<input type="hidden" name="id" value='+marker_data[i]['id']+'>'+
                    '<input type="submit" value="삭제요청">'+
                '</form>'+
                '<a href="https://map.kakao.com/link/map/길찾기는 여기서!,'+marker_data[i]['trash_lat']+','+marker_data[i]['trash_lng']+'" style="color:blue" target="_blank">지도에서보기</a>'+
            '</div>'
            ;
            iwRemoveable = true;

            // 인포윈도우를 생성합니다
            var dbclick_infowindow = new kakao.maps.InfoWindow({
                position : iwPosition, 
                content : iwContent,
                removable : iwRemoveable
            });
            //우클릭 이벤트
            kakao.maps.event.addListener(marker, 'rightclick', makeOverListener(map, marker, dbclick_infowindow));
          }

          // 클러스터러에 마커들을 추가합니다
          clusterer.addMarkers(markers);


        
        // 지도에 클릭 이벤트를 등록합니다
        // 지도를 클릭하면 마지막 파라미터로 넘어온 함수를 호출합니다
        // dbclick도 있는데 잘 생각해보고 구현하자. 일단 여기에서 서버로 데이터를 보내고 처리하는 것 부터 하자.
        // rightclick 으로 구현함. 나중에 지도 다른부분 일반 클릭하면 선택한 것 꺼지게 만들어놓자.
        kakao.maps.event.addListener(map, 'rightclick', function(mouseEvent) {        
            
            // 클릭한 위도, 경도 정보를 가져옵니다 
            var latlng = mouseEvent.latLng; 

            
            //좌표로 주소 변환
            searchDetailAddrFromCoords(latlng, function(result, status) {
                if (status === kakao.maps.services.Status.OK) {
                    var detailAddr = result[0].address.address_name ;
                    console.log(result);
                    //인포윈도우 정보  
                    var iwContent = '<div class="bAddr">' +
                    '<span class="title">법정동 주소정보</span>' + 
                    detailAddr + 
                    '</div>'+
                    '<form action="/add" method="post">'+
                        '<textarea name="addr">'+detailAddr+'</textarea>'+
                        '<input type="hidden" name="gu_name" value='+result[0].address.region_2depth_name+'>'+
                        '<input type="hidden" name="lat" value='+latlng.getLat()+'>'+
                        '<input type="hidden" name="lng" value='+latlng.getLng()+'>'+
                        '<input type="submit" value="추가요청">'+
                    '</form>';
                    iwPosition = latlng; //인포윈도우 표시 위치입니다
                    iwRemoveable = true;
        
                    // 인포윈도우를 생성합니다
                    var infowindow = new kakao.maps.InfoWindow({
                        position : iwPosition, 
                        content : iwContent,
                        removable : iwRemoveable
                    });

                    // 마커 위에 인포윈도우를 표시합니다. 두번째 파라미터인 marker를 넣어주지 않으면 지도 위에 표시됩니다
                    infowindow.open(map); 
                }
            });
        });

        
        </script>
      </body>
    </html>
    `;
  return html;
}

module.exports = template;
