FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# Défense en profondeur : n'exécute pas le process en root dans le conteneur.
# L'image node:alpine fournit déjà un utilisateur "node" non-privilégié.
RUN chown -R node:node /app
USER node

EXPOSE 3000

CMD ["node", "server.js"]
