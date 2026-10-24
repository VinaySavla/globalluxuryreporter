import { NextResponse } from 'next/server';
import { getCmsHealth, getRuntimeConfiguration } from '@/lib/data-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const configuration = getRuntimeConfiguration();
    if (!configuration.ready) {
      return NextResponse.json({ status: 'degraded', configuration }, { status: 503 });
    }
    const dependency = await getCmsHealth();
    return NextResponse.json({ status: 'ok', dependencies: { wordpress: dependency?.status || 'ok' } });
  } catch (error) {
    console.error('Health check failed', error);
    return NextResponse.json({ status: 'degraded', dependencies: { wordpress: 'unavailable' } }, { status: 503 });
  }
}
