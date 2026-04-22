import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 실제 배포 도메인 주소 (구글 서치 콘솔 등록 주소)
  const baseUrl = 'https://board-ten-orcin.vercel.app';

  try {
    // 1. 모든 공개된 게시글 ID 가져오기
    const { data: posts } = await supabase
      .from('posts')
      .select('id, scheduled_at')
      .eq('type', 'question')
      .eq('published', true)
      .order('scheduled_at', { ascending: false });

    // 2. 게시글 URL 생성
    const postUrls = (posts || []).map((post) => ({
      url: `${baseUrl}/board/${post.id}`,
      lastModified: post.scheduled_at ? new Date(post.scheduled_at) : new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }));

    // 3. 정적 페이지와 동적 게시글 합치기
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 1.0,
      },
      {
        url: `${baseUrl}/board`,
        lastModified: new Date(),
        changeFrequency: 'always' as const,
        priority: 0.8,
      },
      ...postUrls,
    ];
  } catch (error) {
    console.error('Sitemap generation error:', error);
    // 에러 발생 시 최소한의 기본 경로라도 반환
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
      },
      {
        url: `${baseUrl}/board`,
        lastModified: new Date(),
      },
    ];
  }
}
