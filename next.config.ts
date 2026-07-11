import type { NextConfig } from "next";
import path from "node:path";

const databaseRuntimeEnabled =
  process.env.DATABASE_RUNTIME_ENABLED === "true";

const nextConfig: NextConfig = {
  webpack(config) {
    if (databaseRuntimeEnabled) {
      config.experiments = {
        ...config.experiments,
        asyncWebAssembly: true,
      };
      config.module.rules.push({
        test: /\.wasm$/,
        type: "webassembly/async",
      });
    } else {
      config.resolve.alias["@/lib/db/prisma$"] = path.resolve(
        process.cwd(),
        "src/lib/db/prisma.worker-stub.ts",
      );
    }

    return config;
  },
};

export default nextConfig;
