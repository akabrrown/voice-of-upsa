-- Add sample ads without website links but with detailed information
-- This will test the alert functionality when no website URL is provided

INSERT INTO ad_submissions (
  first_name, last_name, email, phone, company, business_type, 
  ad_type, ad_title, ad_description, target_audience, budget, 
  duration, start_date, website, terms_accepted, status
) VALUES 
  ('Sarah', 'Williams', 'sarah@local.com', '+233501234570', 'Local Store', 'small-business', 
   'banner', 'Weekend Special Sale', 'Huge weekend sale with up to 50% off on all electronics and home appliances. Visit our store in Accra for amazing deals on phones, laptops, and home entertainment systems. Limited stock available!', 
   'Local shoppers and bargain hunters', 'GHS 300', '2-weeks', CURRENT_DATE, NULL, true, 'published'),
   
  ('David', 'Brown', 'david@service.com', '+233501234571', 'Professional Services', 'individual', 
   'sidebar', 'Expert Consulting Available', 'Professional business consulting services available for startups and SMEs. Specializing in business strategy, financial planning, and market entry strategies. 10+ years experience helping businesses grow. Contact for initial consultation.', 
   'Entrepreneurs and business owners', 'GHS 200', '1-month', CURRENT_DATE, NULL, true, 'published'),
   
  ('Emma', 'Davis', 'emma@creative.com', '+233501234572', 'Creative Agency', 'corporate', 
   'sponsored-content', 'Creative Design Solutions', 'Full-service creative agency offering logo design, branding, web design, and digital marketing solutions. We help businesses create compelling visual identities that stand out in the market. Portfolio available upon request.', 
   'Businesses needing rebranding', 'GHS 800', '1-month', CURRENT_DATE, NULL, true, 'published');

-- Show all ads with their link status
SELECT 
  ad_title,
  ad_type,
  company,
  CASE 
    WHEN website IS NULL THEN 'NO LINK (Will show alert)'
    ELSE 'HAS LINK (Will open website)'
  END as link_status,
  status
FROM ad_submissions 
WHERE status = 'published'
ORDER BY ad_type, link_status DESC;
