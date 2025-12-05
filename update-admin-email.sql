-- Update admin user email in database
-- This updates the admin record to use the correct email

UPDATE users SET 
    email = 'admin@voiceofupsa.com'
WHERE email = 'admin@upsa.edu.gh';

-- Also create a new record if it doesn't exist
INSERT INTO users (
    id, 
    email, 
    name, 
    role, 
    created_at, 
    updated_at
) VALUES (
    '315e6978-4406-4f53-ad96-9732e2579323',
    'admin@voiceofupsa.com',
    'Admin User',
    'admin',
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    role = EXCLUDED.role,
    updated_at = NOW();

SELECT 'Admin user email updated successfully' as result;
