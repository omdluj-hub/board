import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import styles from './detail.module.css';
import PostActions from './PostActions';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { data: post } = await supabase
    .from('posts')
    .select('title, content')
    .eq('id', id)
    .single();

  const title = post?.title || '상담내용';
  const description = post?.content?.substring(0, 150) || '구미 여드름, 피부질환, 다이어트 고민 상담 결과입니다.';

  return {
    title: `${title} | 후한의원 구미점 온라인 상담`,
    description: description,
    openGraph: {
      title: title,
      description: description,
      type: 'article',
    },
  };
}

export default async function DetailPage({ params }: Props) {
  const { id } = await params;

  // Fetch question
  const { data: question } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .eq('published', true)
    .single();

  if (!question) {
    notFound();
  }

  // Fetch answers
  const { data: answers } = await supabase
    .from('posts')
    .select('*')
    .eq('parent_id', id)
    .eq('published', true)
    .order('scheduled_at', { ascending: true });

  // JSON-LD for Google Search
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'QAPage',
    'mainEntity': {
      '@type': 'Question',
      'name': question.title,
      'text': question.content,
      'answerCount': answers?.length || 0,
      'author': { '@type': 'Person', 'name': question.author_name },
      'datePublished': question.scheduled_at,
      'acceptedAnswer': answers && answers.length > 0 ? {
        '@type': 'Answer',
        'text': answers[0].content,
        'author': { '@type': 'Person', 'name': '후한의원 구미점' },
        'datePublished': answers[0].scheduled_at
      } : undefined
    }
  };

  return (
    <div className={styles.container}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className={styles.questionSection}>
        <div className={styles.meta}>
          <span className={styles.tag}>Q.</span>
          <span className={styles.author}>{question.author_name}</span>
          <span className={styles.date}>{new Date(question.scheduled_at).toLocaleDateString()}</span>
        </div>
        <h1 className={styles.title}>{question.title}</h1>
        <div className={styles.content}>
          {question.content.split('\n').map((line: string, i: number) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      </div>

      <PostActions post={question} />

      <div className={styles.answerSection}>
        {answers?.map((answer) => (
          <div key={answer.id} className={styles.answerItem}>
            <div className={styles.meta}>
              <span className={styles.tagAnswer}>A.</span>
              <span className={styles.author}>{answer.author_name}</span>
              <span className={styles.date}>{new Date(answer.scheduled_at).toLocaleDateString()}</span>
            </div>
            <div className={styles.content}>
              {answer.content.split('\n').map((line: string, i: number) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className={styles.actions}>
        <a href="/board" className={styles.listButton}>목록으로</a>
      </div>
    </div>
  );
}
