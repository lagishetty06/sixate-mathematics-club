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
  limit,
  startAfter,
  where,
  increment,
  getCountFromServer,
  QueryDocumentSnapshot,
  FirestoreError,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { StudentApplication, ApplicationStatus } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Firebase Initialization (singleton guard)
// ─────────────────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || 'AIzaSyCqDltrqhLLGnA3TCu5EYUIfchmwqPEazI',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || 'sixate-math-club-2026.firebaseapp.com',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || 'sixate-math-club-2026',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || 'sixate-math-club-2026.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '264304199447',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || '1:264304199447:web:2d4cf33216d125ab7e1952',
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db      = getFirestore(app);
export const auth    = getAuth(app);
export const storage = getStorage(app);

export function isFirebaseConfigured(): boolean {
  const key = import.meta.env.VITE_FIREBASE_API_KEY;
  return Boolean(key && !key.startsWith('AIzaSyDummy'));
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Default number of applications per Admin Dashboard page. Configurable. */
export const PAGE_SIZE = 25;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface RegistrationPayload {
  fullName:              string;
  rollNumber:            string;
  email:                 string;
  phone:                 string;
  gender:                'Male' | 'Female' | 'Prefer not to say' | '';
  department:            string;
  departmentOther?:      string;
  year:                  '1st Year' | '2nd Year' | '3rd Year' | '4th Year';
  section?:              string;
  interests:             string[];
  interestsOther?:       string;
  mathInterestRating:    number;
  skills:                string[];
  skillsOther?:          string;
  competitionExperience: 'Yes' | 'No';
  achievements?:         string;
  reasonForJoining:      string;
  contribution?:         string;
  preferredActivities:   string[];
  linkedin?:             string;
  github?:               string;
  profilePhotoUrl?:      string;
}

/** Result shape for paginated queries. */
export interface PaginatedResult {
  applications: StudentApplication[];
  lastDoc:      QueryDocumentSnapshot | null;
  hasMore:      boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC REGISTRATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Submit a student application.
 * Safety: runTransaction for counter, soft checks for duplicates, analytics increment.
 */
export async function submitRegistration(
  payload: RegistrationPayload
): Promise<{ applicationId: string; docId: string }> {
  const normRoll  = payload.rollNumber.trim().toLowerCase();
  const normEmail = payload.email.trim().toLowerCase();
  const nowIso    = new Date().toISOString();

  console.log('[SIXATE] Registration submission started');

  const rollDocRef = doc(db, 'applications', normRoll);

  // 1. Soft duplicate roll-number check
  try {
    const rollSnap = await getDoc(rollDocRef);
    if (rollSnap.exists()) {
      const existingData = rollSnap.data();
      console.warn('[SIXATE] Duplicate roll number detected');
      throw { isDuplicate: true, applicationId: existingData.applicationId || 'EXISTING' };
    }
  } catch (err: any) {
    if (err.isDuplicate) throw err;
    console.warn('[SIXATE] Pre-check roll number notice:', err?.message || String(err));
  }

  // 2. Soft duplicate email check
  if (normEmail) {
    try {
      const emailDocRef = doc(db, 'emailIndex', normEmail);
      const emailSnap   = await getDoc(emailDocRef);
      if (emailSnap.exists()) {
        const existingData = emailSnap.data();
        console.warn('[SIXATE] Duplicate email detected');
        throw { isDuplicate: true, applicationId: existingData.applicationId || 'EXISTING' };
      }
    } catch (err: any) {
      if (err.isDuplicate) throw err;
      console.warn('[SIXATE] Pre-check email notice:', err?.message || String(err));
    }
  }

  // 3. Atomic counter increment — sequential application ID
  const counterRef = doc(db, 'counters', 'applications');
  let appSeq = 1;
  try {
    await runTransaction(db, async (transaction) => {
      const counterSnap = await transaction.get(counterRef);
      if (!counterSnap.exists()) {
        appSeq = 1;
        transaction.set(counterRef, { count: 1 });
      } else {
        const data        = counterSnap.data();
        const currentCount = typeof data.count === 'number'
          ? data.count
          : (typeof data.value === 'number' ? data.value : 0);
        appSeq = currentCount + 1;
        transaction.update(counterRef, { count: appSeq });
      }
    });
  } catch (err: any) {
    console.warn('[SIXATE] Counter transaction notice (random fallback):', err?.message || String(err));
    appSeq = Math.floor(Math.random() * 90000) + 10000;
  }

  const paddedSeq    = String(appSeq).padStart(5, '0');
  const formattedAppId = `SIXATE-2026-${paddedSeq}`;

  const normDept = (payload.department || 'CSE').replace(/[^a-zA-Z0-9]/g, '_');
  const normYear = (payload.year       || '1st Year').replace(/[^a-zA-Z0-9]/g, '_');

  const newAppData: StudentApplication = {
    id:                    normRoll,
    applicationId:         formattedAppId,
    fullName:              payload.fullName.trim(),
    rollNumberDisplay:     payload.rollNumber.trim(),
    emailDisplay:          payload.email.trim(),
    email:                 normEmail,
    rollNumber:            normRoll,
    phone:                 payload.phone.trim(),
    gender:                payload.gender,
    department:            payload.department,
    departmentOther:       payload.departmentOther,
    year:                  payload.year,
    section:               payload.section?.trim(),
    interests:             payload.interests,
    interestsOther:        payload.interestsOther,
    mathInterestRating:    payload.mathInterestRating,
    skills:                payload.skills,
    skillsOther:           payload.skillsOther,
    competitionExperience: payload.competitionExperience,
    achievements:          payload.achievements?.trim(),
    reasonForJoining:      payload.reasonForJoining.trim(),
    contribution:          payload.contribution?.trim(),
    preferredActivities:   payload.preferredActivities,
    linkedin:              payload.linkedin?.trim(),
    github:                payload.github?.trim(),
    profilePhotoUrl:       payload.profilePhotoUrl,
    status:                'pending',
    statusHistory:         [{ status: 'pending', changedBy: 'System', timestamp: nowIso }],
    createdAt:             nowIso,
  };

  // 4. Write application document
  try {
    await setDoc(rollDocRef, newAppData);

    // Write email index (best-effort)
    if (normEmail) {
      try {
        await setDoc(
          doc(db, 'emailIndex', normEmail),
          { applicationId: formattedAppId, rollNumber: normRoll, email: normEmail }
        );
      } catch (e) {
        console.warn('[SIXATE] emailIndex write notice:', e);
      }
    }

    // 5. Atomic analytics increment (best-effort)
    try {
      const analyticsRef = doc(db, 'counters', 'analytics');
      const interestIncrements: Record<string, ReturnType<typeof increment>> = {};
      (payload.interests || []).forEach((interest) => {
        const key = `interest_${interest.replace(/[^a-zA-Z0-9]/g, '_')}`;
        interestIncrements[key] = increment(1);
      });

      await updateDoc(analyticsRef, {
        total:                   increment(1),
        pending:                 increment(1),
        [`dept_${normDept}`]:    increment(1),
        [`year_${normYear}`]:    increment(1),
        ...interestIncrements,
      }).catch(async () => {
        // If document doesn't exist yet, create it
        await setDoc(analyticsRef, {
          total:                 1,
          pending:               1,
          approved:              0,
          shortlisted:           0,
          rejected:              0,
          [`dept_${normDept}`]:  1,
          [`year_${normYear}`]:  1,
        });
      });
    } catch (analyticsErr) {
      console.warn('[SIXATE] Analytics counter update notice:', analyticsErr);
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

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — PAGINATED READS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch one page of applications ordered by createdAt descending.
 * Reads exactly `pageSize` documents from Firestore.
 */
export async function fetchApplicationsPage(
  pageSize: number = PAGE_SIZE,
  lastDoc:  QueryDocumentSnapshot | null = null,
  statusFilter: ApplicationStatus | 'All' = 'All'
): Promise<PaginatedResult> {
  try {
    let q;
    if (statusFilter && statusFilter !== 'All') {
      // Requires composite index: status ASC + createdAt DESC
      q = lastDoc
        ? query(
            collection(db, 'applications'),
            where('status', '==', statusFilter),
            orderBy('createdAt', 'desc'),
            startAfter(lastDoc),
            limit(pageSize)
          )
        : query(
            collection(db, 'applications'),
            where('status', '==', statusFilter),
            orderBy('createdAt', 'desc'),
            limit(pageSize)
          );
    } else {
      q = lastDoc
        ? query(
            collection(db, 'applications'),
            orderBy('createdAt', 'desc'),
            startAfter(lastDoc),
            limit(pageSize)
          )
        : query(
            collection(db, 'applications'),
            orderBy('createdAt', 'desc'),
            limit(pageSize)
          );
    }

    const snapshot = await getDocs(q);
    const applications = snapshot.docs.map((d) => d.data() as StudentApplication);
    const newLastDoc   = snapshot.docs.length > 0
      ? snapshot.docs[snapshot.docs.length - 1]
      : null;

    return {
      applications,
      lastDoc:  newLastDoc,
      hasMore:  snapshot.docs.length === pageSize,
    };
  } catch (err: any) {
    console.error('[SIXATE] fetchApplicationsPage error:', err.code, err.message);
    throw err;
  }
}

/**
 * Get total application count. Uses Firestore count aggregation (1 read).
 */
export async function getApplicationCount(
  statusFilter: ApplicationStatus | 'All' = 'All'
): Promise<number> {
  try {
    const q = statusFilter && statusFilter !== 'All'
      ? query(collection(db, 'applications'), where('status', '==', statusFilter))
      : query(collection(db, 'applications'));
    const countSnap = await getCountFromServer(q);
    return countSnap.data().count;
  } catch (err) {
    console.warn('[SIXATE] getApplicationCount fallback:', err);
    try {
      const counterSnap = await getDoc(doc(db, 'counters', 'applications'));
      if (counterSnap.exists()) {
        const data = counterSnap.data();
        return typeof data.count === 'number' ? data.count : 0;
      }
    } catch {/* ignore */}
    return 0;
  }
}

/**
 * Get status counts for dashboard stat cards.
 * Tries counters/analytics first (1 read), falls back to 5 parallel count queries.
 */
export async function getStatusCounts(): Promise<{
  total: number;
  pending: number;
  approved: number;
  shortlisted: number;
  rejected: number;
}> {
  // Fast path: read from counters/analytics (1 read)
  try {
    const analyticsSnap = await getDoc(doc(db, 'counters', 'analytics'));
    if (analyticsSnap.exists()) {
      const d = analyticsSnap.data();
      if (typeof d.total === 'number' && d.total > 0) {
        return {
          total:       d.total       ?? 0,
          pending:     d.pending     ?? 0,
          approved:    d.approved    ?? 0,
          shortlisted: d.shortlisted ?? 0,
          rejected:    d.rejected    ?? 0,
        };
      }
    }
  } catch {/* fall through */}

  // Fallback: 5 parallel count aggregation queries
  try {
    const [totalSnap, pendingSnap, approvedSnap, shortlistedSnap, rejectedSnap] =
      await Promise.all([
        getCountFromServer(query(collection(db, 'applications'))),
        getCountFromServer(query(collection(db, 'applications'), where('status', '==', 'pending'))),
        getCountFromServer(query(collection(db, 'applications'), where('status', '==', 'approved'))),
        getCountFromServer(query(collection(db, 'applications'), where('status', '==', 'shortlisted'))),
        getCountFromServer(query(collection(db, 'applications'), where('status', '==', 'rejected'))),
      ]);

    return {
      total:       totalSnap.data().count,
      pending:     pendingSnap.data().count,
      approved:    approvedSnap.data().count,
      shortlisted: shortlistedSnap.data().count,
      rejected:    rejectedSnap.data().count,
    };
  } catch (err) {
    console.error('[SIXATE] getStatusCounts error:', err);
    return { total: 0, pending: 0, approved: 0, shortlisted: 0, rejected: 0 };
  }
}

/**
 * Read analytics distribution data from counters/analytics (1 read).
 */
export async function getAnalyticsData(): Promise<Record<string, number>> {
  try {
    const snap = await getDoc(doc(db, 'counters', 'analytics'));
    if (snap.exists()) {
      return snap.data() as Record<string, number>;
    }
    return {};
  } catch (err) {
    console.warn('[SIXATE] getAnalyticsData error:', err);
    return {};
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — REAL-TIME LISTENER (limited — for Recent Registrations panel only)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Subscribe to the N most-recent applications in real time.
 * Reads only `recentCount` documents — NOT the full collection.
 */
export function subscribeToRecentApplications(
  onData:   (applications: StudentApplication[]) => void,
  onError?: (err: Error) => void,
  recentCount: number = 10
): () => void {
  try {
    const q = query(
      collection(db, 'applications'),
      orderBy('createdAt', 'desc'),
      limit(recentCount)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const apps = snapshot.docs.map((d) => d.data() as StudentApplication);
        onData(apps);
      },
      (err: FirestoreError) => {
        console.error('[SIXATE] subscribeToRecentApplications error:', err.code, err.message);
        if (onError) onError(err);
      }
    );

    return unsubscribe;
  } catch (err: any) {
    console.error('[SIXATE] subscribeToRecentApplications setup error:', err);
    if (onError) onError(err);
    return () => {};
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — FULL EXPORT (intentionally downloads all records — explicit action only)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Download ALL applications for export (Excel/CSV).
 * EXPENSIVE: reads every document. Call only on explicit admin export action.
 * Never call on page load.
 */
export async function fetchAllApplicationsForExport(
  statusFilter: ApplicationStatus | 'All' = 'All'
): Promise<StudentApplication[]> {
  console.log('[SIXATE] Export fetch started — reading full collection');
  try {
    const q = statusFilter && statusFilter !== 'All'
      ? query(
          collection(db, 'applications'),
          where('status', '==', statusFilter),
          orderBy('createdAt', 'desc')
        )
      : query(collection(db, 'applications'), orderBy('createdAt', 'desc'));

    const snapshot = await getDocs(q);
    const apps = snapshot.docs.map((d) => d.data() as StudentApplication);
    console.log('[SIXATE] Export fetch complete:', apps.length, 'records');
    return apps;
  } catch (err: any) {
    console.error('[SIXATE] fetchAllApplicationsForExport error:', err.code, err.message);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY COMPATIBILITY SHIMS
// ─────────────────────────────────────────────────────────────────────────────

/** @deprecated Use subscribeToRecentApplications(). Kept for compatibility. */
export function subscribeToApplications(
  onData:   (applications: StudentApplication[]) => void,
  onError?: (err: Error) => void
): () => void {
  return subscribeToRecentApplications(onData, onError, 10);
}

/** @deprecated Use fetchAllApplicationsForExport(). Kept for compatibility. */
export async function fetchAllApplications(): Promise<StudentApplication[]> {
  return fetchAllApplicationsForExport();
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — STATUS UPDATE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Update a single application's status. Reads 1 doc, writes 1 doc.
 */
export async function updateApplicationStatusInDb(
  docId:      string,
  newStatus:  ApplicationStatus,
  adminEmail: string,
  notes?:     string
): Promise<StudentApplication> {
  const nowIso = new Date().toISOString();
  const appRef  = doc(db, 'applications', docId);
  const appSnap = await getDoc(appRef);

  if (!appSnap.exists()) {
    throw new Error('Application document not found in Firestore.');
  }

  const currentData      = appSnap.data() as StudentApplication;
  const previousStatus   = currentData.status;
  let assignedMemberId   = currentData.memberId;

  // Generate Member ID when approving
  if (newStatus === 'approved' && !assignedMemberId) {
    const memberCounterRef = doc(db, 'counters', 'members');
    let memberSeq = 1;
    try {
      await runTransaction(db, async (transaction) => {
        const counterSnap = await transaction.get(memberCounterRef);
        if (!counterSnap.exists()) {
          memberSeq = 1;
          transaction.set(memberCounterRef, { count: 1 });
        } else {
          const data    = counterSnap.data();
          const current = typeof data.count === 'number' ? data.count : 0;
          memberSeq = current + 1;
          transaction.update(memberCounterRef, { count: memberSeq });
        }
      });
    } catch (err: any) {
      console.warn('[SIXATE] Member counter transaction fallback:', err?.message);
      memberSeq = Math.floor(Math.random() * 9000) + 1000;
    }
    const paddedSeq  = String(memberSeq).padStart(4, '0');
    assignedMemberId = `SIXATE-M-${paddedSeq}`;
  }

  const newHistoryEntry: any = { status: newStatus, changedBy: adminEmail, timestamp: nowIso };
  if (notes && notes.trim() !== '') newHistoryEntry.notes = notes.trim();

  const updatedData: StudentApplication = {
    ...currentData,
    status:        newStatus,
    memberId:      assignedMemberId,
    statusHistory: [newHistoryEntry, ...(currentData.statusHistory || [])],
  };

  await updateDoc(appRef, {
    status:        newStatus,
    memberId:      assignedMemberId || null,
    statusHistory: updatedData.statusHistory,
  });

  // Update analytics counters (best-effort)
  try {
    const analyticsRef = doc(db, 'counters', 'analytics');
    await updateDoc(analyticsRef, {
      [newStatus]:      increment(1),
      [previousStatus]: increment(-1),
    }).catch(() => {/* ignore if doc missing */});
  } catch {/* non-fatal */}

  return updatedData;
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export async function seedAdminUserDocument(
  uid:   string,
  email: string,
  role:  string = 'super_admin'
): Promise<void> {
  try {
    const adminDocRef = doc(db, 'admins', uid);
    await setDoc(adminDocRef, {
      uid,
      email:     email.trim().toLowerCase(),
      role,
      name:      email.split('@')[0] || 'Administrator',
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    console.log('[SIXATE] Seeded admins document for UID:', uid);
  } catch (err: any) {
    console.warn('[SIXATE] Failed to seed admins document:', err?.message || String(err));
  }
}
