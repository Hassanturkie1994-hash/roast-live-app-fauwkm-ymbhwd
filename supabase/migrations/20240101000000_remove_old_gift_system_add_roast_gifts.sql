
-- ============================================================================
-- Migration: Remove Old Gift System and Add Roast Gift System
-- ============================================================================

-- Drop old gift system tables and functions
DROP TABLE IF EXISTS gift_events CASCADE;
DROP TABLE IF EXISTS gift_transactions CASCADE;
DROP TABLE IF EXISTS gifts CASCADE;
DROP FUNCTION IF EXISTS increment_gift_usage CASCADE;

-- Create roast_gift_transactions table
CREATE TABLE roast_gift_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gift_id TEXT NOT NULL,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stream_id UUID REFERENCES live_streams(id) ON DELETE SET NULL,
  amount_sek DECIMAL(10, 2) NOT NULL,
  platform_fee DECIMAL(10, 2) NOT NULL,
  creator_payout DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE roast_gift_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own transactions"
  ON roast_gift_transactions FOR SELECT
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can create transactions"
  ON roast_gift_transactions FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- Indexes for performance
CREATE INDEX idx_roast_gift_transactions_sender ON roast_gift_transactions(sender_id);
CREATE INDEX idx_roast_gift_transactions_receiver ON roast_gift_transactions(receiver_id);
CREATE INDEX idx_roast_gift_transactions_stream ON roast_gift_transactions(stream_id);
CREATE INDEX idx_roast_gift_transactions_created_at ON roast_gift_transactions(created_at DESC);

-- Add comment
COMMENT ON TABLE roast_gift_transactions IS 'Roast gift transactions with 30/70 platform/creator split';
