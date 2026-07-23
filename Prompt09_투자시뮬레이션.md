A/B 두 시점 비교형 채권 투자 시뮬레이션을 구현하라.

A:
- 취득 또는 현재 평가일
- 시장수익률
- Clean/Dirty Price
- 환율
- 수량

B:
- 예상 처분·청산·평가일
- 예상 시장수익률
- 예상 Clean/Dirty Price
- 예상 환율

결과:
- 초기투자금액
- 보유기간 수취이자
- Income Gain
- Capital Gain
- FX Gain
- 비용
- 예상세액
- 총수익
- TR
- CAGR
- BEP Yield

수익률 변화 -100bp부터 +100bp까지 민감도 표와 차트를 생성하라.

상세보기에는 각 현금흐름의 지급일, 원금·이자, 잔존연수,
할인계수, A/B 현재가치를 표시하라.

세법은 자동 판정하지 말고 사용자 설정값임을 명시한다.
과세 설정은 localStorage 키 jbond.tax.v1에 저장하고 재실행 시 복원한다.