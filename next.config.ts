import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 允许通过 local.tbanx.cn 等自定义本地域名访问 dev server（HMR 需要）
  allowedDevOrigins: ["local.tbanx.cn", "*.tbanx.cn"],
};

export default nextConfig;
