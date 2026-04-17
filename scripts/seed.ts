import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// .env.local 파일 로드
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('--- 자동 게시글 등록 시작 ---');

  // 1. 질문 등록
  const { data: question, error: qError } = await supabase.from('posts').insert([
    {
      type: 'question',
      title: '[상담] 교통사고 후유증, 한의원 치료는 어떻게 하나요?',
      author_name: '민준이',
      content: '어제 교통사고를 당했습니다. 처음엔 괜찮은 줄 알았는데, 오늘 아침부터 목이랑 어깨가 너무 뻐근하고 허리도 아프네요. 후한의원 구미점에서 자동차보험으로 치료가 가능한가요? 제가 준비해야 할 서류나 치료 과정이 궁금합니다.',
      scheduled_at: new Date().toISOString(),
      published: true
    }
  ]).select();

  if (qError) {
    console.error('질문 등록 실패:', qError);
    return;
  }

  const questionId = question[0].id;
  console.log(`질문 등록 완료 (ID: ${questionId})`);

  // 2. 답변 등록
  const { error: aError } = await supabase.from('posts').insert([
    {
      type: 'answer',
      content: `안녕하세요, 후한의원 구미점입니다. 사고 후 갑작스러운 통증으로 많이 놀라셨을 텐데, 후유증 증상은 사고 직후보다 다음 날부터 서서히 나타나는 경우가 많습니다.

후한의원 구미점은 "자동차보험 지정 한방 의료기관"으로, 본인 부담금 없이 전액 보험 처리가 가능합니다.

[내원 시 준비물]
사고 접수번호 또는 상대측 보험사 담당자 연락처만 알려주시면 저희가 직접 확인하여 절차를 도와드립니다.

[후한의원 치료 과정]
1. 세밀한 진단: 사고 충격으로 인한 "어혈(뭉친 피)"과 근골격계 이상을 확인합니다.
2. 약침 치료: 염증과 통증을 빠르게 가라앉히는 한약 성분 주사입니다.
3. 추나 요법: 사고로 틀어진 척추와 관절을 바로잡아 후유증을 최소화합니다.
4. 한약 처방: 어혈을 제거하고 긴장된 근육과 인대를 이완시킵니다.

편하신 시간에 예약 후 내원해 주시면 정성을 다해 치료해 드리겠습니다. 쾌유를 빕니다!`,
      author_name: '후한의원 구미점',
      scheduled_at: new Date(Date.now() + 1000).toISOString(),
      published: true,
      parent_id: questionId
    }
  ]);

  if (aError) {
    console.error('답변 등록 실패:', aError);
  } else {
    console.log('✅ 답변 등록 완료');
  }

  console.log('--- 모든 등록이 완료되었습니다 ---');
}

seed();
