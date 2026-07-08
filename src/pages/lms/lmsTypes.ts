// ─────────────────────────────────────────────
// LMS Core TypeScript Interfaces
// src/pages/lms/lmsTypes.ts
// ─────────────────────────────────────────────

/** Visibility/access state of a single week, controlled by Studio */
export type WeekStatus = 'hide' | 'lock' | 'unlock'

/** Current submission state for a weekly assignment */
export type SubmissionStatus = 'none' | 'submitted' | 'graded'

/** A learning track available in the LMS */
export interface Course {
  id: string
  slug: string
  title: string           // Bahasa Indonesia title
  titleJa: string         // Japanese title / badge text
  badge: string           // Short kanji/katakana badge
  description: string     // Short tagline
  detail: string          // Full body description paragraph
  track: number           // 1 | 2 | 3
  totalWeeks: number
  accentColor: string     // Tailwind arbitrary color for card accent
}

/** A single week row from the `meetings` table */
export interface SyllabusWeek {
  id: string
  courseId: string
  weekNumber: number
  title: string
  subtitle: string
  status: WeekStatus
  dueDate?: string        // ISO 8601 — only meaningful when status === 'lock'
  content?: MaterialContent
}

/** Structured content payload attached to an unlocked week */
export interface MaterialContent {
  text?: string           // Markdown / rich-text body
  videoUrl?: string       // YouTube, Vimeo, or direct MP4
  fileUrl?: string        // PDF handout URL
  assignment?: Assignment
}

/** Assignment spec and current submission state for a week */
export interface Assignment {
  instructions: string
  submissionStatus: SubmissionStatus
  submittedFileName?: string
  grade?: number          // 0–100
  gradeNote?: string
}

/** A single thread comment in the weekly forum */
export interface ForumComment {
  id: string
  weekId: string
  authorName: string
  content: string
  isAnonymous: boolean
  createdAt: string       // ISO 8601
}

/** Authenticated member profile (mirrors public.profiles) */
export interface UserProfile {
  id: string
  fullName: string
  username: string
  communityEmail: string  // [username]@shokunin.jpercommunity.id
  gmail: string
  batch: string
  kelasJurusan: string
  asalSekolah: string
  verifiedBadge: boolean
}

/** Enrollment record linking a user to a course */
export interface Enrollment {
  userId: string
  courseId: string
  enrolledAt: string
}

/** Attendance record for a meeting */
export interface Attendance {
  id: string
  memberId: string
  meetingId: string
  status: 'hadir' | 'izin' | 'sakit' | 'alpa'
  scannedAt: string
}

/** Individual submission record from a member for an assignment */
export interface Submission {
  id: string
  memberId: string
  meetingId: string
  fileUrl?: string
  status: SubmissionStatus
  grade?: number
  gradedBy?: string // UUID of admin/validator
  submittedAt: string
}

