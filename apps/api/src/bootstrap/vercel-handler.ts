import type { IncomingMessage, ServerResponse } from 'http';
import { createApp } from './create-app';

let appPromise: ReturnType<typeof createApp> | null = null;

function getApp() {
  if (!appPromise) appPromise = createApp();
  return appPromise;
}

/**
 * Vercel serverless handler: run the Nest/Express app for each request.
 * Export default for Vercel's @vercel/node runtime.
 */
export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const app = await getApp();
  const express = (app.getHttpAdapter() as { getInstance(): (req: IncomingMessage, res: ServerResponse) => void }).getInstance();
  return new Promise((resolve, reject) => {
    res.on('finish', () => resolve());
    res.on('error', reject);
    express(req, res);
  });
}
