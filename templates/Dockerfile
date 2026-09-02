# Kind Lending mock-up: static site + Kind Guide proxy. Zero npm dependencies.
FROM node:20-alpine
WORKDIR /app
COPY server.js build.sh ./
COPY site ./site
COPY dist ./dist
ENV NODE_ENV=production PORT=3700 HOST=0.0.0.0
EXPOSE 3700
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1:3700/health | grep -q ok || exit 1
CMD ["node", "server.js"]
