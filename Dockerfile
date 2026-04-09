FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
# nginx:alpine auto-runs envsubst on files in /etc/nginx/templates/
# API_URL env var is injected at container startup (e.g. http://hummingbird-api.hummingbird-api.svc.cluster.local:5000)
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
