import { NextResponse } from 'next/server';
import { activateSubscriber, confirmSubscriber } from '@/lib/data-service';
import { sendWelcomeEmail } from '@/lib/email';
import { absoluteUrl } from '@/lib/site';

export async function POST(request) {
  const form = await request.formData();
  const token = form.get('token');
  const subscriber = await confirmSubscriber(token);
  if (!subscriber) return NextResponse.redirect(absoluteUrl('/subscription/invalid'), 303);
  try {
    await sendWelcomeEmail(subscriber.email, absoluteUrl(`/subscription/unsubscribe?token=${encodeURIComponent(subscriber.unsubscribeToken)}`));
  } catch (error) {
    console.error('Unable to deliver confirmed subscription email', error);
    return NextResponse.redirect(absoluteUrl(`/subscription/confirm?token=${encodeURIComponent(token)}&delivery=failed`), 303);
  }
  if (!(await activateSubscriber(subscriber))) return NextResponse.redirect(absoluteUrl('/subscription/invalid'), 303);
  return NextResponse.redirect(absoluteUrl('/subscription/confirmed'), 303);
}
