제임스 본드(James Bond) 모바일 채권정보 웹앱 PRD v1.0
서비스명: 제임스 본드(James Bond)
서비스 도메인: jbond.iamchart.co.kr
서비스 형태: 모바일 전용 PWA 웹앱
핵심 사용자: 전업 채권투자자, 증권사 PB·WM, 채권 운용·시장 전문가
기준 액면: 10,000원
기준 수익률 표시: 연율 %, 소수점 셋째 자리
핵심 데이터 기준: SEIBro 채권정보
보조 데이터: 금융투자협회 최종호가수익률·민평수익률, 금융위원회/KRX 채권시세

SEIBro는 채권 시장현황·종목검색·만기수익률·유통추정정보 등을 제공하며, 개별 종목 화면에서는 채권평가사의 세전 평가수익률도 확인할 수 있습니다. 다만 지정하신 SEIBro 화면은 WebSquare 기반 동적 화면이므로, 개발 착수 전에 브라우저 네트워크 패널을 통해 실제 조회 요청·응답 필드와 재사용 조건을 확인해야 합니다. SEIBro 채권정보

1. 제품 정의
1.1 제품 비전

“한 종목의 발행조건을 확인하고, 현재 수익률과 단가를 조회하며, 수익률곡선과 동종채권을 비교하고, 예상 처분 시점의 수익을 계산하는 전 과정을 한 손 안에서 완료한다.”

1.2 핵심 가치
복잡한 채권정보를 차트·표·숫자로 빠르게 판단
발행정보부터 시뮬레이션까지 데이터 재입력 최소화
현재 가격과 예상 처분가격을 동일 계산 기준으로 비교
이자수익과 매매손익을 분리해 투자성과 설명
모든 수익률·단가에 데이터 기준일과 출처 표시
1.3 중요한 제품 원칙
다섯 콘텐츠는 별도 메뉴이지만 하나의 bondId로 연결합니다.
동일 종목을 다시 입력하지 않고 다른 화면으로 전달합니다.
사용자가 보고 있는 수익률의 종류를 반드시 표시합니다.
“실제 관측값”과 “계산값·보간값·추정값”을 구분합니다.
수익률이 없으면 임의로 0을 적용하지 않습니다.
모바일 화면에서는 핵심 숫자 3개를 우선 노출합니다.
복잡한 산출 과정은 접어서 제공하되 언제든 열람할 수 있게 합니다.
2. 전체 정보구조
2.1 하단 고정 메뉴
메뉴	핵심 기능	대표 출력
발행	종목 검색·발행조건	표면금리, 만기일, 지급구조
곡선	수익률곡선 비교	현재·과거 Curve
유통	일별 수익률·가격	시가평가수익률, 단가
투자	A/B 시점 시뮬레이션	Income·Capital·TR·CAGR
시가표	채권종류×잔존만기	Mark-to-Market Matrix

상단에는 공통으로 다음 요소를 배치합니다.

종목검색
최근 조회
관심채권
데이터 기준시각
출처·상태 표시
새로고침
2.2 콘텐츠 연결 구조
호출 규칙
출발 화면	사용자 동작	도착 화면	자동 전달값
발행정보	유통조회	유통정보	종목코드, ISIN
발행정보	투자계산	투자 시뮬레이션	전체 발행조건
유통정보	이 수익률로 계산	투자 시뮬레이션	평가일, 수익률, 단가
수익률곡선	특정 지점 선택	시가평가표	채권종류, 만기구간
시가평가표	셀 선택	수익률곡선	종류, 만기, 기준일
시가평가표	시뮬레이션	투자 시뮬레이션	시가평가수익률
투자 시뮬레이션	시장가격 비교	유통정보	종목, A/B 평가일

공통 상태 객체는 다음과 같이 정의합니다.

interface BondContext {
  bondId?: string;
  isin?: string;
  issueCode?: string;
  bondName?: string;
  bondType?: string;
  valuationDate?: string;
  selectedYield?: number;
  selectedPrice?: number;
  yieldSource?: "MARKET" | "ISSUE" | "CURVE" | "USER";
  sourceScreen?: "ISSUE" | "CURVE" | "MARKET" | "SIMULATION" | "MTM";
}
3. 기능 요구사항
3.1 발행정보
목적

채권단가 계산과 현금흐름 생성에 필요한 최소 발행조건을 확보합니다.

필수 검색조건
채권명
종목코드
ISIN
발행기관
발행일·만기일
채권종류
통화
필수 표시항목
구분	필드
식별	채권명, 표준코드/ISIN, 종목코드
분류	국채·지방채·특수채·금융채·회사채 등
발행	발행기관, 발행일, 만기일, 통화
원금	기준 액면, 발행금액, 상환방법
금리	표면금리, 발행수익률, 금리유형
이자	지급주기, 이자계산방식, 선·후급
상환	만기일시상환·분할상환·조기상환
평가	최근 시가평가일, 평가수익률, 평가가격
위험	신용등급, 후순위·담보·보증 여부
1차 계산지원 채권
할인채
고정금리 이표채
단리채
복리채
2차 확장 채권
FRN
거치 후 분할상환채
원금분할상환채
복리이표채
물가연동채
콜·풋옵션부채
전환사채·신주인수권부사채
외화채권
모바일 화면

상단 핵심 카드에는 다음만 먼저 표시합니다.

현재 시가평가수익률
기준 10,000원당 단가
만기까지 남은 기간
신용등급

하단 상세정보는 발행조건 / 현금흐름 / 평가정보 / 원리금 일정 아코디언으로 제공합니다.

3.2 수익률곡선
목적

채권종류·신용등급·잔존만기별 금리 수준과 기간별 변화를 시각화합니다.

선택체계
대분류
├─ 국채
├─ 지방채
├─ 특수채
├─ 통안채
├─ 금융채
│  ├─ 은행채
│  ├─ 카드채
│  ├─ 캐피탈채
│  └─ 기타금융채
└─ 회사채
   ├─ AAA
   ├─ AA+
   ├─ AA0
   ├─ AA-
   ├─ A+
   ├─ A0
   ├─ A-
   └─ BBB 등급
기본 만기축

3M · 6M · 1Y · 2Y · 3Y · 5Y · 10Y · 20Y · 30Y

시가평가표의 기본 열과 맞추기 위해 핵심 만기는 다음으로 통일합니다.

3M · 6M · 1Y · 3Y · 5Y · 10Y · 30Y

비교 기준일
현재
1주 전
1개월 전
3개월 전
6개월 전
1년 전
특정일
사용자 선택 2개 날짜
차트 모드
현재 Curve
두 날짜 중첩 비교
금리변동폭 차트
Curve 궤적 애니메이션
스프레드 차트
Bull/Bear Steepening·Flattening 판정
모바일 표현
세로축: 수익률(%)
가로축: 잔존만기
현재선: Bond Gold
비교선: 회색 또는 청색 점선
터치 툴팁: 만기, 수익률, 전기 대비 bp
두 손가락 확대 대신 가로 스크롤 우선
범례는 차트 상단 고정
계산값
변동폭(bp) = (현재 수익률 - 비교일 수익률) × 100
스프레드(bp) = 비교채권 수익률 - 기준국채 수익률
Slope = 장기수익률 - 단기수익률

곡선 중 원자료가 없는 만기점은 보간 여부를 별도 표시합니다.

관측값: 실선 점
보간값: 빈 원
데이터 없음: —
3.3 유통정보
목적

특정 채권의 실제 거래·평가 수익률과 가격 변화를 일자별로 조회합니다.

최소 필수항목
필드	설명
거래·평가일	기준일
시가평가수익률	소수 셋째 자리
평가가격	10,000원 기준
거래수익률	실제 거래가 있는 경우
거래가격	실제 거래가 있는 경우
거래량	액면 또는 거래대금
민평구분	평가사·평균·출처
데이터 상태	실제·평가·계산·결측
차트
기본: 수익률 선 + 가격 선
보조: 거래량 막대
기간: 1M·3M·6M·1Y·전체·직접지정
수익률과 가격의 역관계를 색상으로 표현
특정 날짜를 누르면 하단 상세카드 표시
조회 우선순위
1. 해당 일자의 종목 시가평가수익률
2. 실제 거래수익률
3. 발행수익률
4. 동종·동일등급 Curve 수익률
5. 사용자 직접입력

단, 3~5번은 모두 “대체값”으로 표시해야 합니다.

데이터 현실성 보완

금융위원회 공공 API는 KRX 채권시장의 시가·고가·저가·종가·거래량·수익률을 JSON/XML로 제공하므로 실제 거래 데이터 보완원으로 활용할 수 있습니다. 금융위원회 채권시세정보 API

3.4 투자 시뮬레이션
목적

취득·현재평가 시점 A와 예상 처분·청산·평가 시점 B를 비교하여 투자성과를 분해합니다.

입력값
영역	입력항목
채권	종목, 유형, 통화, 액면
발행조건	발행일, 만기일, 표면금리, 지급주기
A시점	일자, 수익률, 단가, 환율
B시점	일자, 예상수익률, 예상단가, 예상환율
투자규모	수량 또는 투자금액
비용	매수비용, 매도비용, 기타비용
세금	사용자 설정 세율
계산규칙	Day Count, 절사·반올림, Clean/Dirty
기본값
액면단가: 10,000
A일자: 오늘
A수익률: 최근 시가평가수익률
A수익률이 없으면: 발행수익률
B일자: 사용자가 지정
B수익률: A수익률 복사 후 사용자 변경
수익률 표시: 소수점 셋째 자리
원화채권 환율: 1.0000
핵심 결과
결과	정의
매입금액	A Dirty Price × 수량 × 환율
처분금액	B Dirty Price × 수량 × 환율
Income Gain	A~B 기간에 수취한 이자·상환금
Capital Gain	B 처분가액－A 취득가액
FX Gain	외화자산의 환율변동 손익
Total Profit	Income＋Capital＋FX－비용－세금
TR	Total Profit ÷ 초기투자금액
CAGR	보유기간을 연환산한 복리수익률
BEP Yield	손익분기 B시점 수익률
Duration 영향	금리변화에 따른 근사 가격변동
기본 산식
채권가격 P = Σ[CFt ÷ (1 + y/f)^(f×t)]

Income Gain
= 보유기간 중 실제 수취 이자
+ 보유기간 중 원금상환액

Capital Gain
= B시점 Clean Price
- A시점 Clean Price

총수익
= Income Gain
+ Capital Gain
+ FX Gain
- 거래비용
- 예상세액

TR
= 총수익 ÷ 초기투자금액

CAGR
= (최종가치 ÷ 초기투자금액)^(365/보유일수) - 1
계산 관행

기존 채권단가 계산 명세를 그대로 승계합니다.

세전단가: 소수점 둘째 자리 절사, 소수점 첫째 자리 유효
경과이자: 소수점 둘째 자리 절사
윤년 포함 구간: 적용 Day Count 규칙에 따라 366일 처리
1 tenor 미만: 실제 기간일수로 계산
Clean Price와 Dirty Price 동시 표시
산출 현금흐름별 할인과정 조회
이론가격과 시장관행가격이 다르면 계산규칙 표시
민감도 분석

B시점 수익률을 기준으로 다음 9개 시나리오를 자동 생성합니다.

-100bp, -75bp, -50bp, -25bp, 기준, +25bp, +50bp, +75bp, +100bp

각 시나리오에 대해 다음을 표시합니다.

예상 단가
Capital Gain
Total Return
CAGR
세후수익률
3.5 시가평가표
목적

채권종류별 대표 금리를 하나의 Mark-to-Market Matrix에서 비교합니다.

기본 열

3M · 6M · 1Y · 3Y · 5Y · 10Y · 30Y

기본 행
국고채
통안채
지방채
특수채 AAA
은행채 AAA
금융채 AA
카드채 AA
캐피탈채 AA
회사채 AAA
회사채 AA+
회사채 AA0
회사채 AA-
회사채 A+
회사채 A0
회사채 A-
회사채 BBB
셀 표시

기본값은 수익률이며, 토글로 변동폭을 볼 수 있게 합니다.

3.428%
▲ 4.2bp
표 동작
상단 만기 헤더 고정
좌측 채권종류 고정
우측·하단 양방향 스크롤
선택 셀 강조
첫 열과 헤더 교차 셀 고정
한 손가락으로 자연스럽게 스크롤
셀 탭 시 상세 Bottom Sheet
셀 길게 누르면 비교 바구니에 추가
최종호가수익률 주의사항

최종호가수익률은 시장을 대표하는 금융투자회사 호가를 평균한 기준수익률로, 개별 채권의 실제 체결수익률과 같지 않습니다. 공식 대표물도 국고채·통안채·회사채 AA-/BBB- 등 특정 구간 중심이므로, 전체 등급×만기 표는 최종호가수익률뿐 아니라 민평수익률을 결합해야 합니다. 금융투자협회 최종호가수익률 설명

따라서 각 행에 다음 출처 배지를 붙입니다.

최종호가
민평
실거래
보간
사용자
4. 데이터 설계
4.1 핵심 테이블
테이블	역할
bond_master	채권 기본 식별·분류
bond_terms	발행조건·상환조건
bond_cashflows	원금·이자 현금흐름
bond_credit_ratings	신용등급 이력
bond_market_prices	일별 가격·수익률·거래량
yield_curve_points	종류·등급·만기별 곡선
mtm_rates	시가평가표 원자료
simulation_cases	사용자 시뮬레이션
simulation_results	계산 결과
tax_settings	사용자 과세 설정
data_ingestion_logs	수집 성공·오류·품질
source_metadata	데이터 출처와 기준시각
4.2 bond_terms 주요 스키마
interface BondTerms {
  bondId: string;
  faceValue: number;
  pricingFaceValue: 10000 | 1000000;
  currency: string;

  issueDate: string;
  maturityDate: string;

  bondType:
    | "DISCOUNT"
    | "FIXED_COUPON"
    | "SIMPLE_COMPOUND"
    | "COMPOUND"
    | "FRN";

  couponRate?: number;
  issueYield?: number;
  couponFrequency?: 1 | 2 | 4 | 12;
  dayCount: "ACT_365" | "ACT_ACT" | "ACT_360" | "30_360";

  redemptionType: "BULLET" | "INSTALLMENT";
  redemptionRate: number;
  interestPaymentType: "ARREARS" | "ADVANCE" | "AT_MATURITY";
}
4.3 시장데이터 공통 규격
interface BondMarketObservation {
  bondId: string;
  valuationDate: string;

  yield?: number;
  cleanPrice?: number;
  dirtyPrice?: number;
  accruedInterest?: number;
  tradeVolume?: number;
  tradeAmount?: number;

  valueType:
    | "ACTUAL_TRADE"
    | "MARK_TO_MARKET"
    | "FINAL_QUOTE"
    | "ISSUE_YIELD"
    | "INTERPOLATED"
    | "USER_INPUT";

  source: string;
  sourceTimestamp: string;
  collectedAt: string;
  qualityStatus: "VALID" | "STALE" | "ESTIMATED" | "MISSING";
}
5. 데이터 수집 아키텍처
권장 구조
프런트엔드: React + TypeScript + Vite
UI: Tailwind CSS 또는 CSS Modules
차트: Apache ECharts
표: TanStack Table 또는 직접 구현한 Sticky Grid
백엔드: Node.js + Fastify/NestJS
DB: PostgreSQL
캐시: Redis
배치: Node Cron 또는 서버 스케줄러
PWA: Service Worker + 홈 화면 설치
테스트: Vitest + Playwright
계산 라이브러리: 별도 순수 TypeScript 모듈
데이터 수집 원칙

SEIBro 화면을 프런트엔드에서 직접 호출하지 않습니다.

모바일 → James Bond API → Source Adapter → SEIBro/KOFIA

이렇게 해야 다음 문제를 통제할 수 있습니다.

CORS
세션·쿠키
WebSquare 요청 규격 변경
출처별 필드 차이
호출량 제한
원본 데이터 오류
서비스 장애
과거 데이터 보존

SeibroAdapter, KofiaAdapter, KrxAdapter로 분리하여 원천 변경이 UI에 영향을 주지 않게 합니다.

6. 모바일 UI·UX 규격
기본 해상도
기준 디자인: 390×844px
최소 지원폭: 360px
최대 콘텐츠폭: 480px
터치영역: 최소 44×44px
하단 메뉴 높이: 64~72px
숫자: Tabular Numbers 적용
색상 의미
의미	색상
금리 상승	적색
금리 하락	청색
가격 상승	청록 또는 녹색
가격 하락	주황 또는 적색
현재값	Bond Gold
과거 비교값	회색
추정·보간값	점선·연한 배경
오류·결측	회색 —

금리와 가격은 방향이 반대이므로 단순히 상승=좋음으로 표현하지 않습니다.

공통 상태

모든 화면에 다음 상태를 설계합니다.

로딩 Skeleton
데이터 없음
일부 만기 결측
원천 서비스 지연
오래된 데이터
재시도
오프라인 마지막 조회
산출 불가 사유
7. 비기능 요구사항
항목	목표
첫 화면 표시	3초 이내
캐시 조회	1초 이내
API 응답	일반 조회 P95 1.5초
계산 응답	300ms 이내
가용성	월 99.5% 이상
접근성	WCAG 2.1 AA 고려
브라우저	최신 Chrome·Edge·Safari
보안	HTTPS, 입력검증, Rate Limit
감사성	계산 입력·버전·출처 기록
정확성	기준 사례와 단가 오차 허용범위 정의
관측성	수집 실패율·결측률·지연시간 기록
8. MVP 범위와 개발 단계
1단계: 데이터 탐색·검증
SEIBro 요청·응답 확인
사용 조건·호출 제한 확인
발행정보 필드 매핑
개별 평가수익률 확보 가능성 확인
과거 수익률곡선 확보 기간 확인
결측·휴일 처리원칙 확정
2단계: 발행정보
종목검색
발행조건 상세
현금흐름 생성
할인채·이표채·단리채·복리채 지원
3단계: 단가 계산 엔진
Clean/Dirty
경과이자
Day Count
A/B 시점 계산
상세 할인현금흐름
기준 테스트 구축
4단계: 유통정보
일별 시가평가수익률
일별 평가단가
가격·수익률 차트
거래정보 결합
5단계: 수익률곡선·시가평가표
곡선 비교
bp 변동
Matrix
Sticky Header/Column
셀과 차트 연동
6단계: 투자 시뮬레이션
Income·Capital·FX 분해
TR·CAGR
수익률 민감도
사용자 저장
CSV/PDF 출력
7단계: 검증·운영
모바일 실기기 테스트
계산 회귀테스트
데이터 품질 모니터링
PWA 배포
jbond.iamchart.co.kr 연결