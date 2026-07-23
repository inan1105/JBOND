# 제임스 본드(James Bond) — 모바일 채권정보 웹앱

하나의 `bondId` 로 **발행 → 유통 → 곡선 → 시가표 → 투자시뮬레이션** 을 연결하는 모바일 전용 PWA.
서비스 도메인: `jbond.iamchart.co.kr` · 기준 액면 10,000원 · 수익률 소수점 셋째 자리.

## 모노레포 구조
```
apps/
  web/            React + Vite PWA (5 화면 + 공통 셸, 임베디드 Mock)
  api/            Fastify API + Source Adapter (SEIBro/KOFIA/KRX/Mock)
packages/
  shared-types/   도메인 타입 + BondContext + 어댑터 계약
  bond-engine/    순수 TS 단가·투자성과 계산 (+테스트)
  ui/             모바일 공통 컴포넌트
db/migrations/    PostgreSQL 스키마
docs/             분석·계산식·출처·운영·배포 문서
```

## 실행
```bash
npm install
npm run dev        # 웹앱(임베디드 Mock, 백엔드 불필요) → http://localhost:5173
npm run dev:api    # (선택) API 서버
npm run test       # bond-engine + web 단위 테스트
npm run build      # 타입체크 + 프로덕션 빌드(PWA)
npm run test:e2e   # Playwright (360/390/430)
```
> 웹앱은 `VITE_API_BASE_URL` 이 비어 있으면 앱 내장 Mock 데이터로 **백엔드 없이 실행**됩니다.
> 실원천 연동 시 `VITE_API_BASE_URL` 지정 + API `DATA_SOURCE_MODE=live`.

### 설치 트러블슈팅 (Windows)
이 프로젝트는 npm workspaces(모노레포)라서 로컬 패키지(`@jbond/*`)를 **심볼릭 링크**로 연결합니다.
Windows에서 다음 두 가지가 설치 실패의 주요 원인입니다.

**(A) 심볼릭 링크 권한 — `EISDIR ... symlink 'apps\web' -> 'node_modules\@jbond\web'`**
Windows 계정에 심링크 생성 권한이 없으면 워크스페이스 링크가 실패합니다. 해결:
- **개발자 모드 켜기**: 설정 → 개인 정보 및 보안 → 개발자용 → **개발자 모드 ON** (권장), 또는
- 터미널을 **관리자 권한**으로 실행, 그리고
- 재설치 전 잔여 링크 제거: `rm -rf node_modules`

**(B) 안티바이러스 파일잠금 — `EBUSY: resource busy or locked, rmdir node_modules\.<pkg>-<hash>`**
실시간 보호가 npm 임시 staging 디렉터리를 잠그면 링크 단계가 실패합니다. 해결:

1. **프로젝트 폴더를 AV 실시간 검사 예외로 등록** (`G:\__AI_JBond__`) — 가장 확실한 해결책
2. 깨끗한 재설치:
   ```bash
   # 반쯤 설치된 트리를 완전히 제거 후 재설치
   rm -rf node_modules packages/*/node_modules apps/*/node_modules
   npm install
   ```
3. 네트워크가 느리면 재시도 옵션:
   ```bash
   npm install --fetch-retries=5 --fetch-retry-maxtimeout=60000 --prefer-offline
   ```
4. 캐시가 이미 채워진 경우 오프라인 설치:
   ```bash
   npm install --offline
   ```
> 설치만 통과하면 `test` / `build` / `test:e2e` 는 코드 상 준비되어 있습니다.
> 계산 엔진(`packages/bond-engine`)은 외부 의존이 없어 `vitest` 만으로 독립 검증됩니다(26 테스트 통과 확인).
> **Linux/macOS 및 GitHub Actions(Ubuntu) 환경에는 위 (A)(B) 문제가 없으며**, push 시 `.github/workflows/ci.yml`
> 이 `install → test → build → e2e` 를 자동 검증합니다.

### 설치 없이 UI 미리보기
빌드 도구 설치 전이라도 전체 5개 화면 UI를 확인할 수 있는 자기완결형 프리뷰가 있습니다:
`docs/ui-preview.html` (브라우저로 열기) — 실제 bond-engine 계산 로직과 Mock 데이터를 포팅한 인터랙티브 버전.

## 설계 원칙 (PRD §1.3)
- 결측값은 0 대체 금지 → `null` 유지
- 관측값 / 계산·보간·추정값을 배지로 구분 (valueType·qualityStatus)
- 모든 수익률·단가에 기준일·출처 표시
- 화면 간 재입력 없이 `BondContext` 전달
- 모바일: 핵심 숫자 우선, 상세는 아코디언

## 문서
- [분석·실행계획](docs/01_프로젝트분석및실행계획.md)
- [계산식](docs/02_계산식.md)
- [데이터 출처](docs/03_데이터출처.md)
- [운영 점검표](docs/04_운영점검표.md)
- [장애복구·배포](docs/05_장애복구및배포.md)

## 지원 채권 (1차)
할인채 · 고정금리 이표채 · 단리채 · 복리채 (2차 확장: FRN, 물가연동채, 옵션부채, 외화채 등)

## 미구현 / TODO
- SEIBro/KOFIA/KRX 실원천 어댑터는 요청 규격 확인 후 구현(현재 TODO+Mock 격리)
- PWA 아이콘은 SVG(추후 PNG 세트 교체 권장)
- 배치 스케줄러·DB 영속화는 실원천 연동 단계에서 활성화
