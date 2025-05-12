FROM node:16 as frontend-builder
WORKDIR /app
COPY . .
WORKDIR /app/frontend
RUN npm install
RUN npm run build

FROM nginx:alpine
COPY --from=frontend-builder /app/frontend/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
