import { Client, Databases, ID } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client();
client
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const dbId = process.env.VITE_APPWRITE_DATABASE_ID;
const collectionId = process.env.VITE_APPWRITE_ISSUES_COLLECTION_ID;

const mockIssues = [
    {
        title: 'pothole',
        description: 'Large pothole on the main road causing traffic delays.',
        status: 'OPEN',
        location_lat: 20.296,
        location_lng: 85.824,
        location_address: 'Bhubaneswar Central',
        citizenId: 'mock-user-1',
        imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80',
        createdAt: new Date().toISOString()
    },
    {
        title: 'garbage',
        description: 'Trash overflowing near the residential area.',
        status: 'RESOLVED',
        location_lat: 20.301,
        location_lng: 85.831,
        location_address: 'Bhubaneswar North',
        citizenId: 'mock-user-2',
        imageUrl: 'https://images.unsplash.com/photo-1605600659873-d808a1d85f26?auto=format&fit=crop&q=80',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
        title: 'street_light',
        description: 'Street lights not working for the past 3 days.',
        status: 'PENDING_VERIFICATION',
        location_lat: 20.285,
        location_lng: 85.815,
        location_address: 'Ekamra-Bhubaneswar',
        citizenId: 'mock-user-3',
        imageUrl: 'https://images.unsplash.com/photo-1558485233-d15f1f9e2e6c?auto=format&fit=crop&q=80',
        createdAt: new Date(Date.now() - 86400000).toISOString()
    }
];

async function seed() {
    console.log("Seeding database...");
    for (const issue of mockIssues) {
        try {
            await databases.createDocument(dbId, collectionId, ID.unique(), issue);
            console.log(`Created mock issue: ${issue.title}`);
        } catch (e) {
            console.error("Error creating issue:", e);
        }
    }
    console.log("Seeding complete!");
}

seed();
