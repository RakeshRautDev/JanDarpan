import { db, auth } from './firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, updateDoc, doc, increment, getDoc, arrayUnion, setDoc } from 'firebase/firestore';
import { uploadToCloudinary } from './cloudinary';
import { getLocationData } from './geo';
import * as geofire from 'geofire-common';

/**
 * Uploads a base64 image (with EXIF already stripped) to Cloudinary
 * @param {string} base64Data - Data URL of the image
 * @returns {Promise<string>} - Public download URL
 */
export const uploadEvidencePhoto = async (base64Data) => {
    return await uploadToCloudinary(base64Data);
};

/**
 * Submits a new civic issue to Firestore.
 * 
 * @param {Object} issueData - Payload containing report details
 * @param {string} issueData.photoUrl - URL of uploaded photo
 * @param {Object} issueData.location - Lat/Lng and address
 * @param {Object} issueData.aiAnalysis - Output from Gemini validation
 * @returns {Promise<string>} - The newly created document ID
 */
export const createIssueReport = async (issueData) => {
    try {
        const issuesRef = collection(db, 'issues');
        const lat = issueData.location.lat;
        const lng = issueData.location.lng;
        const hash = geofire.geohashForLocation([lat, lng]);

        // --- DUPLICATE DETECTION (50m Radius) ---
        const radiusInM = 50;
        const bounds = geofire.geohashQueryBounds([lat, lng], radiusInM);
        const promises = [];

        for (const b of bounds) {
            const q = query(
                issuesRef,
                orderBy('location.geohash'),
                // Using startAt/endAt for Firestore range filtering
            );
            // In a real app we'd attach where clauses here, but keeping it simple for the array map
            promises.push(getDocs(q));
        }

        const snapshots = await Promise.all(promises);
        const matchingDocs = [];

        let closestDistanceInM = Infinity;

        for (const snap of snapshots) {
            for (const doc of snap.docs) {
                const lat2 = doc.get('location.latitude');
                const lng2 = doc.get('location.longitude');
                const issueType = doc.get('aiClassification.issueType');

                // We have to filter the exact distance on client side per Firebase Geo docs
                const distanceInKm = geofire.distanceBetween([lat, lng], [lat2, lng2]);
                const distanceInM = distanceInKm * 1000;

                // If within 50m AND the AI classified it as the same problem type
                if (distanceInM <= radiusInM && issueType === issueData.aiAnalysis.issueType) {
                    matchingDocs.push(doc);
                    if (distanceInM < closestDistanceInM) closestDistanceInM = distanceInM;
                }
            }
        }

        if (matchingDocs.length > 0) {
            // MERGE: An issue already exists here. 
            // We just upvote the existing one and attach our new photo as additional evidence.
            const existingIssue = matchingDocs[0];
            const issueRef = doc(db, 'issues', existingIssue.id);

            await updateDoc(issueRef, {
                upvotes: increment(1),
                additionalReports: arrayUnion({
                    photoUrl: issueData.photoUrl,
                    userDescription: issueData.userDescription || null,
                    timestamp: new Date().toISOString()
                })
            });

            console.log(`Merged with existing issue ${existingIssue.id} (approx ${Math.round(closestDistanceInM)}m away)`);
            return existingIssue.id;
        }
        // --- END DUPLICATE DETECTION ---

        // Structure strictly enforcing our schema
        const newDoc = await addDoc(issuesRef, {
            photoUrl: issueData.photoUrl,
            location: {
                latitude: lat,
                longitude: lng,
                geohash: hash,
                address: issueData.location.address || 'Unknown Address',
                ward: issueData.location.ward || 'Unknown Ward',
                mappedConstituency: await getLocationData(issueData.location.lat, issueData.location.lng)
            },
            aiClassification: {
                issueType: issueData.aiAnalysis.issueType,
                severity: issueData.aiAnalysis.severity,
                description: issueData.aiAnalysis.description,
                verifiedGenuine: issueData.aiAnalysis.isRealIssue
            },
            userDescription: issueData.userDescription || null,
            status: 'OPEN', // OPEN, INVESTIGATING, RESOLVED
            upvotes: 1,
            reportedAt: new Date().toISOString(),
            additionalReports: [], // Array to store photos from merged duplicate reports
            timestamp: serverTimestamp(),
            trustTier: 'ANONYMOUS', // Future proofing: ANONYMOUS, REGISTERED, VERIFIED_CITIZEN
            escalated: false, // Flag for 48h SLA breach
            userId: auth.currentUser ? auth.currentUser.uid : (issueData.userId || null),
            userName: auth.currentUser ? auth.currentUser.displayName : 'Anonymous Citizen'
        });

        return newDoc.id;
    } catch (error) {
        console.error("Error creating issue report in Firestore:", error);
        throw error;
    }
};

/**
 * Validates/Upvotes an issue.
 * Increments the upvote counter on the specific issue doc.
 */
export const verifyIssue = async (issueId) => {
    try {
        const issueRef = doc(db, 'issues', issueId);
        await updateDoc(issueRef, {
            upvotes: increment(1)
        });
        return true;
    } catch (error) {
        console.error("Error verifying issue:", error);
        throw error;
    }
}

/**
 * Fetches the feed of latest reported issues.
 */
export const getActiveIssues = async () => {
    try {
        const issuesRef = collection(db, 'issues');
        const q = query(issuesRef, orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error fetching active issues:", error);
        return [];
    }
}

/**
 * Fetches a single issue by ID.
 */
export const getIssueById = async (issueId) => {
    try {
        const docRef = doc(db, 'issues', issueId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    } catch (error) {
        console.error("Error fetching issue by ID:", error);
        return null;
    }
};

/**
 * Creates or updates a user profile document when they register or login via Google
 */
export const createUserProfile = async (uid, userData) => {
    try {
        const userRef = doc(db, 'users', uid);
        const docSnap = await getDoc(userRef);

        // Only create if it doesn't exist to avoid overwriting preferences
        if (!docSnap.exists()) {
            await setDoc(userRef, {
                displayName: userData.displayName || 'Citizen',
                email: userData.email,
                photoURL: userData.photoURL || null,
                reputationScore: 0,
                badges: ['Verified Citizen'],
                homeConstituency: null,
                homeWard: null,
                createdAt: serverTimestamp()
            });
        }
    } catch (error) {
        console.error("Error creating user profile in Firestore:", error);
    }
};

/**
 * Fetches the user profile from Firestore
 */
export const getUserProfile = async (uid) => {
    try {
        const userRef = doc(db, 'users', uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
            return { uid: docSnap.id, ...docSnap.data() };
        }
        return null; // Profile not found
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return null;
    }
};

/**
 * Updates an existing user profile
 */
export const updateUserProfile = async (uid, updates) => {
    try {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, updates);
        return true;
    } catch (error) {
        console.error("Error updating user profile:", error);
        return false;
    }
};

/**
 * Vote on a PENDING_VERIFICATION issue resolution
 */
export const voteOnResolution = async (issueId, voteType) => {
    try {
        const issueRef = doc(db, 'issues', issueId);
        await updateDoc(issueRef, {
            [`communityVotes.${voteType}`]: increment(1)
        });

        // Let's add an audit log for transparency
        await addDoc(collection(db, 'AuditLogs'), {
            issueId: issueId,
            action: `COMMUNITY_VOTE_${voteType.toUpperCase()}`,
            timestamp: serverTimestamp()
        });

        return true;
    } catch (error) {
        console.error("Error voting on resolution:", error);
        return false;
    }
};

/**
 * Adds a comment to an issue
 */
export const addComment = async (issueId, commentText, userProfile) => {
    try {
        const commentsRef = collection(db, 'issues', issueId, 'comments');
        const newComment = await addDoc(commentsRef, {
            text: commentText,
            userId: userProfile?.uid || 'anonymous',
            userName: userProfile?.displayName || 'Citizen',
            badge: userProfile?.badges?.[0] || null,
            timestamp: serverTimestamp(),
            reportedAt: new Date().toISOString()
        });

        // Increment the commentCount on the main issue document
        const issueRef = doc(db, 'issues', issueId);
        await updateDoc(issueRef, {
            commentCount: increment(1)
        });

        return {
            id: newComment.id,
            user: userProfile?.displayName || 'Citizen',
            text: commentText,
            time: 'Just now',
            badge: userProfile?.badges?.[0] || null
        };
    } catch (error) {
        console.error("Error adding comment:", error);
        throw error;
    }
};

/**
 * Gets all comments for an issue
 */
export const getComments = async (issueId) => {
    try {
        const commentsRef = collection(db, 'issues', issueId, 'comments');
        const q = query(commentsRef, orderBy('timestamp', 'asc'));
        const querySnapshot = await getDocs(q);
        
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            const date = data.timestamp ? data.timestamp.toDate() : new Date();
            return {
                id: doc.id,
                user: data.userName || 'Citizen',
                text: data.text,
                time: date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                badge: data.badge || null
            };
        });
    } catch (error) {
        console.error("Error getting comments:", error);
        return [];
    }
};

