class Profile {
  const Profile({
    required this.id,
    required this.passportId,
    required this.passportNumber,
    required this.roles,
    required this.pillars,
    required this.verificationLevel,
    required this.reputationLevel,
    required this.isAdmin,
    required this.onboardingCompleted,
    required this.createdAt,
    this.username,
    this.fullName,
    this.avatarUrl,
    this.bio,
    this.country,
    this.city,
    this.website,
    this.lookingFor,
    this.contributionSummary,
  });

  final String id;
  final String passportId;
  final int passportNumber;
  final String? username;
  final String? fullName;
  final String? avatarUrl;
  final String? bio;
  final String? country;
  final String? city;
  final String? website;
  final List<String> roles;
  final List<String> pillars;
  final String? lookingFor;
  final String? contributionSummary;
  final String verificationLevel;
  final String reputationLevel;
  final bool isAdmin;
  final bool onboardingCompleted;
  final DateTime createdAt;

  String get displayName {
    if (fullName != null && fullName!.trim().isNotEmpty) return fullName!;
    if (username != null && username!.trim().isNotEmpty) return username!;
    return passportId;
  }

  factory Profile.fromJson(Map<String, dynamic> json) {
    return Profile(
      id: json['id'] as String,
      passportId: json['passport_id'] as String,
      passportNumber: _asInt(json['passport_number']),
      username: json['username'] as String?,
      fullName: json['full_name'] as String?,
      avatarUrl: json['avatar_url'] as String?,
      bio: json['bio'] as String?,
      country: json['country'] as String?,
      city: json['city'] as String?,
      website: json['website'] as String?,
      roles: (json['roles'] as List<dynamic>? ?? const []).map((e) => e.toString()).toList(),
      pillars: (json['pillars'] as List<dynamic>? ?? const []).map((e) => e.toString()).toList(),
      lookingFor: json['looking_for'] as String?,
      contributionSummary: json['contribution_summary'] as String?,
      verificationLevel: json['verification_level'] as String? ?? 'BASIC',
      reputationLevel: json['reputation_level'] as String? ?? 'MEMBER',
      isAdmin: json['is_admin'] as bool? ?? false,
      onboardingCompleted: json['onboarding_completed'] as bool? ?? false,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  static int _asInt(dynamic value) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value?.toString() ?? '') ?? 0;
  }
}
