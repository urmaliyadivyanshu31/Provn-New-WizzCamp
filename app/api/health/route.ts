import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: (Date.now() - startTime) / 1000,
    environment: process.env.NODE_ENV || 'development'
  });
}
