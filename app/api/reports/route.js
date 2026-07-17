import { NextResponse } from 'next/server';
import { getReports } from '@/lib/data-service';

export async function GET(request) {
  try {
    const params = request.nextUrl.searchParams;
    const featuredValue = params.get('featured');
    const result = await getReports({
      category: params.get('category') || undefined,
      featured: featuredValue === null ? undefined : featuredValue === 'true',
      search: params.get('search') || undefined,
      page: params.get('page') || 1,
      limit: params.get('limit') || 9
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Unable to load reports' }, { status: error.status || 500 });
  }
}
