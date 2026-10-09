import type { NextConfig } from "next";

const [owner, repository] = (process.env.GITHUB_REPOSITORY ?? "").split("/");
const isUserOrOrganizationSite = repository === `${owner}.github.io`;
const basePath = repository && !isUserOrOrganizationSite ? `/${repository}` : "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: basePath || undefined,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  images: { unoptimized: true },
};

export default nextConfig;
