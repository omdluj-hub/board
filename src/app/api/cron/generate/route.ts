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
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'dummy') {
      throw new Error('OPENAI_API_KEY가 설정되지 않았습니다. Vercel Settings에서 등록해 주세요.');
    }

    const results = [];
    for (let i = 0; i < 3; i++) {
      const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `당신은 '후한의원 구미점'의 홍보 전문가입니다. 
            반드시 다음 JSON 형식을 엄격히 지켜서 응답하세요:
            {
              "question_title": "질문 제목",
              "question_content": "환자의 구체적인 고민 내용",
              "author_name": "환자 닉네임",
              "answer_content": "한의사의 전문적인 답변 내용"
            }`
          },
          {
            role: "user",
            content: `진료 과목: [${category}] 에 대한 질문과 답변 세트를 1개 생성해줘.`
          }
        ],
        response_format: { type: "json_object" }
      });

      const rawContent = completion.choices[0].message.content;
      if (!rawContent) throw new Error('AI 응답이 비어있습니다.');
      
      const data = JSON.parse(rawContent);
      
      // 데이터 검증 및 기본값 설정 (Null 에러 방지)
      const qTitle = data.question_title || `${category} 관련 문의입니다.`;
      const qContent = data.question_content || '치료 방법에 대해 자세히 알고 싶습니다.';
      const aName = data.author_name || '익명환자';
      const aContent = data.answer_content || '안녕하세요, 후한의원 구미점입니다. 내원해 주시면 정성껏 진료해 드리겠습니다.';

      const today = startOfDay(new Date());
      const qHour = 9 + Math.floor(Math.random() * 12);
      const qMin = Math.floor(Math.random() * 60);
      const scheduledQ = setMinutes(setHours(today, qHour), qMin);
      const delay = 10 + Math.floor(Math.random() * 50);
      const scheduledA = addMinutes(scheduledQ, delay);

      // 질문 저장
      const { data: question, error: qError } = await supabaseAdmin.from('posts').insert({
        type: 'question',
        title: qTitle,
        content: qContent,
        author_name: aName,
        scheduled_at: scheduledQ.toISOString(),
        published: true
      }).select().single();

      if (qError) throw qError;

      // 답변 저장
      const { error: aError } = await supabaseAdmin.from('posts').insert({
        type: 'answer',
        content: aContent,
        author_name: '후한의원 구미점',
        scheduled_at: scheduledA.toISOString(),
        published: true,
        parent_id: question.id
      });

      if (aError) throw aError;
      results.push({ id: question.id, title: qTitle });
    }

    return NextResponse.json({ success: true, generated: results });
  } catch (error: any) {
    console.error('Cron Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
