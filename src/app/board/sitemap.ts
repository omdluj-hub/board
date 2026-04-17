import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://your-domain.vercel.app'; // 실제 도메인으로 나중에 수정해 주세요.

  // 게시판의 모든 질문글 ID 가져오기
  const { data: posts } = await supabase
    .from('posts')
    .select('id, scheduled_at')
    .eq('type', 'question')
    .eq('published', true);

  const postUrls = (posts || []).map((post) => ({
    url: `${baseUrl}/board/${post.id}`,
    lastModified: new Date(post.scheduled_at),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  return [
    {
      url: `${baseUrl}/board`,
      lastModified: new Date(),
      changeFrequency: 'always' as const,
      priority: 1.0,
    },
    ...postUrls,
  ];
}
