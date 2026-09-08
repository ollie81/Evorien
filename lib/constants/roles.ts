/** A member can hold several roles at once — nobody is assumed a founder by default. */
export const ROLES = [
  "FOUNDER",
  "ENTREPRENEUR",
  "DEVELOPER",
  "ENGINEER",
  "DESIGNER",
  "CREATOR",
  "ARTIST",
  "FILMMAKER",
  "MUSICIAN",
  "RESEARCHER",
  "INVESTOR",
  "BUILDER",
  "COMMUNITY_ORGANIZER",
  "STUDENT",
  "BUSINESS",
  "ORGANIZATION",
  "OTHER",
] as const;

export type RoleCode = (typeof ROLES)[number];

const ROLE_LABELS: Record<RoleCode, string> = {
  FOUNDER: "Founder",
  ENTREPRENEUR: "Entrepreneur",
  DEVELOPER: "Developer",
  ENGINEER: "Engineer",
  DESIGNER: "Designer",
  CREATOR: "Creator",
  ARTIST: "Artist",
  FILMMAKER: "Filmmaker",
  MUSICIAN: "Musician",
  RESEARCHER: "Researcher",
  INVESTOR: "Investor",
  BUILDER: "Builder",
  COMMUNITY_ORGANIZER: "Community Organizer",
  STUDENT: "Student",
  BUSINESS: "Business",
  ORGANIZATION: "Organization",
  OTHER: "Other",
};

export function roleLabel(code: string) {
  return ROLE_LABELS[code as RoleCode] ?? code;
}

export const CONTRIBUTION_TYPES = [
  "SKILLS",
  "TIME",
  "KNOWLEDGE",
  "CREATIVITY",
  "ENGINEERING",
  "BUSINESS",
  "COMMUNITY",
  "EQUIPMENT",
  "MENTORSHIP",
  "OTHER",
] as const;

export type ContributionType = (typeof CONTRIBUTION_TYPES)[number];

const CONTRIBUTION_LABELS: Record<ContributionType, string> = {
  SKILLS: "Skills",
  TIME: "Time",
  KNOWLEDGE: "Knowledge",
  CREATIVITY: "Creativity",
  ENGINEERING: "Engineering",
  BUSINESS: "Business",
  COMMUNITY: "Community",
  EQUIPMENT: "Equipment / resources",
  MENTORSHIP: "Mentorship",
  OTHER: "Other",
};

export function contributionTypeLabel(code: string) {
  return CONTRIBUTION_LABELS[code as ContributionType] ?? code;
}

export const PROJECT_STAGES = [
  "IDEA",
  "PROTOTYPE",
  "MVP",
  "LAUNCHED",
  "GROWING",
] as const;

export type ProjectStage = (typeof PROJECT_STAGES)[number];

const PROJECT_STAGE_LABELS: Record<ProjectStage, string> = {
  IDEA: "Idea",
  PROTOTYPE: "Prototype",
  MVP: "MVP",
  LAUNCHED: "Launched",
  GROWING: "Growing",
};

export function projectStageLabel(code: string) {
  return PROJECT_STAGE_LABELS[code as ProjectStage] ?? code;
}

export const PROJECT_STATUSES = ["ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  ACTIVE: "Active",
  PAUSED: "Paused",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

export function projectStatusLabel(code: string) {
  return PROJECT_STATUS_LABELS[code as ProjectStatus] ?? code;
}

export const OPPORTUNITY_TYPES = [
  "JOB",
  "FREELANCE",
  "COLLABORATION",
  "EVENT",
  "PARTNERSHIP",
  "GRANT",
  "COMPETITION",
  "PROJECT",
] as const;

export type OpportunityType = (typeof OPPORTUNITY_TYPES)[number];

const OPPORTUNITY_TYPE_LABELS: Record<OpportunityType, string> = {
  JOB: "Job",
  FREELANCE: "Freelance",
  COLLABORATION: "Collaboration",
  EVENT: "Event",
  PARTNERSHIP: "Partnership",
  GRANT: "Grant",
  COMPETITION: "Competition",
  PROJECT: "Project opportunity",
};

export function opportunityTypeLabel(code: string) {
  return OPPORTUNITY_TYPE_LABELS[code as OpportunityType] ?? code;
}

export function verificationLevelLabel(code: string | null | undefined) {
  switch (code) {
    case "IDENTITY_VERIFIED":
      return "Identity Verified";
    case "SKILL_VERIFIED":
      return "Skill Verified";
    case "FOUNDER_VERIFIED":
      return "Founder Verified";
    default:
      return "Basic";
  }
}

export function reputationLevelLabel(code: string | null | undefined) {
  switch (code) {
    case "CONTRIBUTOR":
      return "Contributor";
    case "BUILDER":
      return "Builder";
    case "TRUSTED_BUILDER":
      return "Trusted Builder";
    case "FOUNDING_CONTRIBUTOR":
      return "Founding Contributor";
    default:
      return "Member";
  }
}
