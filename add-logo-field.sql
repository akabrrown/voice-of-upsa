-- Add site_logo field to site_settings table
ALTER TABLE site_settings 
ADD COLUMN site_logo VARCHAR(500) DEFAULT '/logo.jpg';

-- Update the existing default record to include the logo
UPDATE site_settings 
SET site_logo = '/logo.jpg' 
WHERE id = 'default';
