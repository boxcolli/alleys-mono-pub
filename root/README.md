# /root

최상위 도메인 서버

## Route

### /
https://www.alleys.app으로 리디렉션 합니다.

### /images/cf-r2/:folder/:name
최적화된 CDN 이미지를 제공합니다.

모든 이미지는 Cloudflare R2에 저장되어있습니다.

그런데 Cloudflare 이미지 최적화 서비스는 최상위 도메인에서만 가능합니다.

그래서 프론트엔드를 www.alleys.app 으로 할당하고, /root 서버를 별도로 만들었습니다.
