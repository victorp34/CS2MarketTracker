# Étape 1 : build de l'application React
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Permet de configurer l'URL de l'API au moment du build (utile en production,
# où le backend n'est plus forcément sur localhost:3000)
ARG VITE_API_URL=http://localhost:3000/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Étape 2 : sert les fichiers statiques buildés via Nginx (image finale légère)
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
