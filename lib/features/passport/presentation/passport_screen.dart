import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../core/constants/app_roles.dart';
import '../../../core/router/route_paths.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/error_view.dart';
import '../../../core/widgets/evorien_card.dart';
import '../../../core/widgets/loading_view.dart';
import '../../../core/widgets/pillar_chip.dart';
import '../../../core/widgets/section_header.dart';
import '../../auth/application/auth_controller.dart';
import '../data/profile_repository.dart';
import '../domain/profile.dart';

class PassportScreen extends ConsumerWidget {
  const PassportScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(myProfileProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Passport'),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_outlined),
            tooltip: 'Edit profile',
            onPressed: () => context.push(RoutePaths.passportEdit),
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Sign out',
            onPressed: () => ref.read(authControllerProvider.notifier).signOut(),
          ),
        ],
      ),
      body: profileAsync.when(
        loading: () => const LoadingView(),
        error: (error, _) => ErrorView(message: '$error', onRetry: () => ref.invalidate(myProfileProvider)),
        data: (profile) {
          if (profile == null) return const ErrorView(message: 'Profile not found.');
          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(myProfileProvider);
              ref.invalidate(myReputationScoreProvider);
              ref.invalidate(myProfileSkillsProvider);
              ref.invalidate(myAchievementsProvider);
            },
            child: ListView(
              padding: const EdgeInsets.all(AppSpacing.lg),
              children: [
                _IdentityHeader(profile: profile),
                const SizedBox(height: AppSpacing.md),
                Text(
                  'The Evorien Passport is a digital membership identity for this network. '
                  'It is not government citizenship, a passport issued by a country, or proof of nationality.',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                const SizedBox(height: AppSpacing.lg),
                const _StatsRow(),
                const SizedBox(height: AppSpacing.lg),
                if (profile.roles.isNotEmpty) ...[
                  const SectionHeader(title: 'Roles'),
                  const SizedBox(height: AppSpacing.sm),
                  Wrap(
                    spacing: AppSpacing.sm,
                    runSpacing: AppSpacing.sm,
                    children: profile.roles.map((r) => Chip(label: Text(AppRoles.label(r)))).toList(),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                ],
                if (profile.pillars.isNotEmpty) ...[
                  const SectionHeader(title: 'Pillars'),
                  const SizedBox(height: AppSpacing.sm),
                  Wrap(
                    spacing: AppSpacing.sm,
                    runSpacing: AppSpacing.sm,
                    children: profile.pillars.map((p) => PillarChip(code: p)).toList(),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                ],
                const SectionHeader(title: 'Skills'),
                const SizedBox(height: AppSpacing.sm),
                const _SkillsSection(),
                const SizedBox(height: AppSpacing.lg),
                if ((profile.contributionSummary ?? '').isNotEmpty) ...[
                  const SectionHeader(title: 'What I contribute'),
                  const SizedBox(height: AppSpacing.sm),
                  EvorienCard(child: Text(profile.contributionSummary!)),
                  const SizedBox(height: AppSpacing.lg),
                ],
                if ((profile.lookingFor ?? '').isNotEmpty) ...[
                  const SectionHeader(title: 'What I need'),
                  const SizedBox(height: AppSpacing.sm),
                  EvorienCard(child: Text(profile.lookingFor!)),
                  const SizedBox(height: AppSpacing.lg),
                ],
                const SectionHeader(title: 'Achievements'),
                const SizedBox(height: AppSpacing.sm),
                const _AchievementsSection(),
                const SizedBox(height: AppSpacing.xl),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _IdentityHeader extends StatelessWidget {
  const _IdentityHeader({required this.profile});

  final Profile profile;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return EvorienCard(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 32,
            backgroundColor: theme.colorScheme.primary.withValues(alpha: 0.15),
            backgroundImage: profile.avatarUrl != null ? NetworkImage(profile.avatarUrl!) : null,
            child: profile.avatarUrl == null
                ? Text(
                    profile.displayName.isNotEmpty ? profile.displayName[0].toUpperCase() : '?',
                    style: theme.textTheme.headlineSmall?.copyWith(color: theme.colorScheme.primary),
                  )
                : null,
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(profile.displayName, style: theme.textTheme.titleLarge),
                if (profile.username != null) Text('@${profile.username}', style: theme.textTheme.bodySmall),
                const SizedBox(height: AppSpacing.xs),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppColors.brandPrimary.withValues(alpha: 0.14),
                    borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
                  ),
                  child: Text(
                    profile.passportId,
                    style: theme.textTheme.labelMedium?.copyWith(
                      color: AppColors.brandPrimary,
                      fontFeatures: const [FontFeature.tabularFigures()],
                    ),
                  ),
                ),
                if (profile.country != null) ...[
                  const SizedBox(height: AppSpacing.xs),
                  Row(
                    children: [
                      const Icon(Icons.public, size: 14),
                      const SizedBox(width: 4),
                      Text(profile.country!, style: theme.textTheme.bodySmall),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StatsRow extends ConsumerWidget {
  const _StatsRow();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(myProfileProvider);
    final reputationAsync = ref.watch(myReputationScoreProvider);
    final profile = profileAsync.value;

    return Row(
      children: [
        Expanded(
          child: EvorienCard(
            child: StatTileText(
              value: reputationAsync.when(data: (v) => '$v', loading: () => '—', error: (_, _) => '—'),
              label: 'Reputation',
            ),
          ),
        ),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: EvorienCard(
            child: StatTileText(value: ReputationLevels.label(profile?.reputationLevel ?? 'MEMBER'), label: 'Level'),
          ),
        ),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: EvorienCard(
            child: StatTileText(
              value: VerificationLevels.label(profile?.verificationLevel ?? 'BASIC'),
              label: 'Verification',
            ),
          ),
        ),
      ],
    );
  }
}

class StatTileText extends StatelessWidget {
  const StatTileText({super.key, required this.value, required this.label});
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(value, style: theme.textTheme.titleMedium, maxLines: 1, overflow: TextOverflow.ellipsis),
        Text(label, style: theme.textTheme.bodySmall),
      ],
    );
  }
}

class _SkillsSection extends ConsumerWidget {
  const _SkillsSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final skillsAsync = ref.watch(myProfileSkillsProvider);
    return skillsAsync.when(
      loading: () => const LoadingView(),
      error: (e, _) => ErrorView(message: '$e'),
      data: (skills) {
        if (skills.isEmpty) {
          return const EmptyState(
            icon: Icons.psychology_outlined,
            title: 'No skills added yet',
            message: 'Add skills from your profile so others can find you.',
          );
        }
        return Wrap(
          spacing: AppSpacing.sm,
          runSpacing: AppSpacing.sm,
          children: skills
              .map(
                (s) => Chip(
                  avatar: s.isVerified ? const Icon(Icons.verified, size: 16) : null,
                  label: Text(s.name),
                ),
              )
              .toList(),
        );
      },
    );
  }
}

class _AchievementsSection extends ConsumerWidget {
  const _AchievementsSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final achievementsAsync = ref.watch(myAchievementsProvider);
    return achievementsAsync.when(
      loading: () => const LoadingView(),
      error: (e, _) => ErrorView(message: '$e'),
      data: (achievements) {
        if (achievements.isEmpty) {
          return const EmptyState(
            icon: Icons.emoji_events_outlined,
            title: 'No achievements yet',
            message: 'Achievements are earned by completing projects and helping the community.',
          );
        }
        return Column(
          children: achievements
              .map(
                (a) => Padding(
                  padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                  child: EvorienCard(
                    child: Row(
                      children: [
                        const Icon(Icons.emoji_events_outlined),
                        const SizedBox(width: AppSpacing.sm),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(a['name'] as String? ?? '', style: Theme.of(context).textTheme.titleSmall),
                              if (a['description'] != null) Text(a['description'] as String),
                            ],
                          ),
                        ),
                        Text(DateFormat.yMMMd().format(DateTime.parse(a['awarded_at'] as String))),
                      ],
                    ),
                  ),
                ),
              )
              .toList(),
        );
      },
    );
  }
}
