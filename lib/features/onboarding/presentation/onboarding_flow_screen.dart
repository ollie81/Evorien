import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/constants/app_pillars.dart';
import '../../../core/constants/app_roles.dart';
import '../../../core/providers/supabase_providers.dart';
import '../../../core/router/route_paths.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../passport/data/profile_repository.dart';

class OnboardingFlowScreen extends ConsumerStatefulWidget {
  const OnboardingFlowScreen({super.key});

  @override
  ConsumerState<OnboardingFlowScreen> createState() => _OnboardingFlowScreenState();
}

class _OnboardingFlowScreenState extends ConsumerState<OnboardingFlowScreen> {
  final _pageController = PageController();
  int _step = 0;
  bool _submitting = false;
  String? _submitError;

  final _fullNameController = TextEditingController();
  final _usernameController = TextEditingController();
  final _countryController = TextEditingController();
  final _contributionController = TextEditingController();
  final _lookingForController = TextEditingController();
  final _selectedRoles = <String>{};
  final _selectedPillars = <String>{};

  static const _totalSteps = 5;

  @override
  void dispose() {
    _pageController.dispose();
    _fullNameController.dispose();
    _usernameController.dispose();
    _countryController.dispose();
    _contributionController.dispose();
    _lookingForController.dispose();
    super.dispose();
  }

  bool get _canContinue {
    switch (_step) {
      case 1:
        return _fullNameController.text.trim().isNotEmpty && _usernameController.text.trim().length >= 3;
      case 2:
        return _selectedPillars.isNotEmpty;
      case 3:
        return _selectedRoles.isNotEmpty;
      default:
        return true;
    }
  }

  void _next() {
    if (_step == _totalSteps - 1) {
      _submit();
      return;
    }
    setState(() => _step++);
    _pageController.nextPage(duration: const Duration(milliseconds: 250), curve: Curves.easeOut);
  }

  void _back() {
    if (_step == 0) return;
    setState(() => _step--);
    _pageController.previousPage(duration: const Duration(milliseconds: 250), curve: Curves.easeOut);
  }

  Future<void> _submit() async {
    final user = ref.read(currentUserProvider);
    if (user == null) return;

    setState(() {
      _submitting = true;
      _submitError = null;
    });

    try {
      final username = _usernameController.text.trim().toLowerCase().replaceAll(RegExp(r'[^a-z0-9_]'), '_');
      await ref
          .read(profileRepositoryProvider)
          .completeOnboarding(
            userId: user.id,
            username: username,
            fullName: _fullNameController.text.trim(),
            roles: _selectedRoles.toList(),
            pillars: _selectedPillars.toList(),
            country: _countryController.text.trim().isEmpty ? null : _countryController.text.trim(),
            lookingFor: _lookingForController.text.trim().isEmpty ? null : _lookingForController.text.trim(),
            contributionSummary:
                _contributionController.text.trim().isEmpty ? null : _contributionController.text.trim(),
          );
      ref.invalidate(myProfileProvider);
      if (!mounted) return;
      context.go(RoutePaths.home);
    } on PostgrestException catch (e) {
      setState(() {
        _submitError = e.code == '23505'
            ? 'That username is already taken — please choose another.'
            : 'Something went wrong creating your Passport. Please try again.';
      });
    } catch (_) {
      setState(() => _submitError = 'Something went wrong creating your Passport. Please try again.');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            if (_step > 0)
              Padding(
                padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.md, AppSpacing.lg, 0),
                child: LinearProgressIndicator(value: _step / (_totalSteps - 1), minHeight: 3),
              ),
            Expanded(
              child: PageView(
                controller: _pageController,
                physics: const NeverScrollableScrollPhysics(),
                children: [
                  _WelcomeStep(onStart: _next),
                  _stepScaffold(child: _identityStep()),
                  _stepScaffold(child: _pillarsStep()),
                  _stepScaffold(child: _rolesStep()),
                  _stepScaffold(child: _contributionStep()),
                ],
              ),
            ),
            if (_step > 0)
              Padding(
                padding: const EdgeInsets.all(AppSpacing.lg),
                child: Row(
                  children: [
                    TextButton(onPressed: _submitting ? null : _back, child: const Text('Back')),
                    const Spacer(),
                    ElevatedButton(
                      onPressed: (!_canContinue || _submitting) ? null : _next,
                      child: _submitting
                          ? const SizedBox(
                              height: 18,
                              width: 18,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : Text(_step == _totalSteps - 1 ? 'Create my Passport' : 'Continue'),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _stepScaffold({required Widget child}) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: child,
    );
  }

  Widget _identityStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Who are you?', style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: AppSpacing.lg),
        TextField(controller: _fullNameController, decoration: const InputDecoration(labelText: 'Full name'), onChanged: (_) => setState(() {})),
        const SizedBox(height: AppSpacing.md),
        TextField(
          controller: _usernameController,
          decoration: const InputDecoration(labelText: 'Username', prefixText: '@', helperText: 'Lowercase letters, numbers, underscore'),
          onChanged: (_) => setState(() {}),
        ),
        const SizedBox(height: AppSpacing.md),
        TextField(controller: _countryController, decoration: const InputDecoration(labelText: 'Country (optional)')),
      ],
    );
  }

  Widget _pillarsStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Which Evorien pillars interest you?', style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: AppSpacing.xs),
        Text('Choose as many as apply.', style: Theme.of(context).textTheme.bodySmall),
        const SizedBox(height: AppSpacing.lg),
        Wrap(
          spacing: AppSpacing.sm,
          runSpacing: AppSpacing.sm,
          children: EvorienPillar.all.map((pillar) {
            final selected = _selectedPillars.contains(pillar.code);
            return FilterChip(
              label: Text(pillar.name),
              selected: selected,
              selectedColor: AppColors.pillarColor(pillar.code).withValues(alpha: 0.22),
              onSelected: (value) => setState(() {
                value ? _selectedPillars.add(pillar.code) : _selectedPillars.remove(pillar.code);
              }),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _rolesStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('What do you build?', style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: AppSpacing.xs),
        Text('Select every role that applies to you.', style: Theme.of(context).textTheme.bodySmall),
        const SizedBox(height: AppSpacing.lg),
        Wrap(
          spacing: AppSpacing.sm,
          runSpacing: AppSpacing.sm,
          children: AppRoles.all.map((role) {
            final selected = _selectedRoles.contains(role);
            return FilterChip(
              label: Text(AppRoles.label(role)),
              selected: selected,
              onSelected: (value) => setState(() {
                value ? _selectedRoles.add(role) : _selectedRoles.remove(role);
              }),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _contributionStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('What can you contribute?', style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: AppSpacing.lg),
        TextField(
          controller: _contributionController,
          maxLines: 3,
          decoration: const InputDecoration(
            labelText: 'I can contribute...',
            hintText: 'e.g. Flutter development, brand design, event organizing',
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        TextField(
          controller: _lookingForController,
          maxLines: 3,
          decoration: const InputDecoration(
            labelText: 'What are you looking for? (optional)',
            hintText: 'e.g. A backend engineer for my project',
          ),
        ),
        if (_submitError != null) ...[
          const SizedBox(height: AppSpacing.md),
          Text(_submitError!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
        ],
      ],
    );
  }
}

class _WelcomeStep extends StatelessWidget {
  const _WelcomeStep({required this.onStart});

  final VoidCallback onStart;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.xl),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Build the future with us.', style: Theme.of(context).textTheme.headlineMedium),
          const SizedBox(height: AppSpacing.md),
          Text(
            "A few quick questions and we'll generate your Evorien Passport — "
            'your identity across the whole network.',
            style: Theme.of(context).textTheme.bodyLarge,
          ),
          const SizedBox(height: AppSpacing.xl),
          ElevatedButton(onPressed: onStart, child: const Text('Get started')),
        ],
      ),
    );
  }
}
