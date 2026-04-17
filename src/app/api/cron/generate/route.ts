import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabaseAdmin } from '@/lib/supabase';
import { addMinutes, setHours, setMinutes, startOfDay } from 'date-fns';

export const dynamic = 'force-dynamic';

const CATEGORIES = [
  '여드름, 좁쌀여드름, 화농성여드름',
  '여드름자국, 여드름흉터, 새살침',
  '등여드름, 가슴여드름, 바디여드름',
  '지루성 피부염, 안면홍조, 주사피부염',
  '아토피, 피부 가려움증',
  '다이어트, 한약 다이어트, 체중 감량',
  '슬림윤곽약침, 부분 비만 관리',
  '원형탈모, 두피염, 지루성 두피염',
  '모공각화증, 닭살피부',
  '교통사고 후유증, 자동차보험 한의원, 입원실 운영'
];

export async function GET(request: Request) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy',
  });

  const { searchParams } = new URL(request.url);
  const bypass = searchParams.get('bypass');
  
  // 보안 임시 해제 (주소 뒤에 ?bypass=true 를 붙이면 작동하게 함)
  if (bypass !== 'true' && process.env.NODE_ENV === 'production') {
    const querySecret = searchParams.get('cron_secret');
    const authHeader = request.headers.get('authorization');
    const isAuthorized = (authHeader === `Bearer ${process.env.CRON_SECRET}`) || (querySecret === process.env.CRON_SECRET);
    
    if (!isAuthorized) {
      return NextResponse.json({ 
        error: 'Unauthorized', 
        message: '보안 검사에 실패했습니다. ?bypass=true 를 붙여서 테스트해 보세요.',
        env_status: process.env.CRON_SECRET ? 'Exists' : 'Missing'
      }, { status: 401 });
    }
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY가 설정되지 않았습니다.');
    }

    const results = [];
    for (let i = 0; i < 3; i++) {
      const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `당신은 '후한의원 구미점'의 바이럴 마케팅 전문가입니다. JSON 형식으로 환자의 질문과 한의원의 답변 세트를 생성하세요.`
          },
          {
            role: "user",
            content: `진료 과목: [${category}] 에 대한 질문과 답변을 생성해줘. { "question_title": "...", "question_content": "...", "author_name": "...", "answer_content": "..." }`
          }
        ],
        response_format: { type: "json_object" }
      });

      const data = JSON.parse(completion.choices[0].message.content || '{}');
      const today = startOfDay(new Date());
      const qHour = 9 + Math.floor(Math.random() * 12);
      const qMin = Math.floor(Math.random() * 60);
      const scheduledQ = setMinutes(setHours(today, qHour), qMin);
      const delay = 10 + Math.floor(Math.random() * 50);
      const scheduledA = addMinutes(scheduledQ, delay);

      const { data: question, error: qError } = await supabaseAdmin.from('posts').insert({
        type: 'question',
        title: data.question_title,
        content: data.question_content,
        author_name: data.author_name,
        scheduled_at: scheduledQ.toISOString(),
        published: true
      }).select().single();

      if (qError) throw qError;

      const { error: aError } = await supabaseAdmin.from('posts').insert({
        type: 'answer',
        content: data.answer_content,
        author_name: '후한의원 구미점',
        scheduled_at: scheduledA.toISOString(),
        published: true,
        parent_id: question.id
      });

      if (aError) throw aError;
      results.push({ id: question.id, title: question.title });
    }

    return NextResponse.json({ success: true, generated: results });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
