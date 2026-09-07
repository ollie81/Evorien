import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/providers/supabase_providers.dart';

final currentCharterProvider = FutureProvider<Map<String, dynamic>?>((ref) async {
  final client = ref.watch(supabaseClientProvider);
  return client.from('charter_versions').select().eq('is_current', true).maybeSingle();
});

final charterProposalsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final client = ref.watch(supabaseClientProvider);
  return client.from('charter_proposals').select().order('created_at', ascending: false).limit(20);
});

final citiesProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final client = ref.watch(supabaseClientProvider);
  return client.from('cities').select().order('created_at');
});

final governanceProposalsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final client = ref.watch(supabaseClientProvider);
  return client.from('proposals').select().order('created_at', ascending: false).limit(20);
});

final proposalOptionsProvider = FutureProvider.family<List<Map<String, dynamic>>, String>((ref, proposalId) async {
  final client = ref.watch(supabaseClientProvider);
  return client.from('proposal_options').select().eq('proposal_id', proposalId).order('sort_order');
});

final proposalResultsProvider = FutureProvider.family<List<Map<String, dynamic>>, String>((ref, proposalId) async {
  final client = ref.watch(supabaseClientProvider);
  return client.from('proposal_results').select().eq('proposal_id', proposalId);
});

final myVoteProvider = FutureProvider.family<String?, String>((ref, proposalId) async {
  final client = ref.watch(supabaseClientProvider);
  final userId = client.auth.currentUser?.id;
  if (userId == null) return null;
  final row = await client
      .from('votes')
      .select('option_id')
      .eq('proposal_id', proposalId)
      .eq('profile_id', userId)
      .maybeSingle();
  return row?['option_id'] as String?;
});

class CityRepository {
  CityRepository(this._client);
  final SupabaseClient _client;

  Future<void> castVote({required String proposalId, required String optionId, required String userId}) async {
    await _client.from('votes').insert({'proposal_id': proposalId, 'option_id': optionId, 'profile_id': userId});
  }

  Future<void> proposeCharterChange({
    required String userId,
    required String title,
    required String description,
  }) async {
    await _client.from('charter_proposals').insert({
      'proposed_by': userId,
      'title': title,
      'description': description,
    });
  }
}

final cityRepositoryProvider = Provider<CityRepository>((ref) => CityRepository(ref.watch(supabaseClientProvider)));
