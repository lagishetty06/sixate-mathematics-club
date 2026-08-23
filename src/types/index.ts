export type ApplicationStatus = 'pending' | 'approved' | 'shortlisted' | 'rejected';

export interface StatusHistoryEntry {
  status: ApplicationStatus;
  changedBy: string;
  timestamp: string;
  notes?: string;
}

export interface StudentApplication {
  id: string; // Document ID (normalized roll number)
  applicationId: string; // Sequential ID (e.g. SIXATE-2026-00001)
  fullName: string;
  rollNumberDisplay: string;
  emailDisplay: string;
  email: string; // Normalized lowercase
  rollNumber: string; // Normalized lowercase doc ID
  phone: string;
  gender: 'Male' | 'Female' | 'Prefer not to say' | '';
  department: string;
  departmentOther?: string;
  year: '1st Year' | '2nd Year' | '3rd Year' | '4th Year';
  section?: string;
  interests: string[];
  interestsOther?: string;
  mathInterestRating: number; // 1 to 5
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
  status: ApplicationStatus;
  memberId?: string; // Sequential member ID (e.g. SIXATE-M-0001)
  statusHistory: StatusHistoryEntry[];
  createdAt: string; // ISO date string
}

export interface AdminUser {
  uid: string;
  email: string;
  role: 'admin' | 'super_admin';
  name?: string;
}

export interface ApplicationFilterState {
  searchQuery: string;
  department: string;
  year: string;
  status: string;
  interest: string;
}
