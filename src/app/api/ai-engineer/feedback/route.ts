import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createLog } from '@/lib/logger';
import { z } from 'zod';

const feedbackSchema = z.object({
  customerId: z.string().min(1),
  question: z.string().min(1).max(1000),
  rating: z.enum(['up', 'down']),
  response: z.string().min(1).max(5000),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = feedbackSchema.parse(await request.json());
    await createLog({
      action: 'AI_ENGINEER_FEEDBACK',
      userId: session.user.id,
      userName: session.user.name || session.user.email || 'Unknown',
      details: {
        customerId: body.customerId,
        question: body.question,
        rating: body.rating,
        response: body.response,
      },
      req: request,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid feedback' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}