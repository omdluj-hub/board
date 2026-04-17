import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1>후한의원 구미점</h1>
        <p>환자의 건강과 아름다움을 위해 정성을 다합니다.</p>
        <div className={styles.links}>
          <Link href="/board" className={styles.button}>
            온라인 상담 게시판 바로가기
          </Link>
        </div>
      </main>
    </div>
  );
}
