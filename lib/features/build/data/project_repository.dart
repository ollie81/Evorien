import 'dart:math';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/providers/supabase_providers.dart';

class ProjectRepository {
  ProjectRepository(this._client);
  final SupabaseClient _client;

  Future<List<Map<String, dynamic>>> fetchMyProjects(String userId) async {
    final rows = await _client
        .from('project_members')
        .select('role, status, projects(*)')
        .eq('profile_id', userId)
        .eq('status', 'ACTIVE')
        .order('joined_at', ascending: false);
    return rows
        .where((row) => row['projects'] != null)
        .map((row) => {...row['projects'] as Map<String, dynamic>, 'my_role': row['role']})
        .toList();
  }

  Future<Map<String, dynamic>?> fetchProject(String id) async {
    return _client.from('projects').select().eq('id', id).maybeSingle();
  }

  Future<List<Map<String, dynamic>>> fetchProjectMembers(String projectId) async {
    return _client
        .from('project_members')
        .select('role, status, profiles(id, full_name, username, passport_id)')
        .eq('project_id', projectId)
        .eq('status', 'ACTIVE')
        .order('joined_at');
  }

  Future<String> createProject({
    required String ownerId,
    required String name,
    String? tagline,
    String? description,
    String? pillarCode,
    required String stage,
    String? lookingFor,
    String? country,
    String? website,
  }) async {
    final slug = _slugify(name);
    final row = await _client
        .from('projects')
        .insert({
          'owner_id': ownerId,
          'name': name,
          'slug': slug,
          'tagline': tagline,
          'description': description,
          'pillar_code': pillarCode,
          'stage': stage,
          'looking_for': lookingFor,
          'country': country,
          'website': website,
        })
        .select('id')
        .single();
    return row['id'] as String;
  }

  Future<void> joinProject({required String projectId, required String userId}) async {
    await _client.from('project_members').insert({
      'project_id': projectId,
      'profile_id': userId,
      'role': 'MEMBER',
      'status': 'ACTIVE',
    });
  }

  Future<bool> isMember({required String projectId, required String userId}) async {
    final row = await _client
        .from('project_members')
        .select('id')
        .eq('project_id', projectId)
        .eq('profile_id', userId)
        .maybeSingle();
    return row != null;
  }

  Future<List<Map<String, dynamic>>> fetchOpportunities() async {
    return _client.from('opportunities').select().eq('status', 'OPEN').order('created_at', ascending: false);
  }

  Future<List<Map<String, dynamic>>> fetchMyContributions(String userId) async {
    return _client.from('contributions').select().eq('profile_id', userId).order('created_at', ascending: false);
  }

  Future<void> createContribution({
    required String userId,
    required String type,
    required String title,
    String? description,
    String? projectId,
  }) async {
    await _client.from('contributions').insert({
      'profile_id': userId,
      'type': type,
      'title': title,
      'description': description,
      'project_id': projectId,
    });
  }

  String _slugify(String name) {
    final base = name
        .toLowerCase()
        .replaceAll(RegExp(r"[^a-z0-9\s-]"), '')
        .trim()
        .replaceAll(RegExp(r'\s+'), '-');
    final suffix = _randomSuffix();
    return base.isEmpty ? 'project-$suffix' : '$base-$suffix';
  }

  String _randomSuffix() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    final random = Random();
    return List.generate(6, (_) => chars[random.nextInt(chars.length)]).join();
  }
}

final projectRepositoryProvider = Provider<ProjectRepository>((ref) => ProjectRepository(ref.watch(supabaseClientProvider)));

final myProjectsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final user = ref.watch(currentUserProvider);
  if (user == null) return [];
  return ref.watch(projectRepositoryProvider).fetchMyProjects(user.id);
});

final openOpportunitiesProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  return ref.watch(projectRepositoryProvider).fetchOpportunities();
});

final myContributionsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final user = ref.watch(currentUserProvider);
  if (user == null) return [];
  return ref.watch(projectRepositoryProvider).fetchMyContributions(user.id);
});

final projectDetailProvider = FutureProvider.family<Map<String, dynamic>?, String>((ref, projectId) async {
  return ref.watch(projectRepositoryProvider).fetchProject(projectId);
});

final projectMembersProvider = FutureProvider.family<List<Map<String, dynamic>>, String>((ref, projectId) async {
  return ref.watch(projectRepositoryProvider).fetchProjectMembers(projectId);
});
