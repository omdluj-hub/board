'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import styles from './write.module.css';

export default function WritePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    author_name: '',
    content: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.author_name || !formData.content) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('posts').insert([
        {
          type: 'question',
          title: formData.title,
          author_name: formData.author_name,
          content: formData.content,
          scheduled_at: new Date().toISOString(),
          published: true, // 즉시 게시
        },
      ]);

      if (error) throw error;

      alert('게시글이 등록되었습니다.');
      router.push('/board');
      router.refresh();
    } catch (error: any) {
      alert('오류가 발생했습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>비밀 글쓰기 페이지</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="title" className={styles.label}>제목</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={styles.input}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="author_name" className={styles.label}>작성자명</label>
          <input
            type="text"
            id="author_name"
            name="author_name"
            value={formData.author_name}
            onChange={handleChange}
            className={styles.input}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="content" className={styles.label}>내용</label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            className={styles.textarea}
            required
          />
        </div>
        <button type="submit" className={styles.submitButton} disabled={loading}>
          {loading ? '등록 중...' : '게시글 등록'}
        </button>
      </form>
    </div>
  );
}
