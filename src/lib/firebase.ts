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
  orderBy
} from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { StudentApplication, ApplicationStatus, AdminUser } from '../types';

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

// LOCAL STORAGE FALLBACK SEED DATA (Used when Firebase keys are default/offline or for instant demoing)
const STORAGE_KEY_APPS = 'sixate_applications_db_v1';
const STORAGE_KEY_COUNTERS = 'sixate_counters_db_v1';
const STORAGE_KEY_ADMINS = 'sixate_admins_db_v1';

const INITIAL_MOCK_STUDENTS: StudentApplication[] = [
  {
    id: '22a01cse',
    applicationId: 'SIXATE-2026-00001',
    fullName: 'Aarav Sharma',
    rollNumberDisplay: '22A01CSE',
    emailDisplay: 'aarav.sharma@college.edu',
    email: 'aarav.sharma@college.edu',
    rollNumber: '22a01cse',
    phone: '+919876543210',
    gender: 'Male',
    department: 'CSE',
    year: '3rd Year',
    section: 'A',
    interests: ['Algebra', 'Calculus', 'Number Theory', 'Competitive Mathematics'],
    mathInterestRating: 5,
    skills: ['Problem Solving', 'Coding', 'Event Management'],
    competitionExperience: 'Yes',
    achievements: 'Secured 1st rank in Inter-College Math Olympiad 2025.',
    reasonForJoining: 'I want to deepen my understanding of discrete structures and prepare for advanced competitive math events with like-minded peers.',
    contribution: 'I can mentor junior students and organize problem-solving sprint sessions.',
    preferredActivities: ['Puzzle Competitions', 'Coding Challenges', 'Workshops'],
    linkedin: 'https://linkedin.com/in/aarav-sharma-math',
    github: 'https://github.com/aarav-sharma',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    status: 'approved',
    memberId: 'SIXATE-M-0001',
    statusHistory: [
      { status: 'pending', changedBy: 'System', timestamp: '2026-08-20T10:00:00Z' },
      { status: 'approved', changedBy: 'admin@sixate.edu', timestamp: '2026-08-21T14:30:00Z', notes: 'Excellent academic record.' }
    ],
    createdAt: '2026-08-20T10:00:00Z'
  },
  {
    id: '23a04aiml',
    applicationId: 'SIXATE-2026-00002',
    fullName: 'Ananya Verma',
    rollNumberDisplay: '23A04AIML',
    emailDisplay: 'ananya.verma@college.edu',
    email: 'ananya.verma@college.edu',
    rollNumber: '23a04aiml',
    phone: '+919812345678',
    gender: 'Female',
    department: 'CSE (AI & ML)',
    year: '2nd Year',
    section: 'B',
    interests: ['Statistics', 'Probability', 'Discrete Mathematics', 'Cryptography'],
    mathInterestRating: 5,
    skills: ['Coding', 'Graphic Designing', 'Public Speaking'],
    competitionExperience: 'Yes',
    achievements: 'Finalist in National Hackathon Data Science challenge.',
    reasonForJoining: 'Mathematics is the foundation of Artificial Intelligence. SIXATE gives me the community to explore high-level probability and graph theory.',
    contribution: 'Graphic design for club posters and managing social media outreach.',
    preferredActivities: ['Mathematics Quizzes', 'Guest Lectures', 'Research / Projects'],
    linkedin: 'https://linkedin.com/in/ananya-verma-ai',
    github: 'https://github.com/ananya-verma',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    status: 'pending',
    statusHistory: [
      { status: 'pending', changedBy: 'System', timestamp: '2026-08-22T09:15:00Z' }
    ],
    createdAt: '2026-08-22T09:15:00Z'
  },
  {
    id: '24a08ece',
    applicationId: 'SIXATE-2026-00003',
    fullName: 'Rohan Kulkarni',
    rollNumberDisplay: '24A08ECE',
    emailDisplay: 'rohan.kulkarni@college.edu',
    email: 'rohan.kulkarni@college.edu',
    rollNumber: '24a08ece',
    phone: '9765432109',
    gender: 'Male',
    department: 'ECE',
    year: '1st Year',
    section: 'C',
    interests: ['Geometry', 'Logical Reasoning', 'Mathematical Puzzles'],
    mathInterestRating: 4,
    skills: ['Content Writing', 'Video Editing', 'Problem Solving'],
    competitionExperience: 'No',
    reasonForJoining: 'To build strong analytical thinking right from my first year and learn problem solving strategies.',
    contribution: 'Can write club newsletters and edit video recaps of events.',
    preferredActivities: ['Puzzle Competitions', 'Mathematical Games'],
    status: 'shortlisted',
    statusHistory: [
      { status: 'pending', changedBy: 'System', timestamp: '2026-08-22T11:45:00Z' },
      { status: 'shortlisted', changedBy: 'admin@sixate.edu', timestamp: '2026-08-22T16:00:00Z', notes: 'Promising 1st year candidate.' }
    ],
    createdAt: '2026-08-22T11:45:00Z'
  },
  {
    id: '21a02eee',
    applicationId: 'SIXATE-2026-00004',
    fullName: 'Priya Sundaram',
    rollNumberDisplay: '21A02EEE',
    emailDisplay: 'priya.sundaram@college.edu',
    email: 'priya.sundaram@college.edu',
    rollNumber: '21a02eee',
    phone: '+919988776655',
    gender: 'Female',
    department: 'EEE',
    year: '4th Year',
    interests: ['Applied Mathematics', 'Calculus', 'Statistics'],
    mathInterestRating: 4,
    skills: ['Team Management', 'Teaching / Mentoring'],
    competitionExperience: 'Yes',
    achievements: 'Published a undergraduate paper on Differential Equations applications.',
    reasonForJoining: 'I wish to contribute back to the club before graduating by mentoring younger math enthusiasts.',
    contribution: 'Conducting guest sessions on applied calculus in engineering.',
    preferredActivities: ['Workshops', 'Guest Lectures', 'Research / Projects'],
    status: 'approved',
    memberId: 'SIXATE-M-0002',
    statusHistory: [
      { status: 'pending', changedBy: 'System', timestamp: '2026-08-18T08:30:00Z' },
      { status: 'approved', changedBy: 'admin@sixate.edu', timestamp: '2026-08-19T12:00:00Z' }
    ],
    createdAt: '2026-08-18T08:30:00Z'
  }
];

function getStoredApps(): StudentApplication[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_APPS);
    if (!data) {
      localStorage.setItem(STORAGE_KEY_APPS, JSON.stringify(INITIAL_MOCK_STUDENTS));
      return INITIAL_MOCK_STUDENTS;
    }
    return JSON.parse(data);
  } catch (e) {
    return INITIAL_MOCK_STUDENTS;
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

  // Always save submission to local storage store so it appears in admin lists immediately
  currentApps.unshift(newAppData);
  saveStoredApps(currentApps);

  // Broadcast registration event across open admin browser tabs/windows
  try {
    const bc = new BroadcastChannel('sixate_registration_channel');
    bc.postMessage({ type: 'NEW_REGISTRATION', application: newAppData });
    bc.close();
  } catch (e) {
    // Ignore BroadcastChannel errors on older browsers
  }

  // Attempt real Firestore write if active
  try {
    const isFirebaseActive = !import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY.startsWith("AIzaSyDummy") ? false : true;
    if (isFirebaseActive) {
      const rollDocRef = doc(db, 'applications', normRoll);
      await setDoc(rollDocRef, newAppData);
      if (normEmail && normEmail !== '') {
        await setDoc(doc(db, 'emailIndex', normEmail), { applicationId: formattedAppId, rollNumber: normRoll, email: normEmail });
      }
    }
  } catch (err: any) {
    console.warn('Firestore submission notice (stored in hybrid local session):', err);
  }

  return { applicationId: formattedAppId, docId: normRoll };
}

// ----------------------------------------------------
// ADMIN FETCH & ACTION API FUNCTIONS
// ----------------------------------------------------

export async function fetchAllApplications(): Promise<StudentApplication[]> {
  const localApps = getStoredApps();

  try {
    const isFirebaseActive = !import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY.startsWith("AIzaSyDummy") ? false : true;
    if (isFirebaseActive) {
      const q = query(collection(db, 'applications'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const firestoreApps = snapshot.docs.map(doc => doc.data() as StudentApplication);
        const appMap = new Map<string, StudentApplication>();
        firestoreApps.forEach(app => appMap.set(app.id || app.rollNumber, app));
        localApps.forEach(app => {
          if (!appMap.has(app.id || app.rollNumber)) {
            appMap.set(app.id || app.rollNumber, app);
          }
        });
        return Array.from(appMap.values());
      }
    }
  } catch (e) {
    console.warn('Firestore fetch notice (using local store):', e);
  }

  return localApps;
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

  // Update local store
  currentApps[targetAppIndex] = targetApp;
  saveStoredApps(currentApps);

  return targetApp;
}
