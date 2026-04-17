import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabaseAdmin } from '@/lib/supabase';
import { addMinutes, setHours, setMinutes, startOfDay } from 'date-fns';

export const dynamic = 'force-dynamic';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy',
});

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
  // Check for cron secret to secure the endpoint
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const results = [];
    
    // Generate 3 sets of Q&A
    for (let i = 0; i < 3; i++) {
      const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `당신은 '후한의원 구미점'의 바이럴 마케팅 전문가입니다. 
            구글 검색 결과에 노출되기 좋은 SEO 친화적인 질문과 답변 세트를 생성하세요. 
            질문은 실제로 환자가 고민하며 물어보는 것처럼 자연스러워야 하며, 
            답변은 후한의원 구미점의 전문성과 정성을 담아 구체적으로 작성해야 합니다. 
            경북 구미 지역명이나 후한의원만의 치료법(미세약침, 한약, 압출, 한방 다이어트 등)을 자연스럽게 언급하세요.
            응답은 반드시 JSON 형식으로 하세요: { "question_title": "...", "question_content": "...", "author_name": "...", "answer_content": "..." }
            작성자 이름(author_name)은 환자처럼 보이는 익명 닉네임(예: 구미맘, 옥계동주민, 여드름탈출기원 등)으로 지어주세요.`
          },
          {
            role: "user",
            content: `진료 과목: [${category}] 에 대한 질문과 답변을 생성해줘.`
          }
        ],
        response_format: { type: "json_object" }
      });

      const data = JSON.parse(completion.choices[0].message.content || '{}');
      
      // Calculate random times for today
      // Run this cron late at night (e.g., 23:30)
      // These times will be in the "past" relative to 23:30, looking natural.
      const today = startOfDay(new Date());
      
      // Question between 09:00 and 21:00
      const qHour = 9 + Math.floor(Math.random() * 12);
      const qMin = Math.floor(Math.random() * 60);
      const scheduledQ = setMinutes(setHours(today, qHour), qMin);
      
      // Answer 10-60 minutes later
      const delay = 10 + Math.floor(Math.random() * 50);
      const scheduledA = addMinutes(scheduledQ, delay);

      // Save Question (Set published: true immediately)
      const { data: question, error: qError } = await supabaseAdmin
        .from('posts')
        .insert({
          type: 'question',
          title: data.question_title,
          content: data.question_content,
          author_name: data.author_name,
          scheduled_at: scheduledQ.toISOString(),
          published: true
        })
        .select()
        .single();

      if (qError) throw qError;

      // Save Answer (Set published: true immediately)
      const { error: aError } = await supabaseAdmin
        .from('posts')
        .insert({
          type: 'answer',
          content: data.answer_content,
          author_name: '후한의원 구미점',
          scheduled_at: scheduledA.toISOString(),
          published: true,
          parent_id: question.id
        });

      if (aError) throw aError;

      results.push({ question, scheduledQ, scheduledA });
    }

    return NextResponse.json({ success: true, generated: results.length });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
