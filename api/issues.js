import { Client, Databases, ID, Query } from 'node-appwrite';

export default async function handler(req, res) {
    const client = new Client();

    client
        .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
        .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);
    const dbId = process.env.VITE_APPWRITE_DATABASE_ID;
    const collectionId = process.env.VITE_APPWRITE_ISSUES_COLLECTION_ID;

    if (req.method === 'GET') {
        try {
            const response = await databases.listDocuments(dbId, collectionId);
            return res.status(200).json(response.documents);
        } catch (error) {
            console.error("API GET Error:", error);
            return res.status(500).json({ error: 'Failed to fetch issues' });
        }
    } 
    
    if (req.method === 'POST') {
        try {
            const issueData = req.body;
            
            const document = await databases.createDocument(
                dbId,
                collectionId,
                ID.unique(),
                {
                    title: issueData.aiAnalysis?.issueType || 'Civic Issue',
                    description: issueData.userDescription || issueData.aiAnalysis?.description || 'No description provided.',
                    status: 'Open',
                    location_lat: issueData.location?.lat,
                    location_lng: issueData.location?.lng,
                    location_address: issueData.location?.address || 'Unknown Location',
                    citizenId: issueData.citizenId || 'anonymous',
                    imageUrl: issueData.photoUrl || '',
                    createdAt: new Date().toISOString()
                }
            );
            return res.status(201).json({ id: document.$id });
        } catch (error) {
            console.error("API POST Error:", error);
            return res.status(500).json({ error: 'Failed to create issue report' });
        }
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
}
