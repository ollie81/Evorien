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
import '../data/project_repository.dart';

class BuildHubScreen extends StatefulWidget {
  const BuildHubScreen({super.key});

  @override
  State<BuildHubScreen> createState() => _BuildHubScreenState();
}

class _BuildHubScreenState extends State<BuildHubScreen> with SingleTickerProviderStateMixin {
  late final TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Build'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [Tab(text: 'My Projects'), Tab(text: 'Opportunities'), Tab(text: 'Contributions')],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push(RoutePaths.buildCreate),
        icon: const Icon(Icons.add),
        label: const Text('New project'),
      ),
      body: TabBarView(
        controller: _tabController,
        children: const [_MyProjectsTab(), _OpportunitiesTab(), _ContributionsTab()],
      ),
    );
  }
}

class _MyProjectsTab extends ConsumerWidget {
  const _MyProjectsTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final projectsAsync = ref.watch(myProjectsProvider);
    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(myProjectsProvider),
      child: projectsAsync.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(message: '$e', onRetry: () => ref.invalidate(myProjectsProvider)),
        data: (projects) {
          if (projects.isEmpty) {
            return ListView(
              children: const [
                EmptyState(
                  icon: Icons.construction_outlined,
                  title: "You haven't joined a project yet",
                  message: 'Create your own, or find one to join from Discover.',
                ),
              ],
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(AppSpacing.lg),
            itemCount: projects.length,
            separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.sm),
            itemBuilder: (context, index) {
              final project = projects[index];
              return EvorienCard(
                onTap: () => context.push(RoutePaths.buildProject(project['id'] as String)),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(project['name'] as String? ?? '', style: Theme.of(context).textTheme.titleSmall),
                          Text('${project['stage']} · ${project['my_role']}'),
                        ],
                      ),
                    ),
                    if (project['pillar_code'] != null) PillarChip(code: project['pillar_code'] as String, dense: true),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }
}

class _OpportunitiesTab extends ConsumerWidget {
  const _OpportunitiesTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final opportunitiesAsync = ref.watch(openOpportunitiesProvider);
    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(openOpportunitiesProvider),
      child: opportunitiesAsync.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(message: '$e', onRetry: () => ref.invalidate(openOpportunitiesProvider)),
        data: (opportunities) {
          if (opportunities.isEmpty) {
            return ListView(
              children: const [
                EmptyState(
                  icon: Icons.work_outline,
                  title: 'No opportunities posted yet',
                  message: 'Jobs, collaborations, grants and events from members will show up here.',
                ),
              ],
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(AppSpacing.lg),
            itemCount: opportunities.length,
            separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.sm),
            itemBuilder: (context, index) {
              final o = opportunities[index];
              return EvorienCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(o['title'] as String? ?? '', style: Theme.of(context).textTheme.titleSmall),
                    const SizedBox(height: AppSpacing.xs),
                    Text(ContributionTypes.label(o['type'] as String? ?? 'OTHER')),
                    if (o['description'] != null) ...[
                      const SizedBox(height: AppSpacing.xs),
                      Text(o['description'] as String, maxLines: 2, overflow: TextOverflow.ellipsis),
                    ],
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }
}

class _ContributionsTab extends ConsumerWidget {
  const _ContributionsTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final contributionsAsync = ref.watch(myContributionsProvider);
    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(myContributionsProvider),
      child: contributionsAsync.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(message: '$e', onRetry: () => ref.invalidate(myContributionsProvider)),
        data: (contributions) {
          if (contributions.isEmpty) {
            return ListView(
              children: const [
                EmptyState(
                  icon: Icons.volunteer_activism_outlined,
                  title: 'No contributions logged yet',
                  message: 'Contributions you make to projects and the community will appear here.',
                ),
              ],
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(AppSpacing.lg),
            itemCount: contributions.length,
            separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.sm),
            itemBuilder: (context, index) {
              final c = contributions[index];
              return EvorienCard(
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(c['title'] as String? ?? '', style: Theme.of(context).textTheme.titleSmall),
                          Text(ContributionTypes.label(c['type'] as String? ?? 'OTHER')),
                        ],
                      ),
                    ),
                    Chip(label: Text(c['status'] as String? ?? 'PENDING')),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }
}
