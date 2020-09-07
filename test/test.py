'''
 카카오 geodata 가져오기 
 error  구분은 if ( 'error_type' in r )
 위도, 경도 위치는 
 r['documents'][0]['road_address']['x']
 r['documents'][0]['road_address']['y']
'''

import requests
import json
import pandas as pd
import urllib
import openpyxl

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

addr_book = []

for i in sheet.rows:
    get_gu = i[1].value #구
    get_load = i[2].value #도로명
    get_addr = i[3].value #상세주소

    result = isinstance(get_addr,str) #받아온 주소가 str인지 확인.
    if result:
        addr = get_addr
    else:
        addr = str(get_load) + ' ' + str(get_addr)

    addr_book.append(str(addr))

idx = 0    
for addr in addr_book:
    a = getGPS_coordinate_for_KAKAO(addr, "66931185a093f52d46306e8486e8398c")
    print(type(addr))
    print(a['documents'])
    if a['documents'] != []: #비어있지 않은경우만 db에 넣어야 한다.
        if a['documents'][0] != None: #여기서 애매한것이 documents에는 값이 있는데 road_address가 없는 경우가 있다.
            idx = idx+1
            print(addr) #엑셀에서 받아온 상세주소
            print(a['documents'][0]['road_address']['x']) #x좌표
            print(a['documents'][0]['road_address']['y']) #y좌표
print (idx)
