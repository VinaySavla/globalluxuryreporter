import { NextResponse } from 'next/server';
import { unsubscribeSubscriber } from '@/lib/data-service';
import { absoluteUrl } from '@/lib/site';

export async function POST(request) {
  const form = await request.formData();
  const removed = await unsubscribeSubscriber(form.get('token'));
  return NextResponse.redirect(absoluteUrl(removed ? '/subscription/unsubscribed' : '/subscription/invalid'), 303);
}
