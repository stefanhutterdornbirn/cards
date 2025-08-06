-- Add email verification columns to credentials table
ALTER TABLE credentials ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE credentials ADD COLUMN IF NOT EXISTS verification_token VARCHAR(100);
ALTER TABLE credentials ADD COLUMN IF NOT EXISTS verification_token_expiry VARCHAR(50);

-- Update admin user to be verified
UPDATE credentials SET email_verified = true WHERE username = 'admin';

-- Show table structure to confirm
\d credentials;