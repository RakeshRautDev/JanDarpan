import { Client, Databases, Storage, ID } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client();

const endpoint = process.env.VITE_APPWRITE_ENDPOINT;
const projectId = process.env.VITE_APPWRITE_PROJECT_ID;
const databaseId = process.env.VITE_APPWRITE_DATABASE_ID;
const apiKey = process.env.APPWRITE_API_KEY;

if (!endpoint || !projectId || !databaseId || !apiKey) {
    console.error("Missing required environment variables. Please check your .env file.");
    console.error("Make sure you have: VITE_APPWRITE_ENDPOINT, VITE_APPWRITE_PROJECT_ID, VITE_APPWRITE_DATABASE_ID, APPWRITE_API_KEY");
    process.exit(1);
}

client.setEndpoint(endpoint);
client.setProject(projectId);
client.setKey(apiKey);

const databases = new Databases(client);

async function setup() {
    try {
        console.log("Setting up Appwrite Collections...");

        // 1. Create Representatives Collection
        console.log("Creating Representatives Collection...");
        const repCollection = await databases.createCollection(
            databaseId,
            ID.unique(),
            'Representatives'
        );
        console.log(`Created Representatives Collection: ${repCollection.$id}`);

        // Add Attributes to Representatives
        await databases.createStringAttribute(databaseId, repCollection.$id, 'name', 255, true);
        await databases.createStringAttribute(databaseId, repCollection.$id, 'position', 255, true);
        await databases.createStringAttribute(databaseId, repCollection.$id, 'level', 100, true);
        await databases.createStringAttribute(databaseId, repCollection.$id, 'jurisdiction_state', 255, false);
        await databases.createStringAttribute(databaseId, repCollection.$id, 'jurisdiction_city', 255, false);
        await databases.createStringAttribute(databaseId, repCollection.$id, 'jurisdiction_district', 255, false);
        await databases.createStringAttribute(databaseId, repCollection.$id, 'party', 255, false);
        await databases.createStringAttribute(databaseId, repCollection.$id, 'contact_email', 255, false);
        await databases.createStringAttribute(databaseId, repCollection.$id, 'contact_phone', 100, false);
        
        // Wait for attributes to be created (Appwrite takes a moment)
        console.log("Waiting for Representatives attributes to be created...");
        await new Promise(resolve => setTimeout(resolve, 3000));

        // 2. Create Issues Collection
        console.log("Creating Issues Collection...");
        const issueCollection = await databases.createCollection(
            databaseId,
            ID.unique(),
            'Issues'
        );
        console.log(`Created Issues Collection: ${issueCollection.$id}`);

        // Add Attributes to Issues
        await databases.createStringAttribute(databaseId, issueCollection.$id, 'title', 255, true);
        await databases.createStringAttribute(databaseId, issueCollection.$id, 'description', 5000, true);
        await databases.createStringAttribute(databaseId, issueCollection.$id, 'status', 100, false, 'Open');
        await databases.createFloatAttribute(databaseId, issueCollection.$id, 'location_lat', false);
        await databases.createFloatAttribute(databaseId, issueCollection.$id, 'location_lng', false);
        await databases.createStringAttribute(databaseId, issueCollection.$id, 'location_address', 500, false);
        await databases.createStringAttribute(databaseId, issueCollection.$id, 'citizenId', 100, true);
        await databases.createStringAttribute(databaseId, issueCollection.$id, 'assignedOfficialId', 100, false);
        await databases.createStringAttribute(databaseId, issueCollection.$id, 'imageUrl', 1000, false);
        await databases.createDatetimeAttribute(databaseId, issueCollection.$id, 'createdAt', false);

        console.log("Waiting for Issues attributes to be created...");
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log("\n✅ Setup Complete!");
        console.log("-----------------------------------------");
        console.log(`Please update your .env file with these new Collection IDs:`);
        console.log(`VITE_APPWRITE_REPRESENTATIVES_COLLECTION_ID="${repCollection.$id}"`);
        console.log(`VITE_APPWRITE_ISSUES_COLLECTION_ID="${issueCollection.$id}"`);
        console.log("-----------------------------------------");

    } catch (error) {
        console.error("Error setting up collections:", error);
    }
}

setup();
