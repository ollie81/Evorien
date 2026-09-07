import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/supabase_providers.dart';

typedef DiscoverQuery = ({String query, String? pillar});

final discoverPeopleProvider = FutureProvider.family<List<Map<String, dynamic>>, DiscoverQuery>((ref, params) async {
  final client = ref.watch(supabaseClientProvider);
  var builder = client.from('profiles').select().eq('onboarding_completed', true);
  if (params.pillar != null) {
    builder = builder.contains('pillars', [params.pillar!]);
  }
  final query = params.query.trim();
  if (query.isNotEmpty) {
    builder = builder.or('full_name.ilike.%$query%,username.ilike.%$query%,country.ilike.%$query%');
  }
  return builder.order('created_at', ascending: false).limit(30);
});

final discoverProjectsProvider = FutureProvider.family<List<Map<String, dynamic>>, DiscoverQuery>((ref, params) async {
  final client = ref.watch(supabaseClientProvider);
  var builder = client.from('projects').select().eq('status', 'ACTIVE');
  if (params.pillar != null) {
    builder = builder.eq('pillar_code', params.pillar!);
  }
  final query = params.query.trim();
  if (query.isNotEmpty) {
    builder = builder.or('name.ilike.%$query%,tagline.ilike.%$query%,looking_for.ilike.%$query%');
  }
  return builder.order('created_at', ascending: false).limit(30);
});
