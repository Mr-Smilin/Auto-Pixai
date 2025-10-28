FROM node:18.17.1-slim
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    xvfb \
    && curl --location --silent https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install google-chrome-stable -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json app.js ./
# RUN npm install
COPY node_modules/ ./node_modules/
# 設定虛擬顯示器環境變數
ENV DISPLAY=:99
# 創建啟動腳本
RUN echo '#!/bin/bash\n\
    Xvfb :99 -screen 0 1920x1080x24 > /dev/null 2>&1 &\n\
    sleep 2\n\
    npm start' > /start.sh && chmod +x /start.sh
CMD ["/start.sh"]