import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

const DAILY_LIMIT = 3; // 未登录用户每日限制3次

// 简单的内存存储，生产环境建议使用数据库
const usageTracker = new Map<string, { count: number; date: string }>();

// 获取客户端IP地址
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const remoteAddress = request.headers.get('x-vercel-forwarded-for');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP.trim();
  }
  if (remoteAddress) {
    return remoteAddress.split(',')[0].trim();
  }
  return 'unknown';
}

// 获取今天的日期字符串
function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export async function GET(request: NextRequest) {
  try {
    // 检查用户是否登录
    const session = await auth();
    
    // 如果已登录，不受限制
    if (session?.user) {
      return NextResponse.json({
        success: true,
        canUse: true,
        isLoggedIn: true,
        remaining: -1, // 无限制
        message: 'Logged in users have unlimited access'
      });
    }
    
    // 获取客户端标识符
    const clientIP = getClientIP(request);
    const today = getTodayString();
    const key = `${clientIP}_${today}`;
    
    // 获取今日使用次数
    const usage = usageTracker.get(key);
    const currentCount = usage?.date === today ? usage.count : 0;
    
    const canUse = currentCount < DAILY_LIMIT;
    const remaining = Math.max(0, DAILY_LIMIT - currentCount);
    
    return NextResponse.json({
      success: true,
      canUse,
      isLoggedIn: false,
      remaining,
      used: currentCount,
      limit: DAILY_LIMIT,
      message: canUse 
        ? `You have ${remaining} generations remaining today` 
        : 'Daily limit exceeded. Please sign in for unlimited access or try again tomorrow.'
    });
    
  } catch (error) {
    console.error('Usage limit check error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check usage limit'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // 检查用户是否登录
    const session = await auth();
    
    // 如果已登录，不需要记录限制
    if (session?.user) {
      return NextResponse.json({
        success: true,
        isLoggedIn: true,
        message: 'Usage recorded for logged-in user'
      });
    }
    
    // 获取客户端标识符
    const clientIP = getClientIP(request);
    const today = getTodayString();
    const key = `${clientIP}_${today}`;
    
    // 获取当前使用次数
    const usage = usageTracker.get(key);
    const currentCount = usage?.date === today ? usage.count : 0;
    
    // 检查是否超出限制
    if (currentCount >= DAILY_LIMIT) {
      return NextResponse.json({
        success: false,
        canUse: false,
        error: 'Daily usage limit exceeded',
        remaining: 0,
        used: currentCount,
        limit: DAILY_LIMIT
      }, { status: 429 });
    }
    
    // 增加使用次数
    usageTracker.set(key, {
      count: currentCount + 1,
      date: today
    });
    
    const remaining = DAILY_LIMIT - (currentCount + 1);
    
    return NextResponse.json({
      success: true,
      canUse: true,
      isLoggedIn: false,
      remaining,
      used: currentCount + 1,
      limit: DAILY_LIMIT,
      message: remaining > 0 
        ? `Usage recorded. ${remaining} generations remaining today` 
        : 'This was your last free generation for today. Sign in for unlimited access!'
    });
    
  } catch (error) {
    console.error('Usage recording error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to record usage'
    }, { status: 500 });
  }
}

// 清理过期数据的辅助函数（可以通过定时任务调用）
export async function DELETE() {
  try {
    const today = getTodayString();
    let cleaned = 0;
    
    for (const [key, usage] of usageTracker.entries()) {
      if (usage.date !== today) {
        usageTracker.delete(key);
        cleaned++;
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Cleaned ${cleaned} expired usage records`
    });
    
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to cleanup expired records'
    }, { status: 500 });
  }
}
