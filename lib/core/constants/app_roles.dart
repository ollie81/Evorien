/// The roles a member can select — a person can hold several at once.
/// A person is not assumed to be a founder by default.
abstract final class AppRoles {
  static const all = <String>[
    'FOUNDER',
    'ENTREPRENEUR',
    'DEVELOPER',
    'ENGINEER',
    'DESIGNER',
    'CREATOR',
    'ARTIST',
    'FILMMAKER',
    'MUSICIAN',
    'RESEARCHER',
    'INVESTOR',
    'BUILDER',
    'COMMUNITY_ORGANIZER',
    'STUDENT',
    'BUSINESS',
    'ORGANIZATION',
    'OTHER',
  ];

  static String label(String code) => switch (code) {
    'FOUNDER' => 'Founder',
    'ENTREPRENEUR' => 'Entrepreneur',
    'DEVELOPER' => 'Developer',
    'ENGINEER' => 'Engineer',
    'DESIGNER' => 'Designer',
    'CREATOR' => 'Creator',
    'ARTIST' => 'Artist',
    'FILMMAKER' => 'Filmmaker',
    'MUSICIAN' => 'Musician',
    'RESEARCHER' => 'Researcher',
    'INVESTOR' => 'Investor',
    'BUILDER' => 'Builder',
    'COMMUNITY_ORGANIZER' => 'Community Organizer',
    'STUDENT' => 'Student',
    'BUSINESS' => 'Business',
    'ORGANIZATION' => 'Organization',
    _ => 'Other',
  };
}

/// What a member can offer, and separately what they are looking for.
abstract final class ContributionTypes {
  static const all = <String>[
    'SKILLS',
    'TIME',
    'KNOWLEDGE',
    'CREATIVITY',
    'ENGINEERING',
    'BUSINESS',
    'COMMUNITY',
    'EQUIPMENT',
    'MENTORSHIP',
    'OTHER',
  ];

  static String label(String code) => switch (code) {
    'SKILLS' => 'Skills',
    'TIME' => 'Time',
    'KNOWLEDGE' => 'Knowledge',
    'CREATIVITY' => 'Creativity',
    'ENGINEERING' => 'Engineering',
    'BUSINESS' => 'Business',
    'COMMUNITY' => 'Community',
    'EQUIPMENT' => 'Equipment / resources',
    'MENTORSHIP' => 'Mentorship',
    _ => 'Other',
  };
}

abstract final class ProjectStages {
  static const all = <String>['IDEA', 'PROTOTYPE', 'MVP', 'LAUNCHED', 'GROWING'];

  static String label(String code) => switch (code) {
    'IDEA' => 'Idea',
    'PROTOTYPE' => 'Prototype',
    'MVP' => 'MVP',
    'LAUNCHED' => 'Launched',
    'GROWING' => 'Growing',
    _ => code,
  };
}

abstract final class VerificationLevels {
  static const basic = 'BASIC';
  static const identityVerified = 'IDENTITY_VERIFIED';
  static const skillVerified = 'SKILL_VERIFIED';
  static const founderVerified = 'FOUNDER_VERIFIED';

  static String label(String code) => switch (code) {
    'IDENTITY_VERIFIED' => 'Identity Verified',
    'SKILL_VERIFIED' => 'Skill Verified',
    'FOUNDER_VERIFIED' => 'Founder Verified',
    _ => 'Basic',
  };
}

abstract final class ReputationLevels {
  static const all = <String>['MEMBER', 'CONTRIBUTOR', 'BUILDER', 'TRUSTED_BUILDER', 'FOUNDING_CONTRIBUTOR'];

  static String label(String code) => switch (code) {
    'CONTRIBUTOR' => 'Contributor',
    'BUILDER' => 'Builder',
    'TRUSTED_BUILDER' => 'Trusted Builder',
    'FOUNDING_CONTRIBUTOR' => 'Founding Contributor',
    _ => 'Member',
  };
}
