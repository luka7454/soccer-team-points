FROM node:16 as frontend-builder
WORKDIR /app
COPY . .
WORKDIR /app/frontend
RUN npm install
RUN npm run build

FROM nginx:alpine
# Nginx 캐시 디렉토리에 권한 부여
RUN mkdir -p /var/cache/nginx/client_temp /var/cache/nginx/proxy_temp \
    /var/cache/nginx/fastcgi_temp /var/cache/nginx/uwsgi_temp /var/cache/nginx/scgi_temp \
    && chmod 777 -R /var/cache/nginx \
    && chmod 777 -R /var/run \
    && chmod 777 -R /var/log/nginx \
    && touch /var/run/nginx.pid \
    && chmod 777 /var/run/nginx.pid \
    && chmod 777 -R /etc/nginx

# Nginx 설정 파일 생성
COPY --from=frontend-builder /app/frontend/build /usr/share/nginx/html

# 기본 Nginx 설정 생성 (non-root 사용자용)
RUN echo 'server { \
    listen 8080; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# 8080 포트로 변경 (1024 이하 포트는 root 권한 필요)
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
