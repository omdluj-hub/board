-- Create posts table
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

-- Index for efficient querying by published and scheduled_at
CREATE INDEX idx_posts_published_scheduled ON posts (published, scheduled_at);
CREATE INDEX idx_posts_type ON posts (type);
CREATE INDEX idx_posts_parent_id ON posts (parent_id);

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Allow public read access to published posts
CREATE POLICY "Public read access to published posts" ON posts
    FOR SELECT USING (published = true);

-- Allow service role to perform all actions
CREATE POLICY "Service role full access" ON posts
    FOR ALL USING (true);
