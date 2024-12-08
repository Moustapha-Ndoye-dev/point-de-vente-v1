# Utiliser une image de base Node.js
FROM node:14

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers package.json et package-lock.json
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY src ./src

# Installer les dépendances
RUN npm install

# Compiler le code TypeScript
RUN npm run build

# Exposer le port sur lequel l'application va tourner
EXPOSE 3000

# Commande pour démarrer l'application
CMD ["node", "dist/assets/index-FP03Irh4.js"]