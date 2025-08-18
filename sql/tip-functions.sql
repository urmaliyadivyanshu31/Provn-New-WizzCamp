-- Function to increment video tip counts
CREATE OR REPLACE FUNCTION increment_video_tips(token_id TEXT, tip_amount DECIMAL)
RETURNS void AS $$
BEGIN
  UPDATE platform_videos 
  SET 
    tips_count = COALESCE(tips_count, 0) + 1,
    tips_total_amount = COALESCE(tips_total_amount, 0) + tip_amount,
    updated_at = now()
  WHERE video_token_id = token_id;
  
  -- If no rows were updated, it means the video doesn't exist in platform_videos
  -- This could happen for blockchain-only videos, which is fine
  IF NOT FOUND THEN
    RAISE NOTICE 'Video % not found in platform_videos table', token_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to increment profile tip counts
CREATE OR REPLACE FUNCTION increment_profile_tips(wallet_addr TEXT, tip_amount DECIMAL)
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET 
    updated_at = now()
  WHERE wallet_address = wallet_addr;
  
  -- If no rows were updated, it means the profile doesn't exist
  -- This could happen if someone tips a creator who hasn't created a profile yet
  IF NOT FOUND THEN
    RAISE NOTICE 'Profile % not found in profiles table', wallet_addr;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION increment_video_tips(TEXT, DECIMAL) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION increment_profile_tips(TEXT, DECIMAL) TO authenticated, anon, service_role;