import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/app_pillars.dart';
import '../../../core/constants/app_roles.dart';
import '../../../core/router/route_paths.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/error_view.dart';
import '../../../core/widgets/evorien_card.dart';
import '../../../core/widgets/loading_view.dart';
import '../../../core/widgets/pillar_chip.dart';
import '../application/discover_providers.dart';

class DiscoverScreen extends StatefulWidget {
  const DiscoverScreen({super.key});

  @override
  State<DiscoverScreen> createState() => _DiscoverScreenState();
}

class _DiscoverScreenState extends State<DiscoverScreen> with SingleTickerProviderStateMixin {
  late final TabController _tabController;
  final _searchController = TextEditingController();
  String _search = '';
  String? _pillar;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Discover'),
        bottom: TabBar(controller: _tabController, tabs: const [Tab(text: 'People'), Tab(text: 'Projects')]),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.md, AppSpacing.lg, 0),
            child: TextField(
              controller: _searchController,
              decoration: const InputDecoration(
                hintText: 'Search by skill, role, country, project...',
                prefixIcon: Icon(Icons.search),
              ),
              onChanged: (value) => setState(() => _search = value),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.sm),
            child: SizedBox(
              height: 36,
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: [
                  Padding(
                    padding: const EdgeInsets.only(right: AppSpacing.sm),
                    child: ChoiceChip(label: const Text('All pillars'), selected: _pillar == null, onSelected: (_) => setState(() => _pillar = null)),
                  ),
                  ...EvorienPillar.all.map(
                    (p) => Padding(
                      padding: const EdgeInsets.only(right: AppSpacing.sm),
                      child: ChoiceChip(
                        label: Text(p.name),
                        selected: _pillar == p.code,
                        onSelected: (_) => setState(() => _pillar = _pillar == p.code ? null : p.code),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [_PeopleTab(query: _search, pillar: _pillar), _ProjectsTab(query: _search, pillar: _pillar)],
            ),
          ),
        ],
      ),
    );
  }
}

class _PeopleTab extends ConsumerWidget {
  const _PeopleTab({required this.query, required this.pillar});
  final String query;
  final String? pillar;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final peopleAsync = ref.watch(discoverPeopleProvider((query: query, pillar: pillar)));
    return peopleAsync.when(
      loading: () => const LoadingView(),
      error: (e, _) => ErrorView(message: '$e'),
      data: (people) {
        if (people.isEmpty) {
          return const EmptyState(
            icon: Icons.people_outline,
            title: 'No members found',
            message: 'Try a different search or pillar filter.',
          );
        }
        return ListView.separated(
          padding: const EdgeInsets.all(AppSpacing.lg),
          itemCount: people.length,
          separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.sm),
          itemBuilder: (context, index) {
            final person = people[index];
            final roles = (person['roles'] as List<dynamic>? ?? const []).cast<String>();
            final pillars = (person['pillars'] as List<dynamic>? ?? const []).cast<String>();
            return EvorienCard(
              onTap: () => _showPersonSheet(context, person),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  CircleAvatar(child: Text(_initial(person['full_name'] as String?))),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(person['full_name'] as String? ?? person['passport_id'] as String,
                            style: Theme.of(context).textTheme.titleSmall),
                        if (roles.isNotEmpty) Text(roles.map(AppRoles.label).join(' · '), style: Theme.of(context).textTheme.bodySmall),
                        if (pillars.isNotEmpty) ...[
                          const SizedBox(height: AppSpacing.xs),
                          Wrap(spacing: 4, runSpacing: 4, children: pillars.map((p) => PillarChip(code: p, dense: true)).toList()),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  String _initial(String? name) => (name != null && name.isNotEmpty) ? name[0].toUpperCase() : '?';

  void _showPersonSheet(BuildContext context, Map<String, dynamic> person) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => Padding(
        padding: EdgeInsets.fromLTRB(
          AppSpacing.lg,
          AppSpacing.lg,
          AppSpacing.lg,
          MediaQuery.of(context).viewInsets.bottom + AppSpacing.lg,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(person['full_name'] as String? ?? '', style: Theme.of(context).textTheme.headlineSmall),
            if (person['username'] != null) Text('@${person['username']}'),
            const SizedBox(height: AppSpacing.md),
            if ((person['bio'] as String?)?.isNotEmpty ?? false) Text(person['bio'] as String),
            if ((person['contribution_summary'] as String?)?.isNotEmpty ?? false) ...[
              const SizedBox(height: AppSpacing.md),
              Text('Can contribute', style: Theme.of(context).textTheme.titleSmall),
              Text(person['contribution_summary'] as String),
            ],
            if ((person['looking_for'] as String?)?.isNotEmpty ?? false) ...[
              const SizedBox(height: AppSpacing.md),
              Text('Looking for', style: Theme.of(context).textTheme.titleSmall),
              Text(person['looking_for'] as String),
            ],
          ],
        ),
      ),
    );
  }
}

class _ProjectsTab extends ConsumerWidget {
  const _ProjectsTab({required this.query, required this.pillar});
  final String query;
  final String? pillar;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final projectsAsync = ref.watch(discoverProjectsProvider((query: query, pillar: pillar)));
    return projectsAsync.when(
      loading: () => const LoadingView(),
      error: (e, _) => ErrorView(message: '$e'),
      data: (projects) {
        if (projects.isEmpty) {
          return const EmptyState(
            icon: Icons.construction_outlined,
            title: 'No projects found',
            message: 'Try a different search or pillar filter.',
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
                        if (project['tagline'] != null) Text(project['tagline'] as String),
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
    );
  }
}
