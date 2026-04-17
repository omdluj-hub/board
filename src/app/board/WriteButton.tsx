'use client';

import styles from './board.module.css';

export default function WriteButton() {
  const handleClick = () => {
    alert('로그인하세요');
  };

  return (
    <div className={styles.writeButtonContainer}>
      <button onClick={handleClick} className={styles.writeButton}>
        글쓰기
      </button>
    </div>
  );
}
