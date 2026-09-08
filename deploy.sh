#!/bin/sh
# 배포: 캐시버스팅 버전 갱신 → 커밋 → 푸시. 사용: ./deploy.sh "메시지"
set -e
cd "$(dirname "$0")"
V=$(date +%Y%m%d%H%M%S)
sed -i '' -E "s/(style\.css|data\.js|game\.js)(\?v=[0-9]+)?/\1?v=$V/g" index.html
git add -A
git -c user.name="Bosuk Nam" -c user.email="popman1105@gmail.com" commit -q -m "${1:-update}" || true
git push -q
echo "deployed v=$V"
