SEIBro를 기본 원천으로 하는 채권 데이터 계층을 구현하라.

다음 인터페이스를 정의한다.
- BondMaster
- BondTerms
- BondCashflow
- BondMarketObservation
- YieldCurvePoint
- MtmRate
- SourceMetadata

다음 어댑터를 분리한다.
- SeibroAdapter
- KofiaAdapter
- KrxAdapter
- MockBondDataAdapter

각 어댑터는 원천 필드를 내부 표준 필드로 변환하고 다음 메타정보를
반드시 저장한다.
- source
- sourceUrl
- sourceTimestamp
- collectedAt
- valueType
- qualityStatus
- rawReference

실제 원천 요청 규격이 확인되지 않은 부분은 추정하여 하드코딩하지
말고 TODO와 Mock 구현으로 격리하라.

결측값은 0으로 변경하지 말고 null로 유지한다.