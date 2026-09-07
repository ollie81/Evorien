import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/supabase_providers.dart';

class NetworkStats {
  const NetworkStats({
    required this.memberCount,
    required this.activeProjectCount,
    required this.countryCount,
    required this.verifiedContributorCount,
  });

  final int memberCount;
  final int activeProjectCount;
  final int countryCount;
  final int verifiedContributorCount;

  factory NetworkStats.fromJson(Map<String, dynamic> json) => NetworkStats(
    memberCount: (json['member_count'] as num?)?.toInt() ?? 0,
    activeProjectCount: (json['active_project_count'] as num?)?.toInt() ?? 0,
    countryCount: (json['country_count'] as num?)?.toInt() ?? 0,
    verifiedContributorCount: (json['verified_contributor_count'] as num?)?.toInt() ?? 0,
  );

  static const zero = NetworkStats(memberCount: 0, activeProjectCount: 0, countryCount: 0, verifiedContributorCount: 0);
}

/// Always reflects reality — this powers the Home screen's "Evorien
/// Progress" counters, which must never be fabricated or rounded up.
final networkStatsProvider = FutureProvider<NetworkStats>((ref) async {
  final client = ref.watch(supabaseClientProvider);
  final row = await client.from('network_stats').select().maybeSingle();
  if (row == null) return NetworkStats.zero;
  return NetworkStats.fromJson(row);
});

final recentProjectsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final client = ref.watch(supabaseClientProvider);
  return client.from('projects').select().eq('status', 'ACTIVE').order('created_at', ascending: false).limit(5);
});

final recentOpportunitiesProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final client = ref.watch(supabaseClientProvider);
  return client.from('opportunities').select().eq('status', 'OPEN').order('created_at', ascending: false).limit(5);
});
