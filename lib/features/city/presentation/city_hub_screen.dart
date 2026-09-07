import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/supabase_providers.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/error_view.dart';
import '../../../core/widgets/evorien_card.dart';
import '../../../core/widgets/loading_view.dart';
import '../../../core/widgets/section_header.dart';
import '../application/city_providers.dart';

const _principles = [
  'Freedom of expression',
  'Privacy',
  'Property rights',
  'Due process',
  'Freedom of association',
  'Business freedom',
  'Transparent institutions',
  'Limits on concentrated power',
];

class CityHubScreen extends StatefulWidget {
  const CityHubScreen({super.key});

  @override
  State<CityHubScreen> createState() => _CityHubScreenState();
}

class _CityHubScreenState extends State<CityHubScreen> with SingleTickerProviderStateMixin {
  late final TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
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
        title: const Text('The City'),
        bottom: TabBar(
          isScrollable: true,
          controller: _tabController,
          tabs: const [
            Tab(text: 'Vision'),
            Tab(text: 'Charter'),
            Tab(text: 'Governance'),
            Tab(text: 'Roadmap'),
            Tab(text: 'Locations'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: const [_VisionTab(), _CharterTab(), _GovernanceTab(), _RoadmapTab(), _LocationsTab()],
      ),
    );
  }
}

class _DisclaimerBanner extends StatelessWidget {
  const _DisclaimerBanner({required this.text});
  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.warning.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        border: Border.all(color: AppColors.warning.withValues(alpha: 0.4)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.info_outline, size: 18, color: AppColors.warning),
          const SizedBox(width: AppSpacing.sm),
          Expanded(child: Text(text, style: Theme.of(context).textTheme.bodySmall)),
        ],
      ),
    );
  }
}

class _VisionTab extends StatelessWidget {
  const _VisionTab();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      children: [
        Text('Beyond the network', style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: AppSpacing.sm),
        const Text(
          'Evorien\'s long-term vision is to help develop high-autonomy communities — places built '
          'by the same ambitious builders, artists and founders who make up this network. The physical '
          'city is a long-term goal: everything in the Evorien Network is designed to be valuable on its '
          'own, whether or not a physical community is ever built.',
        ),
        const SizedBox(height: AppSpacing.lg),
        const _DisclaimerBanner(
          text: 'Evorien does not currently control any territory and has no government partnerships '
              'unless explicitly announced. Any future physical development would operate under the laws '
              'of its host country.',
        ),
        const SizedBox(height: AppSpacing.lg),
        SectionHeader(title: 'Proposed principles', subtitle: 'A starting point for community discussion — see the Charter.'),
        const SizedBox(height: AppSpacing.sm),
        ..._principles.map(
          (p) => Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.sm),
            child: EvorienCard(
              child: Row(
                children: [
                  const Icon(Icons.check_circle_outline, size: 18),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(child: Text(p)),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(height: AppSpacing.sm),
        const _DisclaimerBanner(
          text: 'These are proposed community principles, not laws. They cannot override the laws of any '
              'host country and carry no legal authority today.',
        ),
      ],
    );
  }
}

class _CharterTab extends ConsumerWidget {
  const _CharterTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final charterAsync = ref.watch(currentCharterProvider);
    final proposalsAsync = ref.watch(charterProposalsProvider);
    final currentUser = ref.watch(currentUserProvider);

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(currentCharterProvider);
        ref.invalidate(charterProposalsProvider);
      },
      child: ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          charterAsync.when(
            loading: () => const LoadingView(),
            error: (e, _) => ErrorView(message: '$e'),
            data: (charter) {
              if (charter == null) {
                return const EmptyState(
                  icon: Icons.gavel_outlined,
                  title: 'No charter published yet',
                  message: 'The founding Freedom Charter will appear here once published.',
                );
              }
              return EvorienCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Freedom Charter ${charter['version']}', style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: AppSpacing.xs),
                    Text(charter['title'] as String? ?? '', style: Theme.of(context).textTheme.bodyMedium),
                    const SizedBox(height: AppSpacing.sm),
                    Text(charter['content'] as String? ?? ''),
                  ],
                ),
              );
            },
          ),
          const SizedBox(height: AppSpacing.lg),
          Row(
            children: [
              Expanded(child: SectionHeader(title: 'Proposed changes')),
              if (currentUser != null)
                TextButton(onPressed: () => _showProposeDialog(context, ref, currentUser.id), child: const Text('Propose a change')),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          proposalsAsync.when(
            loading: () => const LoadingView(),
            error: (e, _) => ErrorView(message: '$e'),
            data: (proposals) {
              if (proposals.isEmpty) {
                return const EmptyState(icon: Icons.edit_note_outlined, title: 'No proposed changes yet');
              }
              return Column(
                children: proposals
                    .map(
                      (p) => Padding(
                        padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                        child: EvorienCard(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Expanded(child: Text(p['title'] as String? ?? '', style: Theme.of(context).textTheme.titleSmall)),
                                  Chip(label: Text(p['status'] as String? ?? 'OPEN')),
                                ],
                              ),
                              const SizedBox(height: AppSpacing.xs),
                              Text(p['description'] as String? ?? ''),
                            ],
                          ),
                        ),
                      ),
                    )
                    .toList(),
              );
            },
          ),
        ],
      ),
    );
  }

  void _showProposeDialog(BuildContext context, WidgetRef ref, String userId) {
    final titleController = TextEditingController();
    final descriptionController = TextEditingController();
    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Propose a charter change'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: titleController, decoration: const InputDecoration(labelText: 'Title')),
            const SizedBox(height: AppSpacing.md),
            TextField(controller: descriptionController, maxLines: 3, decoration: const InputDecoration(labelText: 'Description')),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.of(context).pop(), child: const Text('Cancel')),
          FilledButton(
            onPressed: () async {
              if (titleController.text.trim().isEmpty || descriptionController.text.trim().isEmpty) return;
              await ref
                  .read(cityRepositoryProvider)
                  .proposeCharterChange(
                    userId: userId,
                    title: titleController.text.trim(),
                    description: descriptionController.text.trim(),
                  );
              ref.invalidate(charterProposalsProvider);
              if (context.mounted) Navigator.of(context).pop();
            },
            child: const Text('Submit'),
          ),
        ],
      ),
    );
  }
}

class _GovernanceTab extends ConsumerWidget {
  const _GovernanceTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final proposalsAsync = ref.watch(governanceProposalsProvider);

    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(governanceProposalsProvider),
      child: proposalsAsync.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(message: '$e', onRetry: () => ref.invalidate(governanceProposalsProvider)),
        data: (proposals) {
          if (proposals.isEmpty) {
            return ListView(
              padding: const EdgeInsets.all(AppSpacing.lg),
              children: const [
                EmptyState(
                  icon: Icons.how_to_vote_outlined,
                  title: 'No community proposals yet',
                  message: 'Community votes here are member decisions — not government elections and not '
                      'legally binding today.',
                ),
              ],
            );
          }
          return ListView.builder(
            padding: const EdgeInsets.all(AppSpacing.lg),
            itemCount: proposals.length,
            itemBuilder: (context, index) => _ProposalCard(proposal: proposals[index]),
          );
        },
      ),
    );
  }
}

class _ProposalCard extends ConsumerWidget {
  const _ProposalCard({required this.proposal});
  final Map<String, dynamic> proposal;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final proposalId = proposal['id'] as String;
    final optionsAsync = ref.watch(proposalOptionsProvider(proposalId));
    final resultsAsync = ref.watch(proposalResultsProvider(proposalId));
    final myVoteAsync = ref.watch(myVoteProvider(proposalId));
    final currentUser = ref.watch(currentUserProvider);
    final isActive = proposal['status'] == 'ACTIVE';

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: EvorienCard(
        child: ExpansionTile(
          tilePadding: EdgeInsets.zero,
          title: Text(proposal['title'] as String? ?? '', style: Theme.of(context).textTheme.titleSmall),
          subtitle: Text(proposal['status'] as String? ?? ''),
          children: [
            Text(proposal['description'] as String? ?? ''),
            const SizedBox(height: AppSpacing.sm),
            optionsAsync.when(
              loading: () => const LoadingView(),
              error: (e, _) => ErrorView(message: '$e'),
              data: (options) {
                final results = resultsAsync.value ?? [];
                final myVote = myVoteAsync.value;
                return Column(
                  children: options.map((option) {
                    final optionId = option['id'] as String;
                    final count = results.firstWhere(
                      (r) => r['option_id'] == optionId,
                      orElse: () => {'vote_count': 0},
                    )['vote_count'];
                    final votedForThis = myVote == optionId;
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Row(
                        children: [
                          Expanded(child: Text('${option['label']}  ·  $count votes')),
                          if (isActive && currentUser != null && myVote == null)
                            TextButton(
                              onPressed: () async {
                                await ref
                                    .read(cityRepositoryProvider)
                                    .castVote(proposalId: proposalId, optionId: optionId, userId: currentUser.id);
                                ref.invalidate(proposalResultsProvider(proposalId));
                                ref.invalidate(myVoteProvider(proposalId));
                              },
                              child: const Text('Vote'),
                            )
                          else if (votedForThis)
                            const Icon(Icons.check_circle, size: 18, color: AppColors.success),
                        ],
                      ),
                    );
                  }).toList(),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _RoadmapTab extends StatelessWidget {
  const _RoadmapTab();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      children: [
        const _DisclaimerBanner(
          text: 'PROPOSED FUTURE DEVELOPMENT. No location has been selected. This is a framework for how a '
              'future Evorien community could grow, not a description of anything currently underway.',
        ),
        const SizedBox(height: AppSpacing.lg),
        _PhaseCard(
          number: '1',
          name: 'Seed Village',
          hectares: '~50–100 hectares',
          features: const [
            'Housing',
            'Coworking',
            'Maker spaces',
            'Solar energy',
            'Digital infrastructure',
            'Small businesses',
            'Community spaces',
          ],
        ),
        const SizedBox(height: AppSpacing.md),
        _PhaseCard(
          number: '2',
          name: 'Town',
          hectares: '~500–2,000 hectares',
          features: const [
            'Commercial district',
            'Entertainment',
            'Arts',
            'Tourism',
            'Expanded housing',
            'Education',
            'Regional transportation',
          ],
        ),
        const SizedBox(height: AppSpacing.md),
        _PhaseCard(
          number: '3',
          name: 'Metropolis',
          hectares: '~5,000–20,000+ hectares',
          features: const [
            'Large residential areas',
            'Technology district',
            'International businesses',
            'Arts and entertainment districts',
            'Tourism infrastructure',
            'Major transportation',
          ],
        ),
      ],
    );
  }
}

class _PhaseCard extends StatelessWidget {
  const _PhaseCard({required this.number, required this.name, required this.hectares, required this.features});
  final String number;
  final String name;
  final String hectares;
  final List<String> features;

  @override
  Widget build(BuildContext context) {
    return EvorienCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(radius: 16, child: Text(number)),
              const SizedBox(width: AppSpacing.sm),
              Text('Phase $number — $name', style: Theme.of(context).textTheme.titleMedium),
            ],
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(hectares, style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: AppSpacing.sm),
          Wrap(spacing: AppSpacing.sm, runSpacing: AppSpacing.sm, children: features.map((f) => Chip(label: Text(f))).toList()),
        ],
      ),
    );
  }
}

class _LocationsTab extends ConsumerWidget {
  const _LocationsTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final citiesAsync = ref.watch(citiesProvider);
    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(citiesProvider),
      child: citiesAsync.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(message: '$e', onRetry: () => ref.invalidate(citiesProvider)),
        data: (cities) {
          if (cities.isEmpty) {
            return ListView(
              padding: const EdgeInsets.all(AppSpacing.lg),
              children: const [
                EmptyState(
                  icon: Icons.map_outlined,
                  title: 'No locations announced yet',
                  message: 'Evorien is location-agnostic and may eventually support multiple communities. '
                      'Nothing is announced today.',
                ),
              ],
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(AppSpacing.lg),
            itemCount: cities.length,
            separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.sm),
            itemBuilder: (context, index) {
              final city = cities[index];
              return EvorienCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(child: Text(city['name'] as String? ?? '', style: Theme.of(context).textTheme.titleSmall)),
                        Chip(label: Text(city['status'] as String? ?? 'RESEARCH')),
                      ],
                    ),
                    Text(city['country'] as String? ?? ''),
                    if (city['description'] != null) ...[
                      const SizedBox(height: AppSpacing.xs),
                      Text(city['description'] as String),
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
