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

  // 頻道後台的前端網址從 /dashboard/channels 改成 /dashboard/twitch（後端 API 路徑不變）；
  // 舊網址永久導到新網址，保留子頁與 query
  async redirects() {
    return [
      { source: "/dashboard/channels", destination: "/dashboard/twitch", permanent: true },
      { source: "/dashboard/channels/:path*", destination: "/dashboard/twitch/:path*", permanent: true },
    ];
  },

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
