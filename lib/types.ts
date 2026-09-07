export interface Profile {
  id: string;
  passport_id: string;
  passport_number: number;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  country: string | null;
  city: string | null;
  website: string | null;
  roles: string[];
  pillars: string[];
  looking_for: string | null;
  contribution_summary: string | null;
  verification_level: string;
  reputation_level: string;
  is_admin: boolean;
  onboarding_completed: boolean;
  created_at: string;
}

export function profileDisplayName(profile: Pick<Profile, "full_name" | "username" | "passport_id">) {
  if (profile.full_name?.trim()) return profile.full_name;
  if (profile.username?.trim()) return profile.username;
  return profile.passport_id;
}

export interface ProfileSkill {
  proficiency: string | null;
  is_verified: boolean;
  skills: { name: string } | null;
}

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  awarded_at: string;
}

export interface Project {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  pillar_code: string | null;
  category: string | null;
  stage: string;
  status: string;
  country: string | null;
  city: string | null;
  website: string | null;
  looking_for: string | null;
  created_at: string;
}

export interface ProjectMember {
  role: string;
  status: string;
  joined_at: string;
  profiles: { id: string; full_name: string | null; username: string | null; passport_id: string } | null;
}

export interface Opportunity {
  id: string;
  title: string;
  description: string;
  type: string;
  pillar_code: string | null;
  location: string | null;
  is_remote: boolean;
  status: string;
  created_at: string;
}

export interface Contribution {
  id: string;
  type: string;
  title: string;
  description: string | null;
  status: string;
  project_id: string | null;
  created_at: string;
}

export interface NetworkStats {
  member_count: number;
  active_project_count: number;
  country_count: number;
  verified_contributor_count: number;
}

export interface CharterVersion {
  id: string;
  version: string;
  title: string;
  content: string;
  is_current: boolean;
  published_at: string | null;
}

export interface CharterProposal {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
}

export interface City {
  id: string;
  name: string;
  country: string;
  status: string;
  description: string | null;
}

export interface GovernanceProposal {
  id: string;
  title: string;
  description: string;
  status: string;
  voting_starts_at: string | null;
  voting_ends_at: string | null;
  created_at: string;
}

export interface ProposalOption {
  id: string;
  proposal_id: string;
  label: string;
  sort_order: number;
}

export interface ProposalResult {
  proposal_id: string;
  option_id: string;
  label: string;
  vote_count: number;
}
