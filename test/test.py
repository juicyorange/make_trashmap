'''
 카카오 geodata 가져오기 
 error  구분은 if ( 'error_type' in r )
 위도, 경도 위치는 
 r['documents'][0]['road_address']['x']
 r['documents'][0]['road_address']['y']
'''

import requests #인터넷에서 값을 요청하는 것.
import json
import pandas as pd
import urllib  #url파싱할때 사용.
import openpyxl #엑셀파일 오픈
import pprint  #파이썬에서 리스트, 딕셔너리 등을 보기좋게 출력
import pymysql.cursors #db연결

def getGPS_coordinate_for_KAKAO(address, MYAPP_KEY):
    headers = {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': 'KakaoAK {}'.format(MYAPP_KEY)
    }
    address = address.encode("utf-8")
    p = urllib.parse.urlencode(
        {
            'query': address
        }
    )
    result = requests.get("https://dapi.kakao.com/v2/local/search/address.json", headers=headers, params=p)
    return result.json()
#MyAPP_KEY는 카카오 developer에서 REST API 키를 받아오면 된다. 


# 현재 스크립트와 같은 폴더에 위치한 엑셀 파일을 읽어옵니다.
wb = openpyxl.load_workbook('test/rt.xlsx')

# 엑셀 파일 내 모든 시트 이름을 출력합니다.
#print(wb.sheetnames)

# 활성화된 시트를 새로운 변수에 할당합니다.
sheet = wb.active

# 시트 제목을 출력합니다.
#print(sheet['A1'].value)

# mysql ########################## 
conn = pymysql.connect( 
    host='localhost', 
    user='root', 
    password='Kim@1468433', 
    db='trashmap', 
    charset='utf8' 
    )
curs = conn.cursor() #mysql db연결
sql = """INSERT INTO trash_addrs(gu_name,trash_addr,trash_lng,trash_lat)
         VALUES (%s, %s, %s, %s)""" #sql문 작성

idx = 0
for i in sheet.rows:
    get_gu = i[1].value #구
    get_load = i[2].value #도로명
    get_addr = i[3].value #상세주소
    #상세주소 나중에 검색 더 잘되게 문법적으로 다듬기.. ex) 앞 이런거 뺴고 ( ) 이거 사이에 있는 글자 다 빼고!

    result = isinstance(get_addr,str) #받아온 주소가 str인지 확인.
    if result:
        addr = get_addr
    else:
        addr = str(get_load) + ' ' + str(get_addr)

    a = getGPS_coordinate_for_KAKAO(addr, "66931185a093f52d46306e8486e8398c")
    ''' 딕셔너리 정보 출력해서 테스트
    print(type(addr))
    pprint.pprint(a)
    '''
    if a['documents'] != []: #비어있지 않은경우만 db에 넣어야 한다.
        if a['documents'][0] != None: #여기서 애매한것이 documents에는 값이 있는데 road_address가 없는 경우가 있다.
            print(addr) #엑셀에서 받아온 상세주소
            #address가 비어있으면 road_address에 좌표가 들어가있고
            #road_address가 비어있으면 address에 좌표가 들어가있다.
            if a['documents'][0]['address'] != None:
                lng = a['documents'][0]['address']['x'] #x좌표
                lat = a['documents'][0]['address']['y'] #y좌표
                print(get_gu)
                idx = idx+1
                curs.execute(sql, (get_gu, addr, lng, lat))
            elif a['documents'][0]['road_address'] != None:
                lng = a['documents'][0]['road_address']['x'] #x좌표
                lat = a['documents'][0]['road_address']['y'] #y좌표
                print(get_gu)
                idx = idx+1
                curs.execute(sql, (get_gu, addr, lng, lat))

print (idx) #1100개중 242개만 검색이된다. 특정구가 데이터를 잘 정리하지 않아서 그런것 같다.
conn.commit()
conn.close()
