# -*- coding: utf-8 -*-
"""1년치 업로드 캘린더 생성기.
   하루 2~3개(1~14일) → 5개(15일~)로 늘려 약 1,790개 슬롯을 채운다.
   출력: youtube-forms/plan/upload-calendar-2027.xlsx (+ 같은 내용 CSV)
"""
import csv, datetime as dt, itertools, os, random
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter
from openpyxl.comments import Comment

random.seed(7)
OUT = os.path.dirname(os.path.abspath(__file__))
START = dt.date(2027, 1, 4)          # 월요일 시작 (사용자가 바꾸면 됨)
YEAR = START.year
DAYS = 365

# ───────────────────────────── 언어 ─────────────────────────────
LANG = {
 'EN': dict(name='영어',       rpm='$2~5',   note='전 세계 · 단가 최고 · 모든 서식'),
 'KO': dict(name='한국어',     rpm='$1.5~2.5', note='연 출국 3,000만 · 직접 제작 품질'),
 'HI': dict(name='힌디어',     rpm='$0.3~0.8', note='유튜브 1위 시장 · 거의 모든 나라 비자 필요 · 제목은 영어 혼용'),
 'ES': dict(name='스페인어',   rpm='$1~3',   note='멕시코·스페인·중남미 · 경쟁 영상 적음'),
 'ID': dict(name='인도네시아어', rpm='$0.3~0.8', note='유튜브 3위 · 말레이·싱가포르·한일·사우디 수요'),
 'JA': dict(name='일본어',     rpm='$2~4',   note='단가 높음 · 한국·대만·미국 수요'),
 # 2차 확장(하반기)
 'PT': dict(name='포르투갈어', rpm='$0.8~2', note='브라질 1.5억 · 하반기 확장'),
 'ZH': dict(name='중국어(번체)', rpm='$1.5~3', note='대만·홍콩 · 본토는 유튜브 차단'),
 'TH': dict(name='태국어',     rpm='$0.5~1.2', note='한국·일본 여행 급증'),
 'VI': dict(name='베트남어',   rpm='$0.3~0.8', note='한국·일본·대만 노동·관광'),
}
CORE = ['EN', 'KO', 'HI', 'ES', 'ID', 'JA']
EXT = ['PT', 'ZH', 'TH', 'VI']

# ─────────────────────── 국가·서식 DB (tier S/A/B) ───────────────────────
# fields: country, flag, tier, topics[(code, 서식명, 공식URL, 비용, 유효/제출시점, CAPTCHA, 비고)], exclude_lang
V = '확인 필요'
DB = [
 # ── S ──
 ('미국','🇺🇸','S',[('ESTA','ESTA 전자여행허가','https://esta.cbp.dhs.gov','$40','2년, 출발 72시간 전 권장','있음','사기 대행 사이트 多'),
                   ('DS160','DS-160 관광비자 신청서','https://ceac.state.gov/genniv','$185','인터뷰 예약 별도','있음','사진 규격 자주 반려'),
                   ('I94','I-94 입국기록 확인·출력','https://i94.cbp.dhs.gov','무료','체류기간 확인용','없음','')],[]),
 ('영국','🇬🇧','S',[('UKETA','UK ETA 전자여행허가','https://www.gov.uk/guidance/apply-for-an-electronic-travel-authorisation-eta','£16','2년, 앱 신청','없음(앱)','한국인 2025~ 필수'),
                   ('UKVISA','영국 방문비자 온라인 신청','https://www.gov.uk/standard-visitor','£127~',V,'없음','인도·필리핀 등')],[]),
 ('EU 쉥겐','🇪🇺','S',[('SCHENGEN','쉥겐 비자 신청서 작성','https://home-affairs.ec.europa.eu','€90',V,'없음','인도·필리핀·인니 등 비자 필요국'),
                      ('EES','EES 생체정보 등록 절차','https://travel-europe.europa.eu/ees_en','무료','2025.10~ 시행','없음','공항 키오스크 안내'),
                      ('ETIAS','ETIAS 신청법(시행 시)','https://travel-europe.europa.eu/etias_en','€20','2026 Q4~2027 시행 예정 · '+V,V,'시행 확정 후 제작')],[]),
 ('일본','🇯🇵','S',[('VJW','Visit Japan Web 등록·QR','https://vjw-lp.digital.go.jp','무료','입국 전 언제든','없음','한국인 연 900만'),
                   ('JPVISA','일본 e-Visa 신청','https://www.evisa.mofa.go.jp','무료~','인도·필리핀·베트남 등',V,'')],['JA']),
 ('한국','🇰🇷','S',[('KETA','K-ETA 신청','https://www.k-eta.go.kr','₩10,000','3년, 72시간 전','있음','22개국 면제 2026.12.31 종료 예정 · '+V),
                   ('KARR','e-Arrival Card 전자입국신고서','https://www.e-arrivalcard.go.kr','무료','도착 3일 전','없음','2026.1~ 종이 대체'),
                   ('KVISA','한국 관광비자(C-3) 온라인','https://www.visa.go.kr','₩~',V,'없음','인니·베트남·필리핀')],['KO']),
 ('태국','🇹🇭','S',[('TDAC','TDAC 태국 디지털 입국카드','https://tdac.immigration.go.th','무료','도착 3일 전','없음','2025.5~'),
                   ('THVISA','태국 e-Visa','https://www.thaievisa.go.th','฿~',V,'없음','인도·중국 등')],['TH']),
 ('캐나다','🇨🇦','S',[('ETA','캐나다 eTA','https://www.canada.ca/eta','C$7','5년','없음','사기 사이트 多'),
                     ('CAVISA','캐나다 방문비자(TRV) 온라인','https://www.canada.ca/en/immigration-refugees-citizenship','C$100',V,'없음','인도·필리핀')],[]),
 ('호주','🇦🇺','S',[('AUETA','호주 ETA 앱 신청','https://www.homeaffairs.gov.au/eta','A$20','1년','없음(앱)','한국·일본·미국 등'),
                   ('EVIS','eVisitor(유럽 여권)','https://immi.homeaffairs.gov.au','무료','1년','없음',''),
                   ('V600','방문비자 subclass 600','https://immi.homeaffairs.gov.au','A$195~',V,'없음','인도·인니·필리핀'),
                   ('ATD','Australia Travel Declaration 디지털 입국신고','https://www.abf.gov.au','무료','2026~ 단계 도입 · '+V,'없음','공항별 확대 중')],[]),
 ('중국','🇨🇳','S',[('CNARR','중국 온라인 입국신고서','https://s.nia.gov.cn/ArrivalCardFillingPC/','무료','도착 72시간 전','없음','2025.11.20~'),
                   ('CNFREE','중국 무비자 입국 조건·240시간 경유','https://www.nia.gov.cn','무료','국가별 상이 · '+V,'없음','한국 30일 무비자'),
                   ('CNVISA','중국 비자 온라인 신청서(COVA)','https://cova.mfa.gov.cn','¥~',V,'없음','인도·미국 등')],[]),
 ('베트남','🇻🇳','S',[('VNEV','베트남 e-Visa 신청','https://evisa.gov.vn','$25','90일, 3~5영업일','있음','한국인 45일 무비자 초과 시')],['VI']),
 ('싱가포르','🇸🇬','S',[('SGAC','SG Arrival Card(웹·MyICA)','https://eservices.ica.gov.sg/sgarrivalcard','무료','도착 3일 전','없음','전 외국인'),
                       ('SGVISA','싱가포르 비자(인도 등)','https://www.ica.gov.sg','S$30',V,'없음','')],[]),
 ('말레이시아','🇲🇾','S',[('MDAC','MDAC 디지털 입국카드','https://imigresen-online.imi.gov.my/mdac/main','무료','도착 3일 전','있음','싱가포르 국적 제외'),
                         ('MYVISA','eNTRI·eVisa(인도·중국)','https://www.windowmalaysia.my','RM~',V,'없음','')],[]),
 ('UAE','🇦🇪','S',[('UAEV','두바이·UAE 관광비자 온라인','https://smartservices.icp.gov.ae','AED~','60일 등 · '+V,'없음','항공사 경유 신청도 안내')],[]),
 ('튀르키예','🇹🇷','S',[('TREV','튀르키예 e-Visa','https://www.evisa.gov.tr','$~','180일 중 90일','없음','사기 사이트 多')],[]),
 ('인도','🇮🇳','S',[('INEV','인도 e-Visa','https://indianvisaonline.gov.in/evisa','$25~','30일/1년/5년','있음','사진·여권 스캔 규격 반려 多')],['HI']),
 # ── A ──
 ('인도네시아','🇮🇩','A',[('ALLID','All Indonesia 통합 입국카드','https://allindonesia.imigrasi.go.id','무료','도착 3일 전','없음','2025~'),
                         ('EVOA','e-VOA 발리 도착비자','https://molina.imigrasi.go.id','IDR 500k','30일','없음','')],['ID']),
 ('필리핀','🇵🇭','A',[('ETRAVEL','eTravel 등록','https://etravel.gov.ph','무료','도착 72시간 전','없음','한국인 1위 방문국')],[]),
 ('뉴질랜드','🇳🇿','A',[('NZETA','NZeTA + IVL','https://nzeta.immigration.govt.nz','NZ$17~','2년','없음',''),('NZTD','NZ Traveller Declaration','https://www.travellerdeclaration.govt.nz','무료','도착 24시간 전','없음','')],[]),
 ('사우디아라비아','🇸🇦','A',[('SAEV','사우디 관광 e-Visa','https://visa.visitsaudi.com','SAR 535','1년 복수','없음','움라 포함')],[]),
 ('대만','🇹🇼','A',[('TWAC','대만 온라인 입국신고서','https://niaspeedy.immigration.gov.tw/webacard','무료','입국 전','없음',''),('TWAUTH','대만 온라인 입국허가(동남아 등)','https://niaspeedy.immigration.gov.tw/nia_southeast','무료',V,'없음','')],['ZH']),
 ('이집트','🇪🇬','A',[('EGEV','이집트 e-Visa','https://visa2egypt.gov.eg','$25','30일','없음','')],[]),
 ('스리랑카','🇱🇰','A',[('LKETA','스리랑카 ETA','https://eta.gov.lk','$50',V,'없음','')],[]),
 ('캄보디아','🇰🇭','A',[('KHEV','캄보디아 e-Visa','https://www.evisa.gov.kh','$36','30일','없음',''),('KHARR','캄보디아 e-Arrival','https://arrival.gov.kh','무료','도착 7일 전','없음','')],[]),
 ('멕시코','🇲🇽','A',[('MXFMM','멕시코 입국(FMM 디지털·여행자 카드)','https://www.inm.gob.mx','무료',V,'없음','공항별 상이')],['ES']),
 ('브라질','🇧🇷','A',[('BREV','브라질 e-Visa(미·캐·호)','https://brazil.vfsevisa.com','$80.90','10년','없음','2025.4~')],['PT']),
 ('홍콩','🇭🇰','A',[('HKPAR','홍콩 사전등록(인도 국적)','https://www.immd.gov.hk','무료','6개월','없음','')],[]),
 ('카타르','🇶🇦','A',[('QAHAYYA','카타르 Hayya 비자','https://hayya.qa','QAR~',V,'없음','')],[]),
 ('몰디브','🇲🇻','A',[('IMUGA','IMUGA 여행자 신고','https://imuga.immigration.gov.mv','무료','출발 96시간 전','없음','')],[]),
 ('모로코','🇲🇦','A',[('MAEV','모로코 e-Visa','https://www.acces-maroc.ma','MAD~',V,'없음','')],[]),
 ('케냐','🇰🇪','A',[('KEETA','케냐 eTA','https://www.etakenya.go.ke','$30','90일','없음','')],[]),
 ('오만','🇴🇲','A',[('OMEV','오만 e-Visa','https://evisa.rop.gov.om','OMR~',V,'없음','')],[]),
 ('네팔','🇳🇵','A',[('NPVOA','네팔 도착비자 온라인 사전신청','https://nepaliport.immigration.gov.np','$30~','15일 전','없음','')],[]),
 ('라오스','🇱🇦','A',[('LAEV','라오스 e-Visa','https://laoevisa.gov.la','$50','30일','없음','')],[]),
 ('몽골','🇲🇳','A',[('MNEV','몽골 e-Visa','https://evisa.mn','$~',V,'없음','')],[]),
 ('우즈베키스탄','🇺🇿','A',[('UZEV','우즈베키스탄 e-Visa','https://e-visa.gov.uz','$20','30일','없음','')],[]),
 # ── B ──
 ('조지아','🇬🇪','B',[('GEEV','조지아 e-Visa','https://www.evisa.gov.ge','$20',V,'없음','')],[]),
 ('카자흐스탄','🇰🇿','B',[('KZEV','카자흐스탄 e-Visa','https://www.vmp.gov.kz','$~',V,'없음','')],[]),
 ('아제르바이잔','🇦🇿','B',[('AZEV','ASAN e-Visa','https://evisa.gov.az','$25','30일','없음','')],[]),
 ('이스라엘','🇮🇱','B',[('ILETA','ETA-IL','https://israel-entry.piba.gov.il','₪25','2년','없음','')],[]),
 ('요르단','🇯🇴','B',[('JOPASS','Jordan Pass·비자','https://www.jordanpass.jo','JOD 70~',V,'없음','')],[]),
 ('탄자니아','🇹🇿','B',[('TZEV','탄자니아 e-Visa','https://visa.immigration.go.tz','$50',V,'없음','')],[]),
 ('남아공','🇿🇦','B',[('ZAVISA','남아공 비자·ETA','https://www.dha.gov.za','R~',V,'없음','ETA 도입 중 · '+V)],[]),
 ('러시아','🇷🇺','B',[('RUEV','러시아 통합 e-Visa','https://electronic-visa.kdmid.ru','$52','16일','없음','정세 확인')],[]),
 ('쿠바','🇨🇺','B',[('CUDV',"D'Viajeros 여행자 신고",'https://dviajeros.mitrans.gob.cu','무료','출발 7일 전','없음','')],['ES']),
 ('콜롬비아','🇨🇴','B',[('COMIG','Check-MIG','https://apps.migracioncolombia.gov.co/pre-registro','무료','출발 72시간 전','없음','')],['ES']),
 ('페루','🇵🇪','B',[('PEENT','페루 입국 절차·TAM','https://www.gob.pe/migraciones','무료',V,'없음','')],['ES']),
 ('도미니카공화국','🇩🇴','B',[('DOETK','e-Ticket 입출국','https://eticket.migracion.gob.do','무료','출발 72시간 전','없음','')],['ES']),
 ('코스타리카','🇨🇷','B',[('CRENT','코스타리카 입국 서류','https://www.migracion.go.cr','무료',V,'없음','')],['ES']),
 ('괌·사이판','🇬🇺','B',[('GUAM','괌·CNMI 비자면제 전자신고(ESTA 면제·I-736)','https://i736.cbp.dhs.gov','무료','출발 7일 전','없음','한·일 수요')],[]),
 ('마카오','🇲🇴','B',[('MOENT','마카오 입국 절차·사전등록','https://www.fsm.gov.mo','무료',V,'없음','')],[]),
 ('피지','🇫🇯','B',[('FJENT','피지 입국 서류','https://www.immigration.gov.fj','무료',V,'없음','')],[]),
 ('바레인','🇧🇭','B',[('BHEV','바레인 e-Visa','https://www.evisa.gov.bh','BHD~',V,'없음','')],[]),
 ('에티오피아','🇪🇹','B',[('ETEV','에티오피아 e-Visa','https://www.evisa.gov.et','$82',V,'없음','')],[]),
 ('르완다·우간다','🇷🇼','B',[('EATV','동아프리카 관광비자','https://irembo.gov.rw','$100','90일','없음','')],[]),
 ('아르헨티나·칠레','🇦🇷','B',[('ARCL','아르헨티나·칠레 입국 절차','https://www.argentina.gob.ar/migraciones','무료',V,'없음','')],['ES']),
 ('아르메니아','🇦🇲','B',[('AMEV','아르메니아 e-Visa','https://evisa.mfa.am','$~',V,'없음','')],[]),
 ('파키스탄·방글라데시','🇵🇰','B',[('PKEV','파키스탄·방글라데시 e-Visa','https://visa.nadra.gov.pk','$~',V,'없음','')],[]),
 ('미얀마','🇲🇲','B',[('MMEV','미얀마 e-Visa','https://evisa.moip.gov.mm','$50',V,'없음','정세 확인')],[]),
 ('브루나이','🇧🇳','B',[('BNARR','브루나이 입국 절차·e-Arrival','https://www.imm.gov.bn','무료',V,'없음','')],[]),
 ('키르기스스탄','🇰🇬','B',[('KGEV','키르기스스탄 e-Visa','https://www.evisa.e-gov.kg','$~',V,'없음','')],[]),
]
TIER_LANGS = {'S': CORE, 'A': ['EN', 'KO', 'HI', 'ES', 'ID'], 'B': ['EN', 'KO', 'HI']}
# 중남미 B국가는 ES 대신 포함(제외 언어 로직으로 처리)

# ─────────────────────── 인접 주제 (여행자가 바로 이어 보는 것) ───────────────────────
ADJ = [  # (code, 제목핵심, 언어들, 비고)
 ('CHK-KE','대한항공 온라인 체크인·좌석 선택',['KO','EN'],'항공사 체크인 시리즈'),('CHK-OZ','아시아나 온라인 체크인',['KO'],''),
 ('CHK-AK','에어아시아 체크인·수하물 추가',['EN','ID','KO','HI'],''),('CHK-5J','세부퍼시픽 체크인',['EN','KO'],''),
 ('CHK-TR','스쿳 체크인',['EN','ID','KO'],''),('CHK-JQ','젯스타 체크인',['EN','JA','KO'],''),('CHK-UA','유나이티드 체크인·좌석',['EN','ES','HI'],''),
 ('CHK-EK','에미레이트 체크인',['EN','HI','ID'],''),('CHK-SQ','싱가포르항공 체크인',['EN','ID','KO'],''),('CHK-MH','말레이시아항공 체크인',['EN','ID'],''),
 ('CHK-NH','ANA 체크인',['KO','EN'],''),('CHK-JL','JAL 체크인',['KO','EN'],''),('CHK-VN','베트남항공 체크인',['KO','EN'],''),('CHK-TG','타이항공 체크인',['EN','KO'],''),
 ('RAIL-JR','일본 신칸센 smartEX 예약',['KO','EN','ID'],'철도·관광지 시리즈'),('RAIL-JRP','JR패스 교환·좌석 예약',['KO','EN','ES'],''),
 ('RAIL-THSR','대만 고속철 예약',['KO','EN','JA'],''),('RAIL-KTX','코레일 KTX 외국인 예매',['EN','JA','ID','HI'],''),('RAIL-EU','유레일·Trenitalia·SNCF 예약',['EN','KO','ES'],''),
 ('TIX-USJ','유니버설 스튜디오 재팬 티켓·익스프레스',['KO','EN','ID'],''),('TIX-TDR','도쿄 디즈니 티켓·앱',['KO','EN'],''),('TIX-GHIBLI','지브리 미술관 예약',['KO','EN','ES'],''),
 ('TIX-SKY','시부야 스카이 예약',['KO','EN'],''),('TIX-TEAMLAB','팀랩 예약',['KO','EN','ID'],''),('TIX-COLO','콜로세움·바티칸 예약',['KO','EN','ES'],''),
 ('TIX-LOUVRE','루브르 예약',['KO','EN','ES'],''),('TIX-ALHAM','알함브라 예약',['KO','EN','JA'],''),('TIX-INTERPARK','인터파크 글로벌 K-pop 티켓',['EN','ID','ES','JA','HI'],''),
 ('APT-GE','미국 Global Entry·MPC 앱',['KO','EN'],'공항 사전등록'),('APT-SES','한국 SeS 자동출입국 외국인 등록',['EN','JA','ID'],''),('APT-SG','싱가포르·호주 자동출입국',['KO','EN'],''),
 ('TAX-KR','한국 사후면세 환급',['EN','JA','ID','HI'],'면세·환급'),('TAX-JP','일본 면세 Visit Japan Web QR',['KO','EN'],''),('TAX-EU','유럽 Tax Free 신청',['KO','EN','JA'],''),
 ('IDP-KR','국제운전면허증 온라인 신청(정부24)',['KO'],'운전·렌터카'),('RENT-JP','일본 렌터카 예약·ETC',['KO','EN'],''),('RENT-AU','호주 렌터카·톨',['KO','EN'],''),
 ('VAP-US','미국 비자 인터뷰 예약(ustraveldocs)',['KO','EN','HI','ES','ID'],'비자 예약 포털'),('VAP-VFS','VFS Global 쉥겐 예약',['EN','HI','ID','ES'],''),
 ('VAP-TLS','TLScontact 예약',['EN','HI'],''),('VAP-UKVCAS','UKVCAS 영국 비자 생체 예약',['EN','HI','KO'],''),
 ('WHV-AU','호주 워킹홀리데이 417·462',['KO','EN','ES','ID'],'워홀·유학'),('WHV-CA','캐나다 IEC 워홀',['KO','EN','ES'],''),('WHV-NZ','뉴질랜드 워홀',['KO','EN'],''),('WHV-JP','일본 워홀',['KO','EN'],''),
 ('SV-US','미국 F-1 SEVIS 수수료·DS-160',['KO','EN','HI','ID'],''),('SV-UK','영국 학생비자 CAS',['EN','HI','ID','KO'],''),('SV-AU','호주 학생비자 500',['EN','HI','ID','KO'],''),('SV-CA','캐나다 Study Permit',['EN','HI','KO'],''),
 ('SET-AU','호주 TFN·myGov·Medicare',['KO','EN','HI','ES'],'현지 정착 행정'),('SET-UK','영국 NIN·GP 등록',['KO','EN','HI'],''),('SET-JP','일본 마이넘버·주민등록',['KO','EN'],''),
 ('SET-CA','캐나다 SIN',['KO','EN','HI','ES'],''),('SET-US','미국 SSN 예약',['KO','EN','ES'],''),
 ('KR-HIKOREA','Hi Korea 비자연장·외국인등록',['EN','ID','HI','ES','JA'],'한국 거주 외국인'),('KR-GOV24','정부24 외국인 서류',['EN','ID','JA'],''),('KR-HOMETAX','홈택스 환급',['EN','ID','JA'],''),
 ('KR-NHIS','국민건강보험 외국인',['EN','ID','JA'],''),('KR-COUPANG','쿠팡·네이버 계정(외국인 인증)',['EN','ID','HI','JA'],''),('KR-KAKAO','카카오톡·카카오T 외국인',['EN','ID','JA'],''),
 ('KR-SIM','한국 선불 유심·eSIM 개통',['EN','ID','HI','JA'],''),('KR-BANK','한국 은행 계좌(외국인)',['EN','ID','JA'],''),('KR-TMONEY','T-money·코레일 패스',['EN','JA','ID'],''),
 ('EX-TOPIK','TOPIK 등록',['EN','ID','HI','JA'],'시험 등록'),('EX-IELTS','IELTS 등록',['KO','HI','ID'],''),('EX-TOEFL','TOEFL 등록',['KO','HI','ID','JA'],''),('EX-JLPT','JLPT 등록',['KO','EN','ID'],''),('EX-HSK','HSK 등록',['KO','EN'],''),
 ('FIN-WISE','Wise 가입·인증·송금',['KO','EN','HI','ID','ES','JA'],'금융(단가 높음)'),('FIN-REV','Revolut 가입',['KO','EN','ES'],''),('FIN-PP','PayPal 가입·인증',['KO','EN','HI','ID','ES'],''),
 ('FIN-IBKR','Interactive Brokers 계좌 개설·W-8BEN',['KO','EN','HI','ES','JA'],''),('FIN-PAYO','Payoneer 가입',['EN','HI','ID','ES'],''),('FIN-STRIPE','Stripe 가입',['EN','HI','ID','ES'],''),
 ('FIN-ITIN','미국 ITIN W-7',['KO','EN','ES'],''),('FIN-LLC','미국 LLC 설립·EIN',['KO','EN','HI'],''),('FIN-AMZ','Amazon Seller 등록',['KO','EN','HI','ID'],''),('FIN-ETSY','Etsy·Shopify 개설',['KO','EN','ID'],''),
 ('DIG-ADSENSE','구글 애드센스 가입·세금정보',['KO','EN','HI','ID','ES'],'디지털 서비스'),('DIG-YPP','유튜브 파트너 신청',['KO','EN','HI','ID'],''),('DIG-APPLE','Apple ID 국가 변경',['KO','EN','JA'],''),
 ('DIG-GPLAY','구글 플레이 국가 변경',['KO','EN','ID'],''),('DIG-DOMAIN','도메인 구매·연결',['KO','EN'],''),('DIG-GBP','Google Business Profile 등록',['KO','EN','ID'],''),('DIG-ALI','알리익스프레스·타오바오 직접 주문',['KO','EN','ES'],''),
]


EN_NAME = {
 'ESTA':'ESTA (US Travel Authorization)','DS160':'DS-160 US Visitor Visa Form','I94':'I-94 Arrival Record',
 'UKETA':'UK ETA','UKVISA':'UK Standard Visitor Visa','SCHENGEN':'Schengen Visa Application','EES':'EU Entry/Exit System (EES)','ETIAS':'ETIAS',
 'VJW':'Visit Japan Web','JPVISA':'Japan e-Visa','KETA':'K-ETA','KARR':'Korea e-Arrival Card','KVISA':'Korea Tourist Visa (C-3)',
 'TDAC':'Thailand Digital Arrival Card (TDAC)','THVISA':'Thailand e-Visa','ETA':'Canada eTA','CAVISA':'Canada Visitor Visa (TRV)',
 'AUETA':'Australia ETA app','EVIS':'Australia eVisitor','V600':'Australia Visitor Visa 600','ATD':'Australia Travel Declaration',
 'CNARR':'China Online Arrival Card','CNFREE':'China Visa-Free Entry & 240-hour Transit','CNVISA':'China Visa Form (COVA)',
 'VNEV':'Vietnam e-Visa','SGAC':'SG Arrival Card','SGVISA':'Singapore Visa','MDAC':'Malaysia Digital Arrival Card (MDAC)','MYVISA':'Malaysia eNTRI / eVisa',
 'UAEV':'Dubai / UAE Tourist Visa','TREV':'Türkiye e-Visa','INEV':'India e-Visa','ALLID':'All Indonesia Arrival Card','EVOA':'Indonesia e-VOA (Bali)',
 'ETRAVEL':'Philippines eTravel','NZETA':'NZeTA','NZTD':'NZ Traveller Declaration','SAEV':'Saudi Tourist e-Visa','TWAC':'Taiwan Online Arrival Card','TWAUTH':'Taiwan Online Travel Authorization',
 'EGEV':'Egypt e-Visa','LKETA':'Sri Lanka ETA','KHEV':'Cambodia e-Visa','KHARR':'Cambodia e-Arrival','MXFMM':'Mexico Entry (FMM / Digital)','BREV':'Brazil e-Visa',
 'HKPAR':'Hong Kong Pre-arrival Registration','QAHAYYA':'Qatar Hayya Visa','IMUGA':'Maldives IMUGA Declaration','MAEV':'Morocco e-Visa','KEETA':'Kenya eTA','OMEV':'Oman e-Visa',
 'NPVOA':'Nepal Visa-on-Arrival Online Form','LAEV':'Laos e-Visa','MNEV':'Mongolia e-Visa','UZEV':'Uzbekistan e-Visa','GEEV':'Georgia e-Visa','KZEV':'Kazakhstan e-Visa',
 'AZEV':'Azerbaijan ASAN e-Visa','ILETA':'Israel ETA-IL','JOPASS':'Jordan Pass & Visa','TZEV':'Tanzania e-Visa','ZAVISA':'South Africa Visa / ETA','RUEV':'Russia Unified e-Visa',
 'CUDV':"Cuba D'Viajeros Form",'COMIG':'Colombia Check-MIG','PEENT':'Peru Entry (TAM)','DOETK':'Dominican Republic e-Ticket','CRENT':'Costa Rica Entry Form','GUAM':'Guam / CNMI I-736',
 'MOENT':'Macau Entry','FJENT':'Fiji Entry Form','BHEV':'Bahrain e-Visa','ETEV':'Ethiopia e-Visa','EATV':'East Africa Tourist Visa','ARCL':'Argentina & Chile Entry','AMEV':'Armenia e-Visa',
 'PKEV':'Pakistan / Bangladesh e-Visa','MMEV':'Myanmar e-Visa','BNARR':'Brunei e-Arrival','KGEV':'Kyrgyzstan e-Visa',
 'CHK-KE':'Korean Air online check-in','CHK-OZ':'Asiana online check-in','CHK-AK':'AirAsia check-in & baggage','CHK-5J':'Cebu Pacific check-in','CHK-TR':'Scoot check-in','CHK-JQ':'Jetstar check-in',
 'CHK-UA':'United check-in & seats','CHK-EK':'Emirates check-in','CHK-SQ':'Singapore Airlines check-in','CHK-MH':'Malaysia Airlines check-in','CHK-NH':'ANA check-in','CHK-JL':'JAL check-in','CHK-VN':'Vietnam Airlines check-in','CHK-TG':'Thai Airways check-in',
 'RAIL-JR':'Shinkansen smartEX booking','RAIL-JRP':'JR Pass exchange & seat reservation','RAIL-THSR':'Taiwan HSR booking','RAIL-KTX':'Korail KTX booking for foreigners','RAIL-EU':'Eurail / Trenitalia / SNCF booking',
 'TIX-USJ':'Universal Studios Japan tickets & Express Pass','TIX-TDR':'Tokyo Disney tickets & app','TIX-GHIBLI':'Ghibli Museum tickets','TIX-SKY':'Shibuya Sky tickets','TIX-TEAMLAB':'teamLab tickets','TIX-COLO':'Colosseum & Vatican tickets','TIX-LOUVRE':'Louvre tickets','TIX-ALHAM':'Alhambra tickets','TIX-INTERPARK':'Interpark Global K-pop tickets',
 'APT-GE':'US Global Entry & MPC app','APT-SES':'Korea SeS auto-gate registration','APT-SG':'Singapore & Australia automated gates','TAX-KR':'Korea tax refund','TAX-JP':'Japan tax-free with Visit Japan Web','TAX-EU':'Europe tax-free refund',
 'IDP-KR':'Korea international driving permit online','RENT-JP':'Japan car rental & ETC','RENT-AU':'Australia car rental & tolls','VAP-US':'US visa interview appointment (ustraveldocs)','VAP-VFS':'VFS Global Schengen appointment','VAP-TLS':'TLScontact appointment','VAP-UKVCAS':'UKVCAS biometrics appointment',
 'WHV-AU':'Australia Working Holiday 417/462','WHV-CA':'Canada IEC working holiday','WHV-NZ':'New Zealand working holiday','WHV-JP':'Japan working holiday','SV-US':'US F-1: SEVIS fee & DS-160','SV-UK':'UK student visa (CAS)','SV-AU':'Australia student visa 500','SV-CA':'Canada study permit',
 'SET-AU':'Australia TFN, myGov & Medicare','SET-UK':'UK NIN & GP registration','SET-JP':'Japan My Number & resident registration','SET-CA':'Canada SIN','SET-US':'US SSN appointment',
 'KR-HIKOREA':'Hi Korea visa extension & ARC','KR-GOV24':'Gov24 documents for foreigners','KR-HOMETAX':'Hometax refund','KR-NHIS':'Korea health insurance (NHIS) for foreigners','KR-COUPANG':'Coupang & Naver account (foreigner verification)','KR-KAKAO':'KakaoTalk & Kakao T for foreigners','KR-SIM':'Korea prepaid SIM / eSIM','KR-BANK':'Korean bank account for foreigners','KR-TMONEY':'T-money & Korail Pass',
 'EX-TOPIK':'TOPIK registration','EX-IELTS':'IELTS registration','EX-TOEFL':'TOEFL registration','EX-JLPT':'JLPT registration','EX-HSK':'HSK registration',
 'FIN-WISE':'Wise sign-up, verification & transfer','FIN-REV':'Revolut sign-up','FIN-PP':'PayPal sign-up & verification','FIN-IBKR':'Interactive Brokers account & W-8BEN','FIN-PAYO':'Payoneer sign-up','FIN-STRIPE':'Stripe sign-up','FIN-ITIN':'US ITIN (Form W-7)','FIN-LLC':'US LLC & EIN','FIN-AMZ':'Amazon Seller registration','FIN-ETSY':'Etsy & Shopify setup',
 'DIG-ADSENSE':'Google AdSense sign-up & tax info','DIG-YPP':'YouTube Partner Program application','DIG-APPLE':'Change Apple ID country','DIG-GPLAY':'Change Google Play country','DIG-DOMAIN':'Buy & connect a domain','DIG-GBP':'Google Business Profile','DIG-ALI':'Order directly on AliExpress / Taobao',
}
EN_COUNTRY = {'미국':'USA','영국':'UK','EU 쉥겐':'Schengen','일본':'Japan','한국':'Korea','태국':'Thailand','캐나다':'Canada','호주':'Australia','중국':'China','베트남':'Vietnam','싱가포르':'Singapore','말레이시아':'Malaysia','UAE':'UAE','튀르키예':'Türkiye','인도':'India',
 '인도네시아':'Indonesia','필리핀':'Philippines','뉴질랜드':'New Zealand','사우디아라비아':'Saudi Arabia','대만':'Taiwan','이집트':'Egypt','스리랑카':'Sri Lanka','캄보디아':'Cambodia','멕시코':'Mexico','브라질':'Brazil','홍콩':'Hong Kong','카타르':'Qatar','몰디브':'Maldives','모로코':'Morocco','케냐':'Kenya','오만':'Oman','네팔':'Nepal','라오스':'Laos','몽골':'Mongolia','우즈베키스탄':'Uzbekistan',
 '조지아':'Georgia','카자흐스탄':'Kazakhstan','아제르바이잔':'Azerbaijan','이스라엘':'Israel','요르단':'Jordan','탄자니아':'Tanzania','남아공':'South Africa','러시아':'Russia','쿠바':'Cuba','콜롬비아':'Colombia','페루':'Peru','도미니카공화국':'Dominican Republic','코스타리카':'Costa Rica','괌·사이판':'Guam & Saipan','마카오':'Macau','피지':'Fiji','바레인':'Bahrain','에티오피아':'Ethiopia','르완다·우간다':'Rwanda & Uganda','아르헨티나·칠레':'Argentina & Chile','아르메니아':'Armenia','파키스탄·방글라데시':'Pakistan & Bangladesh','미얀마':'Myanmar','브루나이':'Brunei','키르기스스탄':'Kyrgyzstan','인접 주제':''}

# ─────────────────────────── 제목 템플릿 ───────────────────────────
def title(lang, country, form, year, kind, code=None):
    if lang != 'KO':
        form = EN_NAME.get(code, form); country = EN_COUNTRY.get(country, country)
    if country and (country in form or country.split('·')[0].split(' ')[0] in form): country = ''   # avoid "호주 호주 ETA"
    base = {
     'EN': (f'{form} ({country}) Step-by-Step {year} | Copy My Screen' if country else f'{form} Step-by-Step {year} | Copy My Screen'),
     'KO': (f'{country} {form} 작성법 {year} | 5분 따라하기' if country else f'{form} 따라하기 {year} | 화면 그대로'),
     'HI': (f'{form} Kaise Bhare {year} | {country} | Step by Step Hindi' if country else f'{form} Kaise Bhare {year} | Step by Step Hindi'),
     'ES': (f'Cómo llenar {form} ({country}) {year} paso a paso' if country else f'Cómo llenar {form} {year} paso a paso'),
     'ID': f'Cara Isi {form} {country} {year} Lengkap & Mudah'.replace('  ',' '),
     'JA': f'{country} {form} の書き方 {year}｜5分で完了'.strip(),
     'PT': (f'Como preencher {form} ({country}) {year} passo a passo' if country else f'Como preencher {form} {year} passo a passo'),
     'ZH': f'{country} {form} 填寫教學 {year}｜5分鐘完成'.strip(),
     'TH': f'วิธีกรอก {form} {country} {year} ทำตามได้เลย'.replace('  ',' '),
     'VI': f'Cách điền {form} {country} {year} chi tiết từng bước'.replace('  ',' '),
    }[lang]
    if kind == 'S': return {'KO': f'{form} 틀리기 쉬운 3곳 #shorts', 'EN': f'{form}: 3 mistakes to avoid #shorts'}.get(lang, base.split('|')[0].strip() + ' #shorts')
    if kind == 'M': return {'KO': f'{country} {form} 반려되는 실수 TOP5 {year}'.strip(), 'EN': f'{form} ({country}): Top 5 reasons it gets rejected {year}'}.get(lang, base)
    if kind == 'U': return base.replace(str(year), f'{year+1} 최신판' if lang == 'KO' else f'{year+1} UPDATE')
    if kind == 'F': return {'KO': f'{country} {form} 댓글 질문 모아 답변 {year}'.strip(), 'EN': f'{form} ({country}) — your questions answered {year}'}.get(lang, base)
    return base

OFFICIAL = {'EN': 'Official (free) link', 'KO': '공식 사이트(무료)', 'HI': 'Official website (free)', 'ES': 'Sitio oficial (gratis)', 'ID': 'Situs resmi (gratis)', 'JA': '公式サイト（無料）',
            'PT': 'Site oficial (grátis)', 'ZH': '官方網站（免費）', 'TH': 'เว็บไซต์ทางการ (ฟรี)', 'VI': 'Trang chính thức (miễn phí)'}
AFF = {'아시아': 'eSIM(Airalo/Klook) · 공항픽업(Klook) · 호텔(Agoda)', '영어권': 'eSIM(Airalo) · 호텔(Booking/Agoda) · 렌터카', '기타': 'eSIM(Airalo) · 호텔(Agoda) · 투어(Klook)'}
def aff_for(country):
    if country in ('미국','영국','EU 쉥겐','캐나다','호주','뉴질랜드'): return AFF['영어권']
    if country in ('일본','한국','태국','베트남','싱가포르','말레이시아','인도네시아','필리핀','대만','홍콩','마카오','캄보디아','라오스','몽골','중국','인도','스리랑카','몰디브','네팔'): return AFF['아시아']
    return AFF['기타']

# ─────────────────────────── 콘텐츠 풀 구성 ───────────────────────────
items = []   # dict(kind, tier, country, flag, code, form, lang, title, url, fee, when, captcha, note, aff, phase)
def add(kind, tier, country, flag, code, form, lang, url, fee, when, captcha, note, phase):
    items.append(dict(kind=kind, tier=tier, country=country, flag=flag, code=code, form=form, lang=lang,
                      title=title(lang, country, form, YEAR, kind, code), url=url, fee=fee, when=when, captcha=captcha, note=note, aff=aff_for(country), phase=phase))

for country, flag, tier, topics, excl in DB:
    langs = [l for l in TIER_LANGS[tier] if l not in excl]
    if tier == 'B' and 'ES' in excl: langs = ['EN', 'KO', 'HI']            # 중남미: 스페인어 모국 → 제외 유지
    if tier == 'B' and country in ('쿠바','콜롬비아','페루','도미니카공화국','코스타리카','아르헨티나·칠레'): langs = ['EN', 'KO', 'JA']
    for code, form, url, fee, when, cap, note in topics:
        for lang in langs:
            add('L', tier, country, flag, code, form, lang, url, fee, when, cap, note, 1)              # 본편
            add('S', tier, country, flag, code, form, lang, url, fee, when, cap, note, 1)              # 쇼츠(본편 D+1~3)
        if tier in ('S', 'A'):
            for lang in [l for l in ('EN', 'KO', 'HI') if l in langs]:
                add('M', tier, country, flag, code, form, lang, url, fee, when, cap, '반려·실수 TOP5', 2)
        if tier == 'S':
            for lang in langs:
                add('U', tier, country, flag, code, form, lang, url, fee, when, cap, '다음 해 최신판 재녹화', 4)
                add('S', tier, country, flag, code, form, lang, url, fee, when, cap, '최신판 쇼츠', 4)
            for lang in [l for l in EXT if l not in excl]:
                add('L', tier, country, flag, code, form, lang, url, fee, when, cap, '2차 언어 확장', 3)
                add('S', tier, country, flag, code, form, lang, url, fee, when, cap, '2차 언어 확장 쇼츠', 3)
            for lang in ('EN', 'KO'):
                add('F', tier, country, flag, code, form, lang, url, fee, when, cap, '댓글 질문 모음', 3)
for code, form, langs, note in ADJ:
    for lang in langs:
        items.append(dict(kind='L', tier='ADJ', country='인접 주제', flag='🧭', code=code, form=form, lang=lang, title=title(lang, '', form, YEAR, 'L', code).replace('()', '').replace('  ', ' ').strip(),
                          url=V, fee='-', when='-', captcha=V, note=note, aff='주제별(항공→eSIM·보험 / 금융→해당 서비스 추천 / 한국→유심·호텔)', phase=2))
        items.append(dict(kind='S', tier='ADJ', country='인접 주제', flag='🧭', code=code, form=form, lang=lang, title=title(lang, '', form, YEAR, 'S', code),
                          url=V, fee='-', when='-', captcha=V, note=note, aff='', phase=2))
# 주간 고정 코너
for w in range(52):
    items.append(dict(kind='W', tier='WEEKLY', country='주간', flag='📰', code=f'NEWS-{w+1:02d}', form='이번 주 입국규정 변경 뉴스', lang='KO', title=f'이번 주 바뀐 입국 규정·비자 뉴스 {YEAR} W{w+1:02d}', url='-', fee='-', when='-', captcha='-', note='주 1회 · 월요일', aff='eSIM', phase=0, week=w+1))
    items.append(dict(kind='W', tier='WEEKLY', country='주간', flag='📰', code=f'NEWSEN-{w+1:02d}', form='Weekly entry-rule changes', lang='EN', title=f'Entry rules that changed this week {YEAR} W{w+1:02d}', url='-', fee='-', when='-', captcha='-', note='weekly · Monday', aff='eSIM', phase=0, week=w+1))

# ─────────────────────────── 스케줄링 ───────────────────────────
# 우선순위: phase(1 코어 → 2 실수/인접 → 3 확장 → 4 업데이트), 그 안에서 tier S→A→B, 언어는 EN/KO 먼저, 라운드로빈으로 섞는다.
tier_rank = {'S': 0, 'A': 1, 'B': 2, 'ADJ': 1.5, 'WEEKLY': 0}
lang_rank = {l: i for i, l in enumerate(CORE + EXT)}
pool = [i for i in items if i['kind'] != 'W']
# 본편(L)과 그 쇼츠(S)는 쌍으로 묶어 쇼츠가 본편 1~3일 뒤에 오도록 처리
longs = [i for i in pool if i['kind'] in ('L', 'M', 'U', 'F')]
shorts = {(i['code'], i['lang'], i['note']): i for i in pool if i['kind'] == 'S'}
def key(i): return (i['phase'], tier_rank[i['tier']], lang_rank.get(i['lang'], 9), i['code'])
longs.sort(key=key)
# 같은 phase·tier 안에서 국가를 섞어 하루에 같은 나라만 몰리지 않게 라운드로빈
PATTERN = ['EN', 'KO', 'EN', 'KO', 'HI', 'ES', 'ID', 'JA', 'PT', 'ZH', 'TH', 'VI']
def interleave(group):
    # one queue per language (each already in code order); pop following a weighted pattern so
    # the two launch channels (EN, KO) get something every day while other languages trickle in
    by_lang = {}
    for i in group: by_lang.setdefault(i['lang'], []).append(i)
    out = []
    while any(by_lang.values()):
        for l in PATTERN:
            if by_lang.get(l): out.append(by_lang[l].pop(0))
    return out
ordered = []
for (ph, tr), grp in itertools.groupby(longs, key=lambda i: (i['phase'], tier_rank[i['tier']])):
    ordered += interleave(list(grp))

# 일자별 슬롯 수
def slots(day_idx):
    if day_idx < 14: return 3 if day_idx % 2 else 2
    return 5
schedule = []  # (date, slot, item)
day = 0; pending_shorts = []  # (release_day, item)
weekly_ko = [i for i in items if i['kind'] == 'W' and i['lang'] == 'KO']; weekly_en = [i for i in items if i['kind'] == 'W' and i['lang'] == 'EN']
qi = 0
while day < DAYS:
    date = START + dt.timedelta(days=day); n = slots(day); todays = []
    if date.weekday() == 0 and day >= 14:                     # 월요일: 주간 뉴스 KO (+EN 격주)
        wk = (day // 7)
        if wk < 52: todays.append(weekly_ko[wk])
        if wk < 52 and wk % 2 == 0: todays.append(weekly_en[wk])
    due = [s for s in pending_shorts if s[0] <= day]
    for s in due[: max(0, n - len(todays)) // 2]:
        todays.append(s[1]); pending_shorts.remove(s)
    while len(todays) < n and qi < len(ordered):
        it = ordered[qi]; qi += 1; todays.append(it)
        sk = (it['code'], it['lang'], it['note'] if it['kind'] in ('U',) else '')
        s = shorts.get((it['code'], it['lang'], '')) if it['kind'] == 'L' else (shorts.get((it['code'], it['lang'], '최신판 쇼츠')) if it['kind'] == 'U' else None)
        if it['kind'] == 'L' and it['tier'] == 'ADJ': s = shorts.get((it['code'], it['lang'], it['note']))
        if it['kind'] == 'L' and it['note'] == '2차 언어 확장': s = shorts.get((it['code'], it['lang'], '2차 언어 확장 쇼츠'))
        if s and s not in [p[1] for p in pending_shorts]:
            pending_shorts.append((day + random.choice([1, 2, 3]), s)); shorts.pop(next(k for k, v in shorts.items() if v is s))
    while len(todays) < n and pending_shorts:
        todays.append(pending_shorts.pop(0)[1])
    for slot, it in enumerate(todays, 1): schedule.append((date, slot, it))
    day += 1
leftover = len(ordered) - qi + len(pending_shorts) + len(shorts)

# ─────────────────────────── 엑셀 작성 ───────────────────────────
wb = Workbook()
F = 'Arial'
def hdr(ws, row, headers, fill='1F4E79'):
    for c, h in enumerate(headers, 1):
        cell = ws.cell(row=row, column=c, value=h); cell.font = Font(name=F, bold=True, color='FFFFFF'); cell.fill = PatternFill('solid', fgColor=fill)
        cell.alignment = Alignment(vertical='center', wrap_text=True)
def widths(ws, ws_widths):
    for i, w in enumerate(ws_widths, 1): ws.column_dimensions[get_column_letter(i)].width = w
def body_font(ws):
    for row in ws.iter_rows():
        for c in row:
            if c.font.name != F or not c.font.bold: c.font = Font(name=F, bold=c.font.bold, color=c.font.color)

KIND = {'L': '본편(5-8분)', 'S': '쇼츠(60초)', 'M': '실수 TOP5', 'U': '최신판 재녹화', 'F': '댓글 Q&A', 'W': '주간 뉴스'}

# 0 안내
ws0 = wb.active; ws0.title = '안내'
guide = [
 ['1년 업로드 캘린더 — 입국신고서·비자 따라하기 채널', ''],
 ['시작일', START.isoformat()],
 ['업로드 속도', '1~14일: 하루 2~3개 → 15일~: 하루 5개 (월요일은 주간 뉴스 포함)'],
 ['총 슬롯', '=COUNTA(캘린더!A:A)-1'],
 ['시트 구성', '캘린더(일자별 슬롯) · 국가서식DB(공식 URL·비용·제출시점·CAPTCHA) · 언어전략 · 월별요약 · 체크리스트'],
 ['편집해야 하는 칸', '캘린더 시트의 노란색 칸(상태·업로드URL·조회수)만 채우세요. 나머지는 생성값입니다.'],
 ['"확인 필요" 표시', '제작 직전에 공식 사이트에서 확인해야 하는 값입니다(비용·유효기간·시행일은 자주 바뀝니다).'],
 ['정책 주의', '같은 템플릿 복제 영상은 "반복·대량 생산 콘텐츠"로 수익화가 막힐 수 있습니다. 언어별 실제 음성 설명을 반드시 넣고, 첫 2주 반응을 본 뒤 속도를 올리세요.'],
 ['재생성', 'youtube-forms/plan/build_calendar.py 를 실행하면 이 파일이 다시 만들어집니다. 시작일·국가·언어는 그 파일 상단에서 바꿉니다.'],
]
for r, (a, b) in enumerate(guide, 1):
    ws0.cell(row=r, column=1, value=a).font = Font(name=F, bold=True, size=14 if r == 1 else 11)
    ws0.cell(row=r, column=2, value=b).font = Font(name=F)
widths(ws0, [22, 120])

# 1 캘린더
ws = wb.create_sheet('캘린더')
H = ['날짜', '요일', '주차', '슬롯', '유형', '등급', '국가', '서식/주제', '언어', '제목(초안)', '공식 URL(설명란 1줄)', '비용', '제출 시점·유효', 'CAPTCHA', '비고', '제휴 링크 세트', '상태', '업로드 URL', '7일 조회수']
hdr(ws, 1, H)
yellow = PatternFill('solid', fgColor='FFF2CC')
WD = ['월', '화', '수', '목', '금', '토', '일']
for r, (date, slot, it) in enumerate(schedule, 2):
    vals = [date, WD[date.weekday()], f'W{((date - START).days // 7) + 1:02d}', slot, KIND[it['kind']], it['tier'], f"{it['flag']} {it['country']}", it['form'], it['lang'],
            it['title'], it['url'], it['fee'], it['when'], it['captcha'], it['note'], it['aff'], '대기', '', '']
    for c, v in enumerate(vals, 1):
        cell = ws.cell(row=r, column=c, value=v); cell.font = Font(name=F)
        if c == 1: cell.number_format = 'yyyy-mm-dd'
        if c >= 17: cell.fill = yellow
widths(ws, [11, 5, 6, 5, 12, 6, 14, 30, 6, 52, 40, 10, 22, 9, 26, 34, 8, 30, 10])
ws.freeze_panes = 'A2'; ws.auto_filter.ref = f'A1:{get_column_letter(len(H))}{len(schedule) + 1}'
ws.cell(row=2, column=17).comment = Comment('대기 → 녹화 → 음성 → 업로드예약 → 공개 순으로 바꾸세요.', 'plan')

# 2 국가서식DB
ws2 = wb.create_sheet('국가서식DB')
H2 = ['등급', '국가', '서식 코드', '서식/주제', '공식 URL', '비용', '제출 시점·유효', 'CAPTCHA', '비고', '제작 언어', '본편 수', '총 영상 수(쇼츠·실수·업데이트 포함)']
hdr(ws2, 1, H2, '385723')
r = 2
for country, flag, tier, topics, excl in DB:
    for code, form, url, fee, when, cap, note in topics:
        langs = sorted({i['lang'] for i in items if i['code'] == code and i['kind'] == 'L'}, key=lambda l: lang_rank.get(l, 9))
        vals = [tier, f'{flag} {country}', code, form, url, fee, when, cap, note, ', '.join(langs),
                f'=COUNTIFS(캘린더!$H:$H,D{r},캘린더!$E:$E,"본편(5-8분)")', f'=COUNTIF(캘린더!$H:$H,D{r})']
        for c, v in enumerate(vals, 1): ws2.cell(row=r, column=c, value=v).font = Font(name=F)
        r += 1
ws2.cell(row=r + 1, column=1, value='비용·유효기간은 2026년 기준 공개 자료에서 가져온 참고값이며, "확인 필요"는 제작 직전 공식 사이트에서 확인해야 합니다.').font = Font(name=F, italic=True)
widths(ws2, [6, 16, 10, 34, 46, 10, 26, 9, 30, 30, 8, 14]); ws2.freeze_panes = 'A2'

# 3 언어전략
ws3 = wb.create_sheet('언어전략')
H3 = ['언어', '코드', '시작 단계', '예상 RPM', '선정 이유', '채널 운영', '배정 영상 수']
hdr(ws3, 1, H3, '7F6000')
for r, (code, d) in enumerate(LANG.items(), 2):
    vals = [d['name'], code, '1단계(1월~)' if code in CORE else '3단계(7월~)', d['rpm'], d['note'],
            '별도 채널' if code in ('EN', 'KO') else ('별도 채널(구독 1천 후)' if code in CORE else '영어 채널 내 다국어 음성트랙으로 시작'),
            f'=COUNTIF(캘린더!$I:$I,B{r})']
    for c, v in enumerate(vals, 1): ws3.cell(row=r, column=c, value=v).font = Font(name=F)
widths(ws3, [12, 6, 12, 10, 60, 34, 12])

# 4 월별요약
ws4 = wb.create_sheet('월별요약')
H4 = ['월', '전체', '본편', '쇼츠', '실수 TOP5', '최신판', '댓글 Q&A', '주간 뉴스', 'EN', 'KO', 'HI', 'ES', 'ID', 'JA', '2차 언어']
hdr(ws4, 1, H4, '7B2C2C')
months = sorted({(d.year, d.month) for d, _, _ in schedule})
for r, (y, m) in enumerate(months, 2):
    first = dt.date(y, m, 1); last = (dt.date(y + (m == 12), (m % 12) + 1, 1) - dt.timedelta(days=1))
    rng = f'캘린더!$A:$A,">="&DATE({y},{m},1),캘린더!$A:$A,"<="&DATE({last.year},{last.month},{last.day})'
    vals = [f'{y}-{m:02d}', f'=COUNTIFS({rng})'] + [f'=COUNTIFS({rng},캘린더!$E:$E,"{KIND[k]}")' for k in ('L', 'S', 'M', 'U', 'F', 'W')] + \
           [f'=COUNTIFS({rng},캘린더!$I:$I,"{l}")' for l in CORE] + [f'=COUNTIFS({rng})-SUMPRODUCT(COUNTIFS({rng},캘린더!$I:$I,{{"EN","KO","HI","ES","ID","JA"}}))']
    for c, v in enumerate(vals, 1): ws4.cell(row=r, column=c, value=v).font = Font(name=F)
tr = len(months) + 2
ws4.cell(row=tr, column=1, value='합계').font = Font(name=F, bold=True)
for c in range(2, len(H4) + 1):
    L = get_column_letter(c); ws4.cell(row=tr, column=c, value=f'=SUM({L}2:{L}{tr - 1})').font = Font(name=F, bold=True)
widths(ws4, [9] + [8] * 14)

# 5 체크리스트
ws5 = wb.create_sheet('체크리스트')
hdr(ws5, 1, ['구분', '항목', '누가', '언제', '비고'], '333333')
CK = [
 ('계정', '구글 계정 + 유튜브 채널 2개(한국어·영어) 생성, 아동용 아님 설정', '본인', '시작 전', '채널명 후보: 따라하면 끝 / Copy My Screen'),
 ('계정', 'Google Cloud 프로젝트 → YouTube Data API v3 → OAuth 클라이언트(데스크톱) → 최초 1회 승인', '본인', '시작 전', '이후 업로드 자동화 가능'),
 ('계정', '채널 소개문·배너·고정 댓글 템플릿', 'Claude', '시작 전', ''),
 ('제작', '음성: 직접 녹음 또는 TTS API 선택', '본인 결정', '시작 전', '무음+자막 복제는 수익화 제한 위험'),
 ('제작', '실제 정부 사이트 녹화 환경(사용자 PC) + 서식별 선택자 확인', 'Claude+본인', '서식마다', 'CAPTCHA는 수동, 제출 금지'),
 ('제작', '고해상도 썸네일 템플릿(국기·서식명·"무료 5분")', 'Claude', '1주차', ''),
 ('수익', '구독 1,000·시청 4,000시간 달성 → 유튜브 파트너·애드센스 신청', '본인', '보통 3~6개월', '만 18세 이상 명의'),
 ('수익', 'Travelpayouts → Airalo·Agoda·Klook 제휴 가입, 링크 생성', '본인(문구는 Claude)', '영상 10개 이후', '유료 프로모션 표시 필수'),
 ('수익', '설명란 1줄 공식 무료 링크, 2줄 제휴 고지, 3줄~ 제휴 링크 자동 삽입', 'Claude(업로드 스크립트)', '매 업로드', ''),
 ('운영', '월요일 주간 뉴스: 각국 이민청 공지·항공사 공지 모니터링', 'Claude 초안 → 본인 확인', '매주', ''),
 ('운영', '댓글 질문 수집 → 분기별 Q&A 영상', 'Claude', '분기', ''),
 ('운영', '4분기: S등급 서식 "다음 해 최신판" 재녹화', 'Claude', '10~12월', '서식 변경 시 수시'),
 ('법무', '개인정보는 전부 가상 샘플, 화면에 "샘플" 표시', 'Claude', '항상', ''),
 ('법무', '보험 제휴는 한국어 채널에서 제외(보험업법 모집 규제)', '본인', '항상', ''),
 ('법무', '미성년자 명의 채널은 수익화 불가 → 성인 명의 애드센스 연결', '본인', '시작 전', ''),
]
for r, row in enumerate(CK, 2):
    for c, v in enumerate(row, 1): ws5.cell(row=r, column=c, value=v).font = Font(name=F)
widths(ws5, [8, 70, 18, 14, 40])

path = os.path.join(OUT, f'upload-calendar-{YEAR}.xlsx'); wb.save(path)
with open(os.path.join(OUT, f'upload-calendar-{YEAR}.csv'), 'w', newline='', encoding='utf-8-sig') as f:
    w = csv.writer(f); w.writerow(H[:16])
    for date, slot, it in schedule:
        w.writerow([date.isoformat(), WD[date.weekday()], f'W{((date - START).days // 7) + 1:02d}', slot, KIND[it['kind']], it['tier'], f"{it['flag']} {it['country']}", it['form'], it['lang'], it['title'], it['url'], it['fee'], it['when'], it['captcha'], it['note'], it['aff']])

# 요약 출력
from collections import Counter
ck = Counter(it['kind'] for _, _, it in schedule); cl = Counter(it['lang'] for _, _, it in schedule); ct = Counter(it['tier'] for _, _, it in schedule)
print('slots', len(schedule), '| pool', len(items), '| leftover (not scheduled)', leftover)
print('by kind', dict(ck)); print('by lang', dict(cl)); print('by tier', dict(ct))
print('saved', path)
