import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/providers/supabase_providers.dart';
import '../domain/profile.dart';

class ProfileRepository {
  ProfileRepository(this._client);
  final SupabaseClient _client;

  Future<Profile?> fetchProfile(String userId) async {
    final data = await _client.from('profiles').select().eq('id', userId).maybeSingle();
    if (data == null) return null;
    return Profile.fromJson(data);
  }

  Future<int> fetchReputationScore(String userId) async {
    final data = await _client
        .from('profile_reputation_scores')
        .select('reputation_score')
        .eq('profile_id', userId)
        .maybeSingle();
    if (data == null) return 0;
    return (data['reputation_score'] as num).toInt();
  }

  Future<List<Map<String, dynamic>>> fetchAchievements(String userId) async {
    return _client
        .from('achievements')
        .select()
        .eq('profile_id', userId)
        .order('awarded_at', ascending: false);
  }

  Future<List<ProfileSkill>> fetchSkills(String userId) async {
    final rows = await _client
        .from('profile_skills')
        .select('proficiency, is_verified, skills(name)')
        .eq('profile_id', userId);
    return rows.map((row) {
      final skill = row['skills'] as Map<String, dynamic>?;
      return ProfileSkill(
        name: skill?['name'] as String? ?? 'Unknown skill',
        proficiency: row['proficiency'] as String?,
        isVerified: row['is_verified'] as bool? ?? false,
      );
    }).toList();
  }

  Future<void> addSkill({required String userId, required String skillName}) async {
    final normalized = skillName.trim();
    if (normalized.isEmpty) return;
    final existing = await _client.from('skills').select('id').ilike('name', normalized).maybeSingle();
    final skillId = existing != null
        ? existing['id'] as String
        : (await _client.from('skills').insert({'name': normalized}).select('id').single())['id'] as String;
    await _client.from('profile_skills').upsert({
      'profile_id': userId,
      'skill_id': skillId,
    }, onConflict: 'profile_id,skill_id');
  }

  Future<void> completeOnboarding({
    required String userId,
    required String username,
    required String fullName,
    required List<String> roles,
    required List<String> pillars,
    String? country,
    String? lookingFor,
    String? contributionSummary,
  }) async {
    await _client
        .from('profiles')
        .update({
          'username': username,
          'full_name': fullName,
          'roles': roles,
          'pillars': pillars,
          'country': country,
          'looking_for': lookingFor,
          'contribution_summary': contributionSummary,
          'onboarding_completed': true,
        })
        .eq('id', userId);
  }

  Future<void> updateProfile({
    required String userId,
    required Map<String, dynamic> changes,
  }) async {
    await _client.from('profiles').update(changes).eq('id', userId);
  }
}

final profileRepositoryProvider = Provider<ProfileRepository>(
  (ref) => ProfileRepository(ref.watch(supabaseClientProvider)),
);

final myProfileProvider = FutureProvider<Profile?>((ref) async {
  final user = ref.watch(currentUserProvider);
  if (user == null) return null;
  return ref.watch(profileRepositoryProvider).fetchProfile(user.id);
});

final myReputationScoreProvider = FutureProvider<int>((ref) async {
  final user = ref.watch(currentUserProvider);
  if (user == null) return 0;
  return ref.watch(profileRepositoryProvider).fetchReputationScore(user.id);
});

final myProfileSkillsProvider = FutureProvider<List<ProfileSkill>>((ref) async {
  final user = ref.watch(currentUserProvider);
  if (user == null) return [];
  return ref.watch(profileRepositoryProvider).fetchSkills(user.id);
});

final myAchievementsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final user = ref.watch(currentUserProvider);
  if (user == null) return [];
  return ref.watch(profileRepositoryProvider).fetchAchievements(user.id);
});

class ProfileSkill {
  const ProfileSkill({required this.name, required this.isVerified, this.proficiency});
  final String name;
  final String? proficiency;
  final bool isVerified;
}
