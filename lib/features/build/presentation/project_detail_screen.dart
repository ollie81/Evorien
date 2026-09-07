import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/app_roles.dart';
import '../../../core/providers/supabase_providers.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/widgets/error_view.dart';
import '../../../core/widgets/evorien_card.dart';
import '../../../core/widgets/loading_view.dart';
import '../../../core/widgets/pillar_chip.dart';
import '../../../core/widgets/section_header.dart';
import '../data/project_repository.dart';

class ProjectDetailScreen extends ConsumerWidget {
  const ProjectDetailScreen({super.key, required this.projectId});

  final String projectId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final projectAsync = ref.watch(projectDetailProvider(projectId));
    final membersAsync = ref.watch(projectMembersProvider(projectId));
    final currentUser = ref.watch(currentUserProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Project')),
      body: projectAsync.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(message: '$e', onRetry: () => ref.invalidate(projectDetailProvider(projectId))),
        data: (project) {
          if (project == null) return const ErrorView(message: 'This project could not be found.');

          final isMember = membersAsync.value?.any(
                (m) => (m['profiles'] as Map<String, dynamic>?)?['id'] == currentUser?.id,
              ) ??
              false;

          return ListView(
            padding: const EdgeInsets.all(AppSpacing.lg),
            children: [
              Row(
                children: [
                  Expanded(child: Text(project['name'] as String? ?? '', style: Theme.of(context).textTheme.headlineSmall)),
                  if (project['pillar_code'] != null) PillarChip(code: project['pillar_code'] as String),
                ],
              ),
              if (project['tagline'] != null) ...[
                const SizedBox(height: AppSpacing.xs),
                Text(project['tagline'] as String, style: Theme.of(context).textTheme.bodyLarge),
              ],
              const SizedBox(height: AppSpacing.md),
              Wrap(
                spacing: AppSpacing.sm,
                children: [
                  Chip(label: Text(ProjectStages.label(project['stage'] as String? ?? 'IDEA'))),
                  Chip(label: Text(project['status'] as String? ?? 'ACTIVE')),
                ],
              ),
              if ((project['description'] as String?)?.isNotEmpty ?? false) ...[
                const SizedBox(height: AppSpacing.lg),
                const SectionHeader(title: 'About'),
                const SizedBox(height: AppSpacing.sm),
                Text(project['description'] as String),
              ],
              if ((project['looking_for'] as String?)?.isNotEmpty ?? false) ...[
                const SizedBox(height: AppSpacing.lg),
                const SectionHeader(title: 'Looking for'),
                const SizedBox(height: AppSpacing.sm),
                EvorienCard(child: Text(project['looking_for'] as String)),
              ],
              const SizedBox(height: AppSpacing.lg),
              const SectionHeader(title: 'Team'),
              const SizedBox(height: AppSpacing.sm),
              membersAsync.when(
                loading: () => const LoadingView(),
                error: (e, _) => ErrorView(message: '$e'),
                data: (members) => Column(
                  children: members.map((m) {
                    final profile = m['profiles'] as Map<String, dynamic>?;
                    return Padding(
                      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                      child: EvorienCard(
                        child: Row(
                          children: [
                            CircleAvatar(child: Text(((profile?['full_name'] as String?) ?? '?').substring(0, 1).toUpperCase())),
                            const SizedBox(width: AppSpacing.sm),
                            Expanded(child: Text(profile?['full_name'] as String? ?? profile?['passport_id'] as String? ?? '')),
                            Text(m['role'] as String? ?? 'MEMBER'),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
              const SizedBox(height: AppSpacing.xl),
              if (currentUser != null && !isMember)
                ElevatedButton(
                  onPressed: () async {
                    await ref.read(projectRepositoryProvider).joinProject(projectId: projectId, userId: currentUser.id);
                    ref.invalidate(projectMembersProvider(projectId));
                    ref.invalidate(myProjectsProvider);
                  },
                  child: const Text('Join this project'),
                ),
            ],
          );
        },
      ),
    );
  }
}
