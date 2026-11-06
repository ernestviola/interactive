import type { NextConfig } from 'next';
const lanHosts = (process.env.SKETCH_TRUSTED_ORIGINS ?? '').split(',').filter(Boolean).map(origin => new URL(origin).hostname);
const config: NextConfig = { distDir: process.env.SKETCH_TEST_RUN === '1' ? '.next-test' : '.next', poweredByHeader: false, devIndicators: false, allowedDevOrigins: ['127.0.0.1', 'localhost', ...lanHosts] };
export default config;
