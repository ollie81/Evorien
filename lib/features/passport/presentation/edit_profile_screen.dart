import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/constants/app_pillars.dart';
import '../../../core/constants/app_roles.dart';
import '../../../core/providers/supabase_providers.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/widgets/loading_view.dart';
import '../data/profile_repository.dart';
import '../domain/profile.dart';

class EditProfileScreen extends ConsumerStatefulWidget {
  const EditProfileScreen({super.key});

  @override
  ConsumerState<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends ConsumerState<EditProfileScreen> {
  final _fullNameController = TextEditingController();
  final _usernameController = TextEditingController();
  final _bioController = TextEditingController();
  final _countryController = TextEditingController();
  final _cityController = TextEditingController();
  final _websiteController = TextEditingController();
  final _contributionController = TextEditingController();
  final _lookingForController = TextEditingController();
  final _skillController = TextEditingController();
  final _selectedRoles = <String>{};
  final _selectedPillars = <String>{};

  bool _initialized = false;
  bool _saving = false;

  void _initFromProfile(Profile profile) {
    if (_initialized) return;
    _initialized = true;
    _fullNameController.text = profile.fullName ?? '';
    _usernameController.text = profile.username ?? '';
    _bioController.text = profile.bio ?? '';
    _countryController.text = profile.country ?? '';
    _cityController.text = profile.city ?? '';
    _websiteController.text = profile.website ?? '';
    _contributionController.text = profile.contributionSummary ?? '';
    _lookingForController.text = profile.lookingFor ?? '';
    _selectedRoles.addAll(profile.roles);
    _selectedPillars.addAll(profile.pillars);
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _usernameController.dispose();
    _bioController.dispose();
    _countryController.dispose();
    _cityController.dispose();
    _websiteController.dispose();
    _contributionController.dispose();
    _lookingForController.dispose();
    _skillController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final user = ref.read(currentUserProvider);
    if (user == null) return;
    setState(() => _saving = true);
    try {
      await ref.read(profileRepositoryProvider).updateProfile(
        userId: user.id,
        changes: {
          'full_name': _fullNameController.text.trim(),
          'username': _usernameController.text.trim().toLowerCase(),
          'bio': _bioController.text.trim().isEmpty ? null : _bioController.text.trim(),
          'country': _countryController.text.trim().isEmpty ? null : _countryController.text.trim(),
          'city': _cityController.text.trim().isEmpty ? null : _cityController.text.trim(),
          'website': _websiteController.text.trim().isEmpty ? null : _websiteController.text.trim(),
          'contribution_summary': _contributionController.text.trim().isEmpty ? null : _contributionController.text.trim(),
          'looking_for': _lookingForController.text.trim().isEmpty ? null : _lookingForController.text.trim(),
          'roles': _selectedRoles.toList(),
          'pillars': _selectedPillars.toList(),
        },
      );
      ref.invalidate(myProfileProvider);
      if (mounted) Navigator.of(context).pop();
    } on PostgrestException catch (e) {
      if (!mounted) return;
      final message = e.code == '23505' ? 'That username is already taken.' : 'Could not save changes.';
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _addSkill() async {
    final user = ref.read(currentUserProvider);
    final name = _skillController.text.trim();
    if (user == null || name.isEmpty) return;
    _skillController.clear();
    await ref.read(profileRepositoryProvider).addSkill(userId: user.id, skillName: name);
    ref.invalidate(myProfileSkillsProvider);
  }

  @override
  Widget build(BuildContext context) {
    final profileAsync = ref.watch(myProfileProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Edit profile')),
      body: profileAsync.when(
        loading: () => const LoadingView(),
        error: (e, _) => Center(child: Text('$e')),
        data: (profile) {
          if (profile == null) return const SizedBox.shrink();
          _initFromProfile(profile);
          return ListView(
            padding: const EdgeInsets.all(AppSpacing.lg),
            children: [
              TextField(controller: _fullNameController, decoration: const InputDecoration(labelText: 'Full name')),
              const SizedBox(height: AppSpacing.md),
              TextField(
                controller: _usernameController,
                decoration: const InputDecoration(labelText: 'Username', prefixText: '@'),
              ),
              const SizedBox(height: AppSpacing.md),
              TextField(controller: _bioController, maxLines: 3, decoration: const InputDecoration(labelText: 'Bio')),
              const SizedBox(height: AppSpacing.md),
              Row(
                children: [
                  Expanded(
                    child: TextField(controller: _countryController, decoration: const InputDecoration(labelText: 'Country')),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: TextField(controller: _cityController, decoration: const InputDecoration(labelText: 'City')),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.md),
              TextField(controller: _websiteController, decoration: const InputDecoration(labelText: 'Website')),
              const SizedBox(height: AppSpacing.lg),
              Text('Pillars', style: Theme.of(context).textTheme.titleSmall),
              const SizedBox(height: AppSpacing.sm),
              Wrap(
                spacing: AppSpacing.sm,
                runSpacing: AppSpacing.sm,
                children: EvorienPillar.all.map((pillar) {
                  final selected = _selectedPillars.contains(pillar.code);
                  return FilterChip(
                    label: Text(pillar.name),
                    selected: selected,
                    onSelected: (v) => setState(() => v ? _selectedPillars.add(pillar.code) : _selectedPillars.remove(pillar.code)),
                  );
                }).toList(),
              ),
              const SizedBox(height: AppSpacing.lg),
              Text('Roles', style: Theme.of(context).textTheme.titleSmall),
              const SizedBox(height: AppSpacing.sm),
              Wrap(
                spacing: AppSpacing.sm,
                runSpacing: AppSpacing.sm,
                children: AppRoles.all.map((role) {
                  final selected = _selectedRoles.contains(role);
                  return FilterChip(
                    label: Text(AppRoles.label(role)),
                    selected: selected,
                    onSelected: (v) => setState(() => v ? _selectedRoles.add(role) : _selectedRoles.remove(role)),
                  );
                }).toList(),
              ),
              const SizedBox(height: AppSpacing.lg),
              Text('Skills', style: Theme.of(context).textTheme.titleSmall),
              const SizedBox(height: AppSpacing.sm),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _skillController,
                      decoration: const InputDecoration(hintText: 'Add a skill, e.g. Flutter'),
                      onSubmitted: (_) => _addSkill(),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  IconButton.filled(onPressed: _addSkill, icon: const Icon(Icons.add)),
                ],
              ),
              const SizedBox(height: AppSpacing.lg),
              TextField(
                controller: _contributionController,
                maxLines: 3,
                decoration: const InputDecoration(labelText: 'I can contribute...'),
              ),
              const SizedBox(height: AppSpacing.md),
              TextField(
                controller: _lookingForController,
                maxLines: 3,
                decoration: const InputDecoration(labelText: 'What I need'),
              ),
              const SizedBox(height: AppSpacing.xl),
              ElevatedButton(
                onPressed: _saving ? null : _save,
                child: _saving
                    ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Save changes'),
              ),
            ],
          );
        },
      ),
    );
  }
}
