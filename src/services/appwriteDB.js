import { storage, ID } from '../lib/appwrite';

const STORAGE_ID = import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID;

// Helper to convert base64 image data to a File object
const dataUrlToFile = async (dataUrl, filename) => {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type });
};

export const uploadEvidencePhoto = async (photoDataUrl) => {
    if (!photoDataUrl) return null;
    
    try {
        const file = await dataUrlToFile(photoDataUrl, `evidence_${Date.now()}.jpg`);
        const result = await storage.createFile(STORAGE_ID, ID.unique(), file);
        return result.$id; // We store the File ID, and can get the view URL later using storage.getFileView(STORAGE_ID, fileId)
    } catch (error) {
        console.error("Storage Error:", error);
        throw error;
    }
};

export const createIssueReport = async (issueData) => {
    try {
        const response = await fetch('/api/issues', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(issueData)
        });
        if (!response.ok) throw new Error('Failed to create issue report');
        const data = await response.json();
        return data.id;
    } catch (error) {
        console.error("Database Error:", error);
        throw error;
    }
};

export const fetchIssuesForOfficial = async (officialJurisdictionState, officialJurisdictionCity) => {
    try {
        const response = await fetch('/api/issues');
        if (!response.ok) throw new Error('Failed to fetch issues');
        return await response.json();
    } catch (error) {
        console.error("Database Fetch Error:", error);
        return [];
    }
};

export const updateIssueStatus = async (issueId, newStatus) => {
    try {
        const response = await fetch('/api/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ issueId, newStatus })
        });
        if (!response.ok) throw new Error('Failed to update issue status');
    } catch (error) {
        console.error("Update Error:", error);
        throw error;
    }
};

export const getAllIssues = async () => {
    try {
        const response = await fetch('/api/issues');
        if (!response.ok) throw new Error('Failed to fetch all issues');
        return await response.json();
    } catch (error) {
        console.error("Database Fetch Error:", error);
        return [];
    }
};

export const getSystemStatistics = async () => {
    try {
        const response = await fetch('/api/stats');
        if (!response.ok) throw new Error('Failed to fetch system stats');
        return await response.json();
    } catch (error) {
        console.error("Stats Error:", error);
        return { totalIssues: 0, resolvedIssues: 0, aiVerificationRate: 100 };
    }
};

export const verifyIssue = async (issueId) => {
    try {
        const response = await fetch('/api/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ issueId })
        });
        if (!response.ok) throw new Error('Failed to verify issue');
    } catch (error) {
        console.error("Verify Error:", error);
        throw error;
    }
};
