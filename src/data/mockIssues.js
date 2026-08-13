/**
 * Shared mock issue data for demo mode.
 * Imported by LiveMap, IssueDetail, and Community pages.
 */
export const MOCK_ISSUES = [
    {
        id: 'm1',
        location: { latitude: 20.2961, longitude: 85.8245, address: 'Saheed Nagar, Bhubaneswar' },
        aiClassification: { issueType: 'pothole', severity: 8, description: 'Deep pothole on main road near Saheed Nagar junction. Approximately 2 feet wide and 8 inches deep. Multiple vehicles have been damaged.' },
        status: 'OPEN', upvotes: 42,
        userDescription: 'Big pothole near the traffic signal, very dangerous for two-wheelers. My friend got injured falling into it last week.',
        reportedAt: new Date(Date.now() - 47 * 24 * 60 * 60 * 1000),
        constituency: 'Bhubaneswar', state: 'Odisha', commentCount: 3,
        additionalReports: [
            { photoUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80', userDescription: 'It keeps getting worse after the rain.', timestamp: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString() },
            { photoUrl: 'https://images.unsplash.com/photo-1541888035136-1262d14cbdf8?auto=format&fit=crop&q=80', userDescription: 'Almost crashed my bike here.', timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() }
        ]
    },
    {
        id: 'm2',
        location: { latitude: 20.3015, longitude: 85.8320, address: 'Rasulgarh Chowk, Bhubaneswar' },
        aiClassification: { issueType: 'garbage', severity: 5, description: 'Uncollected garbage pile near Rasulgarh Chowk. Organic waste decomposing in open.' },
        status: 'OPEN', upvotes: 12,
        userDescription: 'Garbage not collected for 3 days, attracting stray dogs.',
        reportedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        constituency: 'Bhubaneswar', state: 'Odisha', commentCount: 1,
    },
    {
        id: 'm3',
        location: { latitude: 20.2830, longitude: 85.8180, address: 'Vani Vihar Railway Bridge, Bhubaneswar' },
        aiClassification: { issueType: 'waterlog', severity: 9, description: 'Severe waterlogging under Vani Vihar railway bridge. Water level reaches 3 feet during moderate rain.' },
        status: 'OPEN', upvotes: 156,
        userDescription: 'Water fills up to knee height even with moderate rain. Buses and autos refuse to pass.',
        reportedAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000),
        constituency: 'Bhubaneswar', state: 'Odisha', commentCount: 12,
        additionalReports: [
            { photoUrl: 'https://images.unsplash.com/photo-1580194042857-8280f1e007d4?auto=format&fit=crop&q=80', userDescription: 'Still completely flooded today.', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }
        ]
    },
    {
        id: 'm4',
        location: { latitude: 20.2900, longitude: 85.8400, address: 'Kalpana Square, Bhubaneswar' },
        aiClassification: { issueType: 'street_light', severity: 4, description: 'Broken street light near Kalpana Square. Area completely dark after 7 PM.' },
        status: 'INVESTIGATING', upvotes: 8,
        userDescription: 'Multiple lights out on this stretch.',
        reportedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        constituency: 'Bhubaneswar', state: 'Odisha', commentCount: 2,
    },
    {
        id: 'm5',
        location: { latitude: 20.3050, longitude: 85.8150, address: 'Jaydev Vihar Square, Bhubaneswar' },
        aiClassification: { issueType: 'open_drain', severity: 7, description: 'Open drain cover missing near Jaydev Vihar. High risk of pedestrian injury.' },
        status: 'OPEN', upvotes: 34,
        userDescription: 'A child almost fell in yesterday. Extremely dangerous.',
        reportedAt: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000),
        constituency: 'Bhubaneswar', state: 'Odisha', commentCount: 5,
    },
    {
        id: 'm6',
        location: { latitude: 20.2750, longitude: 85.8350, address: 'Master Canteen, Bhubaneswar' },
        aiClassification: { issueType: 'road_damage', severity: 6, description: 'Road surface cracked after recent construction work.' },
        status: 'RESOLVED', upvotes: 19,
        userDescription: 'They dug up the road for pipeline and never repaired it properly.',
        reportedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        constituency: 'Bhubaneswar', state: 'Odisha', commentCount: 7,
    },
    {
        id: 'm7',
        location: { latitude: 20.3100, longitude: 85.8050, address: 'Patia, Bhubaneswar' },
        aiClassification: { issueType: 'debris', severity: 5, description: 'Construction debris dumped on the footpath near Patia Chowk.' },
        status: 'OPEN', upvotes: 7,
        userDescription: 'Pedestrians forced to walk on the road.',
        reportedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        constituency: 'Bhubaneswar', state: 'Odisha', commentCount: 0,
    },
    {
        id: 'm8',
        location: { latitude: 20.3550, longitude: 85.8140, address: 'Chandrasekharpur, Bhubaneswar' },
        aiClassification: { issueType: 'accident_spot', severity: 9, description: 'Dangerous blind turn near KIIT University campus.' },
        status: 'OPEN', upvotes: 88,
        userDescription: 'Multiple accidents in the last month. No speed breaker or mirror installed.',
        reportedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        constituency: 'Bhubaneswar', state: 'Odisha', commentCount: 15,
    },
];

export const MOCK_COMMENTS = [
    { id: 'c1', user: 'Resident', text: 'I pass by this spot every day. It has been getting worse over the past month.', time: '2 days ago', badge: 'I Live Here' },
    { id: 'c2', user: 'Commuter', text: 'Saw a scooter rider fall here yesterday morning. Needs urgent attention.', time: '1 day ago', badge: null },
    { id: 'c3', user: 'Ward 10 Member', text: 'We have forwarded this to the PWD department. Expecting action within a week.', time: '5 hours ago', badge: 'Official' },
];
