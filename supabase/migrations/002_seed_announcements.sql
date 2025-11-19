
-- =====================================================
-- BLKOUT UK Communications System
-- Sample Announcements Data
-- =====================================================
-- This file contains sample announcements for testing

-- Insert sample announcements
INSERT INTO announcements (
    title,
    excerpt,
    content,
    category,
    link,
    status,
    display_date,
    priority,
    author_name
) VALUES
(
    'New Community Hub Features',
    'BLKOUT HUB now includes member forums, resource library, and cooperative decision-making tools.',
    'We''re excited to announce major updates to BLKOUT HUB! Our community platform now features:\n\n• Interactive member forums for community discussions\n• Comprehensive resource library with educational materials\n• Cooperative decision-making tools for collective governance\n• Enhanced user profiles and networking capabilities\n\nJoin us in building a stronger, more connected community.',
    'update',
    'https://blkouthub.com',
    'published',
    '2024-03-15 10:00:00+00',
    100,
    'BLKOUT Team'
),
(
    'Black Queer Liberation Summit 2024',
    'Join us for our annual gathering bringing together activists, artists, and organizers across the UK.',
    'The Black Queer Liberation Summit 2024 is coming this April! This transformative event brings together Black LGBTQ+ activists, artists, and community organizers from across the UK.\n\nEvent Details:\n• Date: April 20-21, 2024\n• Location: Community Centre, London\n• Registration opens March 25th\n\nFeatured sessions include workshops on community organizing, artistic expression, wellness, and building sustainable movements. Don''t miss this opportunity to connect, learn, and grow together.',
    'event',
    NULL,
    'published',
    '2024-04-20 09:00:00+00',
    150,
    'Events Team'
),
(
    'Media Sovereignty Workshop Series',
    'Learn to create liberatory content and build community power through storytelling.',
    'Join our 6-week workshop series on Media Sovereignty starting March 22nd!\n\nLearn essential skills in:\n• Digital storytelling and content creation\n• Community journalism and documentation\n• Video production and editing\n• Social media strategy for movements\n• Building audience and community engagement\n\nAll skill levels welcome. Workshops are free for community members. Limited spots available - register soon!',
    'campaign',
    NULL,
    'published',
    '2024-03-22 18:00:00+00',
    120,
    'Media Team'
),
(
    'Urgent: Support Needed for Community Member',
    'A community member is facing eviction and needs immediate support. Mutual aid fund activated.',
    'Community Alert: One of our members is facing immediate eviction and needs our collective support. Our mutual aid network has been activated.\n\nHow you can help:\n• Contribute to the emergency fund\n• Share resources and connections\n• Offer temporary housing support\n• Spread awareness\n\nContact our support coordinators for more information. Every bit of help makes a difference.',
    'urgent',
    NULL,
    'published',
    NOW(),
    200,
    'Support Coordinators'
),
(
    'Monthly Community Assembly - March',
    'Join our monthly gathering to discuss community priorities, initiatives, and collective decision-making.',
    'Our March Community Assembly is scheduled for this Friday!\n\nAgenda:\n• Welcome and community check-in\n• Updates on ongoing initiatives\n• Proposal: New youth mentorship program\n• Financial transparency report\n• Open forum and Q&A\n\nAll community members are welcome. Childcare and refreshments provided. ASL interpretation available upon request.',
    'event',
    NULL,
    'published',
    '2024-03-29 19:00:00+00',
    110,
    'Assembly Facilitators'
),
(
    'Resource Library Now Open',
    'Access hundreds of books, zines, and digital resources on Black liberation, organizing, and radical history.',
    'We''re thrilled to announce the opening of our Community Resource Library!\n\nThe library features:\n• 500+ books on Black liberation and social justice\n• Rare zines and community publications\n• Digital archive of historical documents\n• Study guides and educational materials\n• Comfortable reading and study spaces\n\nOpen Tuesday-Saturday, 12pm-8pm. Library memberships are free for all community members.',
    'update',
    NULL,
    'published',
    '2024-03-10 12:00:00+00',
    90,
    'Library Team'
),
(
    'Healing Justice Circle - Weekly Sessions',
    'Safe space for processing, healing, and building resilience together. Every Thursday evening.',
    'Join our weekly Healing Justice Circles every Thursday at 6:30 PM.\n\nThese circles provide:\n• Safe, confidential space for sharing\n• Trauma-informed facilitation\n• Collective healing practices\n• Community support and solidarity\n• Cultural grounding and spiritual wellness\n\nOpen to all Black community members. No prior experience necessary. Drop-ins welcome, but registration encouraged for planning purposes.',
    'campaign',
    NULL,
    'published',
    '2024-03-14 18:30:00+00',
    95,
    'Wellness Collective'
),
(
    'Draft: Upcoming Fundraiser Announcement',
    'Annual fundraiser planning in progress. This is a draft announcement not yet visible to the public.',
    'Draft content for upcoming fundraiser...',
    'campaign',
    NULL,
    'draft',
    '2024-04-15 10:00:00+00',
    0,
    'Fundraising Team'
);

-- Add a comment about the seed data
COMMENT ON TABLE announcements IS 'Sample data includes mix of events, updates, campaigns, and one urgent announcement. One draft announcement is included for testing admin views.';
