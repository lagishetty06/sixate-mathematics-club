import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  runTransaction,
  query,
  orderBy,
  onSnapshot,
  FirestoreError
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { StudentApplication, ApplicationStatus } from '../types';

// Environment / Public Firebase Config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDummySixateApiKeyForFallbackMode",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "sixate-math-club-2026.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "sixate-math-club-2026",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "sixate-math-club-2026.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "102938475612",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:102938475612:web:abcdef1234567890"
};

// Initialize Firebase App & Services
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Check if production Firebase configuration keys are provided
export function isFirebaseConfigured(): boolean {
  const key = import.meta.env.VITE_FIREBASE_API_KEY;
  return Boolean(key && !key.startsWith("AIzaSyDummy"));
}

// ----------------------------------------------------
// PUBLIC REGISTRATION API FUNCTIONS (FIRESTORE SOLE TRUTH)
// ----------------------------------------------------

export interface RegistrationPayload {
  fullName: string;
  rollNumber: string;
  email: string;
  phone: string;
  gender: 'Male' | 'Female' | 'Prefer not to say' | '';
  department: string;
  departmentOther?: string;
  year: '1st Year' | '2nd Year' | '3rd Year' | '4th Year';
  section?: string;
  interests: string[];
  interestsOther?: string;
  mathInterestRating: number;
  skills: string[];
  skillsOther?: string;
  competitionExperience: 'Yes' | 'No';
  achievements?: string;
  reasonForJoining: string;
  contribution?: string;
  preferredActivities: string[];
  linkedin?: string;
  github?: string;
  profilePhotoUrl?: string;
}

export async function submitRegistration(payload: RegistrationPayload): Promise<{ applicationId: string; docId: string }> {
  const normRoll = payload.rollNumber.trim().toLowerCase();
  const normEmail = payload.email.trim().toLowerCase();
  const nowIso = new Date().toISOString();

  console.log('[SIXATE] Registration submission started');
  console.log('[SIXATE] Writing to Firestore applications...');

  const rollDocRef = doc(db, 'applications', normRoll);

  // 1. Soft duplicate roll number check (prevent offline/unavailable getDoc from blocking submission)
  try {
    const rollSnap = await getDoc(rollDocRef);
    if (rollSnap.exists()) {
      const existingData = rollSnap.data();
      console.warn('[SIXATE] Duplicate roll number detected in Firestore');
      throw { isDuplicate: true, applicationId: existingData.applicationId || 'EXISTING' };
    }
  } catch (err: any) {
    if (err.isDuplicate) throw err;
    console.warn('[SIXATE] Pre-check getDoc roll number notice:', err?.message || String(err));
  }

  // 2. Soft duplicate email check (if email provided)
  if (normEmail && normEmail !== '') {
    try {
      const emailDocRef = doc(db, 'emailIndex', normEmail);
      const emailSnap = await getDoc(emailDocRef);
      if (emailSnap.exists()) {
        const existingData = emailSnap.data();
        console.warn('[SIXATE] Duplicate email detected in Firestore');
        throw { isDuplicate: true, applicationId: existingData.applicationId || 'EXISTING' };
      }
    } catch (err: any) {
      if (err.isDuplicate) throw err;
      console.warn('[SIXATE] Pre-check getDoc email notice:', err?.message || String(err));
    }
  }

  // 3. Increment sequential application counter in Firestore (or fallback to timestamp ID)
  const counterRef = doc(db, 'counters', 'applications');
  let appSeq = 1;
  try {
    await runTransaction(db, async (transaction) => {
      const counterSnap = await transaction.get(counterRef);
      if (!counterSnap.exists()) {
        appSeq = 1;
      } else {
        const data = counterSnap.data();
        const currentCount = typeof data.count === 'number' ? data.count : (typeof data.value === 'number' ? data.value : 0);
        appSeq = currentCount + 1;
        transaction.update(counterRef, { count: appSeq });
      }
    });
  } catch (err: any) {
    console.warn('[SIXATE] Counter transaction notice (falling back to sequence ID):', err?.message || String(err));
    appSeq = (Date.now() % 90000) + 10000;
  }

  const paddedSeq = String(appSeq).padStart(5, '0');
  const formattedAppId = `SIXATE-2026-${paddedSeq}`;

  const newAppData: StudentApplication = {
    id: normRoll,
    applicationId: formattedAppId,
    fullName: payload.fullName.trim(),
    rollNumberDisplay: payload.rollNumber.trim(),
    emailDisplay: payload.email.trim(),
    email: normEmail,
    rollNumber: normRoll,
    phone: payload.phone.trim(),
    gender: payload.gender,
    department: payload.department,
    departmentOther: payload.departmentOther,
    year: payload.year,
    section: payload.section?.trim(),
    interests: payload.interests,
    interestsOther: payload.interestsOther,
    mathInterestRating: payload.mathInterestRating,
    skills: payload.skills,
    skillsOther: payload.skillsOther,
    competitionExperience: payload.competitionExperience,
    achievements: payload.achievements?.trim(),
    reasonForJoining: payload.reasonForJoining.trim(),
    contribution: payload.contribution?.trim(),
    preferredActivities: payload.preferredActivities,
    linkedin: payload.linkedin?.trim(),
    github: payload.github?.trim(),
    profilePhotoUrl: payload.profilePhotoUrl,
    status: 'pending',
    statusHistory: [{ status: 'pending', changedBy: 'System', timestamp: nowIso }],
    createdAt: nowIso
  };

  try {
    // 4. Primary Firestore Write: Save application document to applications collection
    await setDoc(rollDocRef, newAppData);
    if (normEmail && normEmail !== '') {
      try {
        await setDoc(doc(db, 'emailIndex', normEmail), { applicationId: formattedAppId, rollNumber: normRoll, email: normEmail });
      } catch (e) {
        console.warn('[SIXATE] emailIndex setDoc notice:', e);
      }
    }

    console.log('[SIXATE] Firestore write successful');
    console.log('[SIXATE] Document ID:', normRoll);
    console.log('[SIXATE] Application ID:', formattedAppId);

    return { applicationId: formattedAppId, docId: normRoll };
  } catch (err: any) {
    console.error('[SIXATE] Firestore error Code:', err.code || 'UNKNOWN_ERROR', 'Message:', err.message || String(err));
    throw new Error('Registration could not be submitted. Please try again.');
  }
}

// ----------------------------------------------------
// ADMIN FETCH & REAL-TIME STREAMING API FUNCTIONS
// ----------------------------------------------------

export function subscribeToApplications(
  onData: (applications: StudentApplication[]) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    console.log('[SIXATE] Loading applications...');
    console.log('[SIXATE] Firebase project:', db.app.options.projectId);

    const q = query(collection(db, 'applications'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const apps = snapshot.docs.map(doc => doc.data() as StudentApplication);
        console.log('[SIXATE] Applications found:', apps.length);
        onData(apps);
      },
      (err: FirestoreError) => {
        console.error('[SIXATE] Firestore error Code:', err.code, 'Message:', err.message);
        if (onError) {
          onError(err);
        }
      }
    );
    return unsubscribe;
  } catch (err: any) {
    console.error('[SIXATE] Firestore Subscription Exception:', err);
    if (onError) {
      onError(err);
    }
    return () => {};
  }
}

export async function fetchAllApplications(): Promise<StudentApplication[]> {
  try {
    console.log('[SIXATE] Loading applications...');
    console.log('[SIXATE] Firebase project:', db.app.options.projectId);

    const q = query(collection(db, 'applications'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const apps = snapshot.docs.map(doc => doc.data() as StudentApplication);
    console.log('[SIXATE] Applications found:', apps.length);
    return apps;
  } catch (err: any) {
    console.error('[SIXATE] Firestore error Code:', err.code || 'UNKNOWN_ERROR', 'Message:', err.message || String(err));
    throw err;
  }
}

export async function updateApplicationStatusInDb(
  docId: string, 
  newStatus: ApplicationStatus, 
  adminEmail: string,
  notes?: string
): Promise<StudentApplication> {
  const nowIso = new Date().toISOString();
  const appRef = doc(db, 'applications', docId);
  const appSnap = await getDoc(appRef);

  if (!appSnap.exists()) {
    throw new Error('Application document not found in Firestore.');
  }

  const currentData = appSnap.data() as StudentApplication;
  let assignedMemberId = currentData.memberId;

  // Generate Member ID if approving and document does not have one yet
  if (newStatus === 'approved' && !assignedMemberId) {
    const allApps = await fetchAllApplications();
    const approvedCount = allApps.filter(a => a.memberId).length;
    const nextMemberSeq = String(approvedCount + 1).padStart(4, '0');
    assignedMemberId = `SIXATE-M-${nextMemberSeq}`;
  }

  const newHistoryEntry = {
    status: newStatus,
    changedBy: adminEmail,
    timestamp: nowIso,
    notes: notes || undefined
  };

  const updatedData: StudentApplication = {
    ...currentData,
    status: newStatus,
    memberId: assignedMemberId,
    statusHistory: [newHistoryEntry, ...(currentData.statusHistory || [])]
  };

  await updateDoc(appRef, {
    status: newStatus,
    memberId: assignedMemberId || null,
    statusHistory: updatedData.statusHistory
  });

  return updatedData;
}
