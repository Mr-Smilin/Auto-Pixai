FROM node:18.17.1-slim
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    ca-certificates \
    procps \
    libxss1 \
    xvfb \
    xauth \
    dbus \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install google-chrome-stable -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json app.js ./
# RUN npm install
COPY node_modules/ ./node_modules/
# 創建最穩定的啟動腳本
COPY <<'EOF' /start.sh
#!/bin/bash
set -e

export DISPLAY=:99
export DBUS_SESSION_BUS_ADDRESS=/dev/null

echo "Starting Xvfb..."
Xvfb :99 -ac -screen 0 1920x1080x24 -nolisten tcp &
XVFB_PID=$!

# 確保 Xvfb 啟動
sleep 3

# 驗證 Xvfb 正在運行
if ! ps -p $XVFB_PID > /dev/null; then
    echo "ERROR: Xvfb failed to start"
    exit 1
fi

echo "Xvfb is running (PID: $XVFB_PID)"
echo "Starting application..."

npm start
EXIT_CODE=$?

kill $XVFB_PID 2>/dev/null || true
exit $EXIT_CODE
EOF

RUN chmod +x /start.sh

CMD ["/start.sh"]