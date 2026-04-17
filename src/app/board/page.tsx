import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import styles from './board.module.css';
import WriteButton from './WriteButton';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic'; // Ensure the latest posts are always shown
export const revalidate = 0; // Disable caching for the board list

export const metadata: Metadata = {
  title: '온라인 상담 게시판 | 후한의원 구미점',
  description: '구미 여드름, 다이어트, 피부질환 한방 치료 상담 결과입니다.',
  verification: {
    google: 'w5NQ-WHd-o_hcKnF8bJoc-WAOklZtZcNapkaNAwDm6A',
  },
};

export default async function BoardPage() {
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .eq('type', 'question')
    .eq('published', true)
    .order('scheduled_at', { ascending: false });

  if (error) {
    return <div>오류가 발생했습니다: {error.message}</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>후한의원 구미점 - 온라인 상담 게시판</h1>
        <p>여드름, 피부질환, 다이어트, 교통사고 한방 치료 상담</p>
      </header>

      <WriteButton />

      <div className={styles.boardList}>
        <div className={styles.boardHeader}>
          <span className={styles.colTitle}>제목</span>
          <span className={styles.colAuthor}>작성자</span>
          <span className={styles.colDate}>날짜</span>
        </div>
        {posts?.map((post) => (
          <Link href={`/board/${post.id}`} key={post.id} className={styles.boardItem}>
            <span className={styles.itemTitle}>{post.title}</span>
            <span className={styles.itemAuthor}>{post.author_name}</span>
            <span className={styles.itemDate}>
              {new Date(post.scheduled_at).toLocaleDateString()}
            </span>
          </Link>
        ))}
        {posts?.length === 0 && (
          <div className={styles.empty}>등록된 게시글이 없습니다.</div>
        )}
      </div>
    </div>
  );
}
