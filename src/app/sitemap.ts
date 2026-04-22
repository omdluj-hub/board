import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 실제 배포 도메인 주소로 업데이트되었습니다.
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://board-ten-orcin.vercel.app';

  try {
    // 모든 게시글 ID 가져오기 (비공개 글 제외)
    const { data: posts } = await supabase
      .from('posts')
      .select('id, scheduled_at')
      .eq('type', 'question')
      .eq('published', true);

    const postUrls = (posts || []).map((post) => ({
      url: `${baseUrl}/board/${post.id}`,
      lastModified: post.scheduled_at ? new Date(post.scheduled_at) : new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }));

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
        changeFrequency: 'daily' as const,
        priority: 0.8,
      },
      ...postUrls,
    ];
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
      },
    ];
  }
}
