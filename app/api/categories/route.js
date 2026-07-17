import { NextResponse } from 'next/server';
import { getCategories } from '@/lib/data-service';

export async function GET() {
  try {
    return NextResponse.json({ data: await getCategories() });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Unable to load categories' }, { status: error.status || 500 });
  }
}
