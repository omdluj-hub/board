'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import styles from './detail.module.css';

interface PostActionsProps {
  post: {
    id: string;
    title: string;
    content: string;
    author_name: string;
  };
}

export default function PostActions({ post }: PostActionsProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [password, setPassword] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [formData, setFormData] = useState({
    title: post.title,
    content: post.content,
    author_name: post.author_name,
  });

  const ADMIN_PASSWORD = 'gnrnal1075';

  const handleVerify = (action: 'edit' | 'delete') => {
    const input = prompt('비밀번호를 입력하세요.');
    if (input === ADMIN_PASSWORD) {
      if (action === 'edit') {
        setIsEditing(true);
      } else {
        handleDelete();
      }
    } else if (input !== null) {
      alert('비밀번호가 틀렸습니다.');
    }
  };

  const handleDelete = async () => {
    if (!confirm('정말로 이 글을 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase.from('posts').delete().eq('id', post.id);
      if (error) throw error;
      alert('삭제되었습니다.');
      router.push('/board');
      router.refresh();
    } catch (err: any) {
      alert('삭제 중 오류가 발생했습니다: ' + err.message);
    }
  };

  const handleUpdate = async () => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({
          title: formData.title,
          content: formData.content,
          author_name: formData.author_name,
        })
        .eq('id', post.id);

      if (error) throw error;
      alert('수정되었습니다.');
      setIsEditing(false);
      router.refresh();
    } catch (err: any) {
      alert('수정 중 오류가 발생했습니다: ' + err.message);
    }
  };

  if (isEditing) {
    return (
      <div className={styles.editForm}>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className={styles.editInput}
          placeholder="제목"
        />
        <input
          type="text"
          value={formData.author_name}
          onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
          className={styles.editInput}
          placeholder="작성자"
        />
        <textarea
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          className={styles.editTextarea}
          placeholder="내용"
        />
        <div className={styles.editButtons}>
          <button onClick={handleUpdate} className={styles.saveButton}>저장</button>
          <button onClick={() => setIsEditing(false)} className={styles.cancelButton}>취소</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.actionButtons}>
      <button onClick={() => handleVerify('edit')} className={styles.editBtn}>수정</button>
      <button onClick={() => handleVerify('delete')} className={styles.deleteBtn}>삭제</button>
    </div>
  );
}
