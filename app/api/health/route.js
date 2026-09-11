import { NextResponse } from 'next/server';
import { getDirectusHealth, getRuntimeConfiguration } from '@/lib/data-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const configuration = getRuntimeConfiguration();
    if (!configuration.ready) {
      return NextResponse.json({ status: 'degraded', configuration }, { status: 503 });
    }
    const dependency = await getDirectusHealth();
    return NextResponse.json({ status: 'ok', dependencies: { directus: dependency?.status || 'ok' } });
  } catch (error) {
    console.error('Health check failed', error);
    return NextResponse.json({ status: 'degraded', dependencies: { directus: 'unavailable' } }, { status: 503 });
  }
}
