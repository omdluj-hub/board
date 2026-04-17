-- Final verification (v4) - Prefers IPv4 via gai.conf
-- This is the most reliable way to handle dual-stack DNS in CI environments.
-- Created at: 2026-04-17
SELECT now() AS final_test_v4;
