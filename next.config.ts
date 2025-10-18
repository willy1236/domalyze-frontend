import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/:path*', // 將 /api 請求導向 FastAPI
      },
    ];
  }
};

export default nextConfig;
