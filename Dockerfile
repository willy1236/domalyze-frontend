# 基礎映像
FROM node:18-alpine

# 建立應用資料夾
WORKDIR /app

# 複製 package*
COPY package*.json ./

# 安裝依賴
RUN npm install

# 複製程式碼
COPY . .

# 建置 Next.js 專案
RUN npm run build

# 啟動 Next.js 應用
CMD ["npm", "run", "start"]
