import { NextResponse } from 'next/server';
import { getReport } from '@/lib/data-service';

export async function GET(_request, { params }) {
  try {
    const { slug } = await params;
    const report = await getReport(slug);
    if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    return NextResponse.json({ data: report });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Unable to load report' }, { status: error.status || 500 });
  }
}
