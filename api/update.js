import { Client, Databases } from 'node-appwrite';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { issueId, newStatus } = req.body;
    if (!issueId || !newStatus) {
        return res.status(400).json({ error: 'issueId and newStatus are required' });
    }

    const client = new Client();
    client
        .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
        .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);
    const dbId = process.env.VITE_APPWRITE_DATABASE_ID;
    const collectionId = process.env.VITE_APPWRITE_ISSUES_COLLECTION_ID;

    try {
        await databases.updateDocument(dbId, collectionId, issueId, {
            status: newStatus
        });
        
        return res.status(200).json({ success: true, status: newStatus });
    } catch (error) {
        console.error("API Update Error:", error);
        return res.status(500).json({ error: 'Failed to update issue status' });
    }
}
