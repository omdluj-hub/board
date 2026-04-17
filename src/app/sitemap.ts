import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://your-domain.vercel.app'; // 본인의 실제 도메인으로 나중에 수정해 주세요.

  // 모든 게시글 ID 가져오기
  const { data: posts } = await supabase
    .from('posts')
    .select('id, scheduled_at')
    .eq('type', 'question')
    .eq('published', true);

  const postUrls = (posts || []).map((post) => ({
    url: `${baseUrl}/board/${post.id}`,
    lastModified: new Date(post.scheduled_at),
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/board`,
      lastModified: new Date(),
    },
    ...postUrls,
  ];
}
