# CI/CD 및 호스팅 구성

## GitHub Actions
- **`.github/workflows/ci.yml`** — push/PR 시 `install → test → build → e2e`, `apps/web/dist` 아티팩트 업로드.
- **`.github/workflows/deploy-pages.yml`** — `main` push 시 웹앱을 **GitHub Pages** 로 배포.
  - 저장소 Settings → Pages → Source: **GitHub Actions** 선택.
  - 커스텀 도메인(`jbond.iamchart.co.kr`)은 base `/` 유지.
  - 프로젝트 경로 배포 시 저장소 변수 `VITE_BASE=/<repo>/` 설정.

## 웹앱(정적 PWA) 호스팅 옵션
SPA(react-router `BrowserRouter`)이므로 **모든 경로 → index.html** 폴백이 필요하다. 각 호스트별 설정 제공:
| 호스트 | 설정 파일 | 비고 |
|---|---|---|
| Netlify | `netlify.toml` + `apps/web/public/_redirects` | publish=`apps/web/dist` |
| Vercel | `vercel.json` | rewrites SPA |
| GitHub Pages | `deploy-pages.yml` (404.html 폴백 생성) | Actions 배포 |
| 자체 Nginx | 아래 참조 | try_files 폴백 |

### Nginx (자체 호스팅, jbond.iamchart.co.kr)
```nginx
server {
  listen 443 ssl http2;
  server_name jbond.iamchart.co.kr;
  root /var/www/jbond;           # apps/web/dist 업로드
  index index.html;
  location / { try_files $uri $uri/ /index.html; }   # SPA 폴백
  location /api/ { proxy_pass http://127.0.0.1:4000; } # API 프록시(선택)
}
```

## API(Fastify) 컨테이너
```bash
# 모노레포 루트에서 빌드
docker build -f apps/api/Dockerfile -t jbond-api .
docker run -p 4000:4000 --env-file .env jbond-api
# 헬스체크: curl localhost:4000/health
```

## 배포 흐름 요약
1. `main` 에 push → CI 통과(test/build/e2e)
2. 웹: GitHub Pages/Netlify/Vercel 자동 배포 또는 `apps/web/dist` 수동 업로드
3. API: 컨테이너 배포(`.env` 주입, `DATA_SOURCE_MODE=live` 시 원천 연동)
4. DB: `db/migrations/001_init.sql` 적용
5. 도메인 연결 + HTTPS + PWA 설치·오프라인 확인

자세한 장애복구·롤백은 `docs/05_장애복구및배포.md` 참조.
