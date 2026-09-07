import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/app_roles.dart';
import '../../../core/router/route_paths.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/error_view.dart';
import '../../../core/widgets/evorien_card.dart';
import '../../../core/widgets/loading_view.dart';
import '../../../core/widgets/pillar_chip.dart';
import '../../../core/widgets/section_header.dart';
import '../../../core/widgets/stat_tile.dart';
import '../../passport/data/profile_repository.dart';
import '../application/home_providers.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(myProfileProvider);
    final statsAsync = ref.watch(networkStatsProvider);
    final projectsAsync = ref.watch(recentProjectsProvider);
    final opportunitiesAsync = ref.watch(recentOpportunitiesProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          profileAsync.value != null ? 'Welcome, ${profileAsync.value!.displayName}' : 'Evorien',
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(networkStatsProvider);
          ref.invalidate(recentProjectsProvider);
          ref.invalidate(recentOpportunitiesProvider);
        },
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.lg),
          children: [
            const SectionHeader(title: 'Founding Community', subtitle: 'Real, live numbers — nothing fabricated.'),
            const SizedBox(height: AppSpacing.md),
            EvorienCard(
              child: statsAsync.when(
                loading: () => const LoadingView(),
                error: (e, _) => ErrorView(message: '$e', onRetry: () => ref.invalidate(networkStatsProvider)),
                data: (stats) => Row(
                  children: [
                    Expanded(child: StatTile(value: '${stats.memberCount}', label: 'Members')),
                    Expanded(child: StatTile(value: '${stats.activeProjectCount}', label: 'Active projects')),
                    Expanded(child: StatTile(value: '${stats.countryCount}', label: 'Countries')),
                    Expanded(child: StatTile(value: '${stats.verifiedContributorCount}', label: 'Verified')),
                  ],
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.xl),
            SectionHeader(
              title: 'Projects',
              action: TextButton(onPressed: () => context.go(RoutePaths.build), child: const Text('See all')),
            ),
            const SizedBox(height: AppSpacing.sm),
            projectsAsync.when(
              loading: () => const LoadingView(),
              error: (e, _) => ErrorView(message: '$e'),
              data: (projects) {
                if (projects.isEmpty) {
                  return EmptyState(
                    icon: Icons.construction_outlined,
                    title: 'No projects yet',
                    message: 'Be the first to start building something on Evorien.',
                    actionLabel: 'Create a project',
                    onAction: () => context.push(RoutePaths.buildCreate),
                  );
                }
                return Column(
                  children: projects
                      .map(
                        (p) => Padding(
                          padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                          child: EvorienCard(
                            onTap: () => context.push(RoutePaths.buildProject(p['id'] as String)),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(p['name'] as String? ?? '', style: Theme.of(context).textTheme.titleSmall),
                                      if (p['tagline'] != null) Text(p['tagline'] as String),
                                    ],
                                  ),
                                ),
                                if (p['pillar_code'] != null) PillarChip(code: p['pillar_code'] as String, dense: true),
                              ],
                            ),
                          ),
                        ),
                      )
                      .toList(),
                );
              },
            ),
            const SizedBox(height: AppSpacing.xl),
            SectionHeader(
              title: 'Opportunities',
              action: TextButton(onPressed: () => context.go(RoutePaths.build), child: const Text('See all')),
            ),
            const SizedBox(height: AppSpacing.sm),
            opportunitiesAsync.when(
              loading: () => const LoadingView(),
              error: (e, _) => ErrorView(message: '$e'),
              data: (opportunities) {
                if (opportunities.isEmpty) {
                  return const EmptyState(
                    icon: Icons.work_outline,
                    title: 'No opportunities yet',
                    message: 'Jobs, collaborations and events posted by members will appear here.',
                  );
                }
                return Column(
                  children: opportunities
                      .map(
                        (o) => Padding(
                          padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                          child: EvorienCard(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(o['title'] as String? ?? '', style: Theme.of(context).textTheme.titleSmall),
                                Text(ContributionTypes.label(o['type'] as String? ?? 'OTHER')),
                              ],
                            ),
                          ),
                        ),
                      )
                      .toList(),
                );
              },
            ),
            const SizedBox(height: AppSpacing.xl),
          ],
        ),
      ),
    );
  }
}
