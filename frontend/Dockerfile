# ─── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# Instala dependências usando o lockfile (build reprodutível)
COPY package*.json ./
RUN npm ci

# Copia o restante e gera o bundle de produção
COPY . .
RUN npm run build

# ─── Serve stage ──────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine

# Remove o default.conf e usa nosso template (resolvido por envsubst no boot)
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

# Backend acessado pelo proxy /api/. Pode ser sobrescrito em runtime
# (ex.: API_PROXY_TARGET=http://service-desk-api:8000 no docker-compose).
ENV API_PROXY_TARGET=http://api.service-desk.40.82.176.176.nip.io

EXPOSE 80

# A imagem oficial do nginx já roda envsubst nos arquivos em /etc/nginx/templates
CMD ["nginx", "-g", "daemon off;"]
