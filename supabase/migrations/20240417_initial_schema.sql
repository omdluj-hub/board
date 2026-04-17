-- 1. 테이블 생성 (이미 있으면 건너뜀)
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('question', 'answer')),
    title TEXT,
    content TEXT NOT NULL,
    author_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    scheduled_at TIMESTAMPTZ NOT NULL,
    published BOOLEAN DEFAULT FALSE,
    parent_id UUID REFERENCES posts(id) ON DELETE CASCADE
);

-- 2. 인덱스 생성 (이미 있으면 건너뜀)
CREATE INDEX IF NOT EXISTS idx_posts_published_scheduled ON posts (published, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_posts_type ON posts (type);
CREATE INDEX IF NOT EXISTS idx_posts_parent_id ON posts (parent_id);

-- 3. RLS 활성화
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 4. 기존 정책 삭제 후 재생성 (에러 방지용)
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Public read access to published posts" ON posts;
    DROP POLICY IF EXISTS "Public insert access" ON posts;
    DROP POLICY IF EXISTS "Public update access" ON posts;
    DROP POLICY IF EXISTS "Public delete access" ON posts;
    DROP POLICY IF EXISTS "Service role full access" ON posts;
END $$;

-- 5. 정책 생성
CREATE POLICY "Public read access to published posts" ON posts FOR SELECT USING (published = true);
CREATE POLICY "Public insert access" ON posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON posts FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON posts FOR DELETE USING (true);
CREATE POLICY "Service role full access" ON posts FOR ALL USING (true);
