import connectDB from '@/lib/db';
import { Log } from '@/models/Log';
import { NextRequest } from 'next/server';

interface LogData {
  action: string;
  userId: string;
  userName: string;
  details: Record<string, unknown>;
  req?: NextRequest;
}

export async function createLog({
  action,
  userId,
  userName,
  details,
  req,
}: LogData): Promise<void> {
  try {
    await connectDB();
    
    const logData = {
      action,
      userId,
      userName,
      details,
      ipAddress: req?.headers.get('x-forwarded-for') || req?.headers.get('x-real-ip') || 'unknown',
      userAgent: req?.headers.get('user-agent') || 'unknown',
    };

    await Log.create(logData);
  } catch (error) {
    console.error('Failed to create log:', error);
  }
}

export async function getLogs(
  userId?: string,
  limit: number = 50,
  page: number = 1
) {
  try {
    await connectDB();
    
    const query = userId ? { userId } : {};
    const skip = (page - 1) * limit;
    
    const logs = await Log.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();
    
    const total = await Log.countDocuments(query);
    
    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Failed to get logs:', error);
    throw error;
  }
}
