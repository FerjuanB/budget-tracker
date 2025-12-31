import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Asegurar que Prisma se genere durante el build
  serverExternalPackages: ["@prisma/client"],
  // Configuración para Vercel
  env: {
    // Forzar la generación de Prisma en Vercel
    PRISMA_GENERATE_SKIP_AUTOINSTALL: "false",
  },
};

export default nextConfig;
