확정된 PRD를 기준으로 React + TypeScript + Vite 기반 모바일
PWA와 Node.js TypeScript API 서버를 구성하라.

요구사항:
- monorepo 구조
- apps/web
- apps/api
- packages/bond-engine
- packages/shared-types
- packages/ui
- PostgreSQL
- 환경변수는 .env.example에 변수명만 제공
- 비밀키를 코드에 하드코딩하지 않음
- ESLint, Prettier, Vitest, Playwright 구성
- 모바일 기준폭 390px
- 하단 고정 메뉴 5개
- 라우트별 Error Boundary
- Mock 데이터로 최초 실행 가능

실행 명령:
npm install
npm run dev
npm run test
npm run build

완료 후 생성 파일, 실행법, 미구현 항목을 보고하라.