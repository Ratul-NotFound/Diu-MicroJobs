import { Types, Document } from "mongoose";

// ─── Enum Type Aliases ───────────────────────────────────────────────

export type UserRole = "student" | "faculty" | "alumni" | "department";
export type UserStatus = "active" | "suspended" | "banned";
export type AdminRole = "super_admin" | "moderator" | "support";
export type AdminStatus = "active" | "inactive";

export type JobStatus =
  | "draft"
  | "pending_review"
  | "open"
  | "in_review"
  | "accepted"
  | "contracted"
  | "in_progress"
  | "delivered"
  | "revision_requested"
  | "completed"
  | "cancelled"
  | "disputed"
  | "rejected";

export type BudgetType = "fixed" | "range" | "hourly";
export type UrgencyLevel = "low" | "normal" | "urgent";

export type ProposalStatus =
  | "pending"
  | "shortlisted"
  | "accepted"
  | "rejected"
  | "withdrawn";

export type ContractStatus =
  | "pending_signatures"
  | "active"
  | "completed"
  | "cancelled"
  | "disputed";

export type MilestoneStatus = "pending" | "in_progress" | "completed";

export type ReportTargetType = "job" | "user" | "message" | "review";
export type ReportStatus = "pending" | "reviewed" | "resolved" | "dismissed";

export type NotificationType =
  | "proposal_received"
  | "proposal_accepted"
  | "proposal_rejected"
  | "new_message"
  | "contract_ready"
  | "job_completed"
  | "review_received"
  | "admin_action";

// ─── Sub-document Interfaces ─────────────────────────────────────────

export interface IPortfolioItem {
  title?: string;
  imageUrl?: string;
  description?: string;
  link?: string;
}

export interface IBudget {
  type: BudgetType;
  min: number;
  max?: number;
  currency?: string;
}

export interface IAttachment {
  name?: string;
  url?: string;
  type?: string;
}

export interface IProposalAttachment {
  name?: string;
  url?: string;
}

export interface IMilestone {
  title?: string;
  amount?: number;
  deadline?: Date;
  status?: MilestoneStatus;
}

// ─── Document Interfaces ────────────────────────────────────────────

export interface IUser extends Document {
  firebaseUid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: UserRole;
  department?: string;
  studentId?: string;
  bio: string;
  skills: string[];
  portfolio: IPortfolioItem[];
  rating: number;
  totalReviews: number;
  completedJobs: number;
  responseTime: string;
  isVerified: boolean;
  isOnline: boolean;
  lastSeen: Date;
  status: UserStatus;
  suspensionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAdmin extends Document {
  firebaseUid: string;
  email: string;
  displayName: string;
  role: AdminRole;
  permissions: string[];
  createdBy?: Types.ObjectId;
  status: AdminStatus;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IJob extends Document {
  title: string;
  description: string;
  category: Types.ObjectId;
  subcategory?: string;
  budget: IBudget;
  deadline: Date;
  client: Types.ObjectId;
  status: JobStatus;
  skills: string[];
  urgency: UrgencyLevel;
  attachments: IAttachment[];
  thumbnail?: string;
  proposalCount: number;
  assignedTo: Types.ObjectId | null;
  rejectionReason?: string;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProposal extends Document {
  job: Types.ObjectId;
  freelancer: Types.ObjectId;
  coverLetter: string;
  bidAmount: number;
  estimatedDuration?: string;
  attachments: IProposalAttachment[];
  status: ProposalStatus;
  clientResponse?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IContract extends Document {
  job: Types.ObjectId;
  proposal?: Types.ObjectId;
  client: Types.ObjectId;
  freelancer: Types.ObjectId;
  terms?: string;
  agreedAmount: number;
  deadline: Date;
  deliverables: string[];
  milestones: IMilestone[];
  clientSigned: boolean;
  freelancerSigned: boolean;
  status: ContractStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface IConversation extends Document {
  participants: Types.ObjectId[];
  job?: Types.ObjectId;
  lastMessage: string;
  lastMessageAt: Date;
  unreadCount: Map<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessage extends Document {
  conversation: Types.ObjectId;
  sender: Types.ObjectId;
  text: string;
  attachments: IAttachment[];
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReview extends Document {
  job: Types.ObjectId;
  contract?: Types.ObjectId;
  reviewer: Types.ObjectId;
  reviewee: Types.ObjectId;
  rating: number;
  communication?: number;
  quality?: number;
  timeliness?: number;
  comment: string;
  response?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICategory extends Document {
  name: string;
  slug: string;
  icon: string;
  description: string;
  jobCount: number;
  subcategories: string[];
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReport extends Document {
  reporter: Types.ObjectId;
  targetType: ReportTargetType;
  targetId: Types.ObjectId;
  reason: string;
  description: string;
  status: ReportStatus;
  reviewedBy?: Types.ObjectId;
  resolution?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotification extends Document {
  user: Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  link: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}
