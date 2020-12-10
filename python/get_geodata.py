import requests #인터넷에서 값을 요청하는 것.
import json #카카오map api에서 받아오는 데이터가 json 형식이다.
import urllib  #url처리할때 사용.
import openpyxl #엑셀파일 오픈
import pymysql.cursors #db연결
# import pprint #pprint 딕셔너리, 튜플, 리스트 등 다양한 자료형들을 보기좋게 출력해준다. 

# 카카오 developer에서 받은 REST API키를 입력하면 됩니다. 
# 카카오map api에서 발급가능.
rest_api_key = "키입력"

# mysql ########################## 
conn = pymysql.connect( 
    
    # 로컬 mysql에 넣을때
    # host='localhost', 

    # aws 가상 컴퓨터의 주소에 있는 mysql에 넣는다.
    host='', 
    user='root', 
    password='', 
    db='trashmap', 
    charset='utf8' 
    )

# 해당 함수의 내용 전부
# https://znznzn.tistory.com/53 참조.
def getGPS_coordinate_for_KAKAO(address, MYAPP_KEY):
    '''
    카카오 geodata 가져오기 
    위도, 경도 위치는 
    r['documents'][0]['road_address']['x']
    r['documents'][0]['road_address']['y']
    '''
    headers = {
        'Content-Type': 'application/json; charset=utf-8',  
        # MyAPP_KEY는 카카오 developer에서 REST API 키를 받아오면 된다.
        'Authorization': 'KakaoAK {}'.format(MYAPP_KEY)
    }
    address = address.encode("utf-8")
    #api에 요청할 쿼리문
    p = urllib.parse.urlencode({
            'query': address
        }
    )
    #get방식으로 헤더와 params를 넘겨준다.
    result = requests.get("https://dapi.kakao.com/v2/local/search/address.json", headers=headers, params=p)
    return result.json()


# 현재 스크립트와 같은 폴더에 위치한 엑셀 파일을 읽어온다.
wb = openpyxl.load_workbook('./python/data/trashcan_data.xlsx')

# 활성화된 시트를 새로운 변수에 할당한다.
sheet = wb.active

curs = conn.cursor() #mysql db연결
sql = """INSERT INTO trash_addrs(gu_name,trash_addr,trash_lng,trash_lat,validity, adit_time)
         VALUES (%s, %s, %s, %s, %s, NOW())"""  #sql문 작성

input_num = 0 #db에 몇개 들어갔는지 체크하기 위한 변수

for i in sheet.rows:
    # 상세주소 나중에 검색 더 잘되게 문법적으로 다듬기.. ex) 앞 이런거 뺴고 ( ) 이거 사이에 있는 글자 다 빼고!
    # 처음에는 상세주소만 했다가 검색이 안되면 도로명을 앞에 붙여서 검색하기. 2400
    # 앞, 뒤, 옆, 등 애매한 단어들 제거해보기 2399
    # 그냥 제일 처음에 숫자인 경우만 도로명을 추가해주고 나머지는 그냥 쓰는것이 성능이 제일 좋다. 2436 애초에 검색이 불가능한 주소는 어떤 처리를 해도 검색이 되는 경우가 거의 없다.
    # 어떤 거는 앞, 횡단보도, 도로, 사거리, 뒤 이런 주소가 있어도 검색이 되고 어떤 것은 안된다. 되고 안되고의 기준을 모르겠다. 숫자는 숫자만 있는경우에 검색이 불가능하니 도로명을
    # 추가해주는 작업을 해준다. 
    # 모든 주소에 대해 검색이 가능하게 문자열을 조합하는 것은 불가능한 것 같다. 
    # 중구 시청가로 명동 CGV앞 사거리 라는 주소가 엑셀파일에 있다.
    # 시청가로 명동 cgv도 안되고, 시청가로 cgv도 안되고, 시청가로 cgv 사거리, 중구 cgv, 중구 시청가로 cgv, 명동 cgv도 안된다.
    # 중구 신당가로	청구역 3번 출구 의 경우에도
    # 신당가로 청구역, 신당가로 청구역 3번, 중구 청구역, 중구 청구역 5호선, 청구역 5호선 모두 안된다.
    # 애초에 검색가능한 것들은 순서나 앞, 뒤, 옆 등 부수적인 단어랑 상관없이 검색이 가능한 것 같다. 안되는 것들은 그 주소와 비슷하게 변형시켜도 존재하지 않는다.
    # 독막로87 상수역 2번출구 앞 이거는 검색이 된다
    # 부족하더라도 검색되는 것만 정확히 넣고 검색이 안되는 것들은 사용자의 요청으로 채워넣자.

    get_gu = i[1].value #구
    get_load = i[2].value #도로명
    get_addr = i[3].value #상세주소

    '''
    딕셔너리 정보를 자세히 보고싶으면 주석처리 지우시오. 
    print(type(addr))
    pprint.pprint(a) -> 사용하려면 import pprint
    '''

    result = isinstance(get_addr,str) #받아온 주소가 str인지 확인. get_addr이 도로명의 숫자부분만 적혀있는 경우가 있음.
    if result:
        addr = get_addr
    else:
        addr = str(get_load) + ' ' + str(get_addr)

    a = getGPS_coordinate_for_KAKAO(addr, rest_api_key)

    if a['documents'] != []: #비어있지 않은경우만 db에 넣어야 한다. 비어있다면 해당주소에 대한 정보를 찾지 못한 것이다. 
        if a['documents'][0] != None: #여기서 애매한것이 documents에는 값이 있는데 road_address가 없는 경우가 있다.
            print(addr) #엑셀에서 받아온 상세주소
            #address가 비어있으면 road_address에 좌표가 들어가있고
            #road_address가 비어있으면 address에 좌표가 들어가있다.
            if a['documents'][0]['address'] != None:
                lng = a['documents'][0]['address']['x'] #x좌표
                lat = a['documents'][0]['address']['y'] #y좌표
                input_num = input_num+1
                curs.execute(sql, (get_gu, addr, lng, lat, 1)) #db에 쿼리문을 통해 넣기
            elif a['documents'][0]['road_address'] != None:
                lng = a['documents'][0]['road_address']['x'] #x좌표
                lat = a['documents'][0]['road_address']['y'] #y좌표
                input_num = input_num+1
                curs.execute(sql, (get_gu, addr, lng, lat, 1)) #db에 쿼리문을 통해 넣기
        
print(input_num,'개 들어갔습니다.') 
conn.commit()
conn.close()
