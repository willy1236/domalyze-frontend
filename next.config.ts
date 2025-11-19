import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 開啟 Standalone 模式，這會讓 build 產生極小的獨立執行檔
  // Dockerfile 中的 COPY --from=builder ... /standalone 指令依賴此設定
  output: 'standalone',

  // 如果您的圖片來自外部 (如 AWS S3, Google Photos)，請在此設定
  // images: {
  //   remotePatterns: [
  //     {
  //       protocol: 'https',
  //       hostname: 'example.com',
  //     },
  //   ],
  // },

  // async rewrites() {
  //   return [
  //     {
  //       source: '/api/:path*',
  //       destination: 'http://localhost:8000/:path*', // 將 /api 請求導向 FastAPI
  //     },
  //   ];
  // }
};

export default nextConfig;
