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
  onSnapshot
} from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { StudentApplication, ApplicationStatus, AdminUser } from '../types';
import { pushToGlobalCloud, fetchFromGlobalCloud, updateInGlobalCloud } from './cloudRelay';

// Environment / Public Firebase Config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDummySixateApiKeyForFallbackMode",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "sixate-math-club.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "sixate-math-club",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "sixate-math-club.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "102938475612",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:102938475612:web:abcdef1234567890"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// LOCAL STORAGE STORAGE KEYS & AUTOMATIC MOCK PURGE
const STORAGE_KEY_APPS = 'sixate_applications_db_v2';
const STORAGE_KEY_COUNTERS = 'sixate_counters_db_v2';
const STORAGE_KEY_ADMINS = 'sixate_admins_db_v2';

const MOCK_IDS = new Set(['22a01cse', '23a04aiml', '24a08ece', '21a02eee', 'SIXATE-2026-00001', 'SIXATE-2026-00002', 'SIXATE-2026-00003', 'SIXATE-2026-00004']);
const MOCK_NAMES = new Set(['Aarav Sharma', 'Ananya Verma', 'Rohan Kulkarni', 'Priya Sundaram']);

function getStoredApps(): StudentApplication[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_APPS);
    if (!data) {
      localStorage.setItem(STORAGE_KEY_APPS, JSON.stringify([]));
      return [];
    }
    const parsed: StudentApplication[] = JSON.parse(data);
    // Purge any lingering mock data automatically
    const cleaned = parsed.filter(app => 
      !MOCK_IDS.has(app.id) && 
      !MOCK_IDS.has(app.rollNumber) && 
      !MOCK_IDS.has(app.applicationId) && 
      !MOCK_NAMES.has(app.fullName)
    );
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEY_APPS, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch (e) {
    return [];
  }
}

export function clearAllRegistrations(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_APPS);
    localStorage.setItem(STORAGE_KEY_APPS, JSON.stringify([]));
    localStorage.removeItem(STORAGE_KEY_COUNTERS);
    
    // Broadcast clear event
    try {
      const bc = new BroadcastChannel('sixate_registration_channel');
      bc.postMessage({ type: 'CLEAR_DATA' });
      bc.close();
    } catch (e) {}
  } catch (e) {
    console.error('Failed to clear storage:', e);
  }
}

function saveStoredApps(apps: StudentApplication[]) {
  try {
    localStorage.setItem(STORAGE_KEY_APPS, JSON.stringify(apps));
  } catch (e) {
    console.error('Failed to save to local state:', e);
  }
}

function getNextCounterValue(type: 'applications' | 'members'): number {
  try {
    const apps = getStoredApps();
    if (type === 'applications') {
      return apps.length + 1;
    } else {
      const approvedCount = apps.filter(a => a.memberId).length;
      return approvedCount + 1;
    }
  } catch {
    return 1;
  }
}

// ----------------------------------------------------
// PUBLIC REGISTRATION API FUNCTIONS
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

  // 1. Check local duplicate roll number & email
  const currentApps = getStoredApps();
  const existingRoll = currentApps.find(a => a.rollNumber === normRoll);
  if (existingRoll) {
    throw { isDuplicate: true, applicationId: existingRoll.applicationId };
  }
  if (normEmail && normEmail !== '') {
    const existingEmail = currentApps.find(a => a.email === normEmail);
    if (existingEmail) {
      throw { isDuplicate: true, applicationId: existingEmail.applicationId };
    }
  }

  const nextSeq = getNextCounterValue('applications');
  const paddedSeq = String(nextSeq).padStart(5, '0');
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

  // Attempt real Firestore write if active
  const isFirebaseActive = !import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY.startsWith("AIzaSyDummy") ? false : true;
  if (isFirebaseActive) {
    try {
      const rollDocRef = doc(db, 'applications', normRoll);
      const rollSnap = await getDoc(rollDocRef);
      if (rollSnap.exists()) {
        const existingData = rollSnap.data();
        throw { isDuplicate: true, applicationId: existingData.applicationId || 'EXISTING' };
      }

      if (normEmail && normEmail !== '') {
        const emailDocRef = doc(db, 'emailIndex', normEmail);
        const emailSnap = await getDoc(emailDocRef);
        if (emailSnap.exists()) {
          const existingData = emailSnap.data();
          throw { isDuplicate: true, applicationId: existingData.applicationId || 'EXISTING' };
        }
      }

      await setDoc(rollDocRef, newAppData);
      if (normEmail && normEmail !== '') {
        await setDoc(doc(db, 'emailIndex', normEmail), { applicationId: formattedAppId, rollNumber: normRoll, email: normEmail });
      }
    } catch (err: any) {
      if (err.isDuplicate) {
        throw err;
      }
      console.error('Firestore registration failed:', {
        code: err.code || 'UNKNOWN_ERROR',
        message: err.message || String(err),
        operation: 'setDoc applications',
        environment: import.meta.env.MODE
      });
      throw new Error('Registration could not be submitted. Please try again.');
    }
  }

  // Save to local storage store, push to global cloud relay, & broadcast
  currentApps.unshift(newAppData);
  saveStoredApps(currentApps);
  await pushToGlobalCloud(newAppData);

  try {
    const bc = new BroadcastChannel('sixate_registration_channel');
    bc.postMessage({ type: 'NEW_REGISTRATION', application: newAppData });
    bc.close();
  } catch (e) {}

  return { applicationId: formattedAppId, docId: normRoll };
}

// ----------------------------------------------------
// ADMIN FETCH & REAL-TIME STREAMING API FUNCTIONS
// ----------------------------------------------------

export function subscribeToApplications(callback: (applications: StudentApplication[]) => void): () => void {
  let isSubscribed = true;

  const loadAndNotify = async () => {
    if (!isSubscribed) return;
    const data = await fetchAllApplications();
    if (isSubscribed) callback(data);
  };

  // Immediate fetch
  loadAndNotify();

  // Poll cloud relay & storage every 3 seconds for instant cross-device updates
  const intervalId = setInterval(loadAndNotify, 3000);

  // Firestore onSnapshot if configured
  let unsubscribeFirestore: (() => void) | null = null;
  try {
    const isFirebaseActive = !import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY.startsWith("AIzaSyDummy") ? false : true;
    if (isFirebaseActive) {
      const q = query(collection(db, 'applications'), orderBy('createdAt', 'desc'));
      unsubscribeFirestore = onSnapshot(q, () => {
        loadAndNotify();
      }, (err) => {
        console.warn('Firestore onSnapshot notice:', err);
      });
    }
  } catch (e) {}

  return () => {
    isSubscribed = false;
    clearInterval(intervalId);
    if (unsubscribeFirestore) unsubscribeFirestore();
  };
}

export async function fetchAllApplications(): Promise<StudentApplication[]> {
  const localApps = getStoredApps();
  const cloudApps = await fetchFromGlobalCloud();

  const appMap = new Map<string, StudentApplication>();

  // 1. Load cloud relay apps
  cloudApps.forEach(app => {
    if (app && (app.id || app.rollNumber)) {
      appMap.set(app.id || app.rollNumber, app);
    }
  });

  // 2. Load Firestore apps if active
  try {
    const isFirebaseActive = !import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY.startsWith("AIzaSyDummy") ? false : true;
    if (isFirebaseActive) {
      const q = query(collection(db, 'applications'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        snapshot.docs.forEach(doc => {
          const app = doc.data() as StudentApplication;
          if (app && (app.id || app.rollNumber)) {
            appMap.set(app.id || app.rollNumber, app);
          }
        });
      }
    }
  } catch (e) {
    console.warn('Firestore fetch notice (using hybrid store):', e);
  }

  // 3. Load local apps
  localApps.forEach(app => {
    if (app && (app.id || app.rollNumber) && !appMap.has(app.id || app.rollNumber)) {
      appMap.set(app.id || app.rollNumber, app);
    }
  });

  const merged = Array.from(appMap.values());
  // Sync back to local store
  saveStoredApps(merged);
  return merged;
}

export async function updateApplicationStatusInDb(
  docId: string, 
  newStatus: ApplicationStatus, 
  adminEmail: string,
  notes?: string
): Promise<StudentApplication> {
  const nowIso = new Date().toISOString();
  const currentApps = getStoredApps();
  const targetAppIndex = currentApps.findIndex(a => a.id === docId || a.rollNumber === docId);
  
  if (targetAppIndex === -1) {
    throw new Error('Application record not found');
  }

  const targetApp = { ...currentApps[targetAppIndex] };
  let assignedMemberId = targetApp.memberId;

  // Generate Member ID if moving to approved and doesn't have one yet
  if (newStatus === 'approved' && !assignedMemberId) {
    const approvedCount = currentApps.filter(a => a.memberId).length;
    const nextMemberSeq = String(approvedCount + 1).padStart(4, '0');
    assignedMemberId = `SIXATE-M-${nextMemberSeq}`;
  }

  const newHistoryEntry = {
    status: newStatus,
    changedBy: adminEmail,
    timestamp: nowIso,
    notes: notes || undefined
  };

  targetApp.status = newStatus;
  targetApp.memberId = assignedMemberId;
  targetApp.statusHistory = [newHistoryEntry, ...(targetApp.statusHistory || [])];

  // Try updating Firestore doc
  try {
    const isFirebaseActive = !import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY.startsWith("AIzaSyDummy") ? false : true;
    if (isFirebaseActive) {
      const appRef = doc(db, 'applications', docId);
      await updateDoc(appRef, {
        status: newStatus,
        memberId: assignedMemberId || null,
        statusHistory: targetApp.statusHistory
      });
    }
  } catch (e) {
    console.warn('Firestore update warning:', e);
  }

  // Update local store & cloud relay
  currentApps[targetAppIndex] = targetApp;
  saveStoredApps(currentApps);
  await updateInGlobalCloud(currentApps);

  return targetApp;
}
