import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/app_pillars.dart';
import '../../../core/constants/app_roles.dart';
import '../../../core/providers/supabase_providers.dart';
import '../../../core/router/route_paths.dart';
import '../../../core/theme/app_spacing.dart';
import '../data/project_repository.dart';

class CreateProjectScreen extends ConsumerStatefulWidget {
  const CreateProjectScreen({super.key});

  @override
  ConsumerState<CreateProjectScreen> createState() => _CreateProjectScreenState();
}

class _CreateProjectScreenState extends ConsumerState<CreateProjectScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _taglineController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _lookingForController = TextEditingController();
  String? _pillar;
  String _stage = ProjectStages.all.first;
  bool _saving = false;

  @override
  void dispose() {
    _nameController.dispose();
    _taglineController.dispose();
    _descriptionController.dispose();
    _lookingForController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final user = ref.read(currentUserProvider);
    if (user == null) return;

    setState(() => _saving = true);
    try {
      final id = await ref
          .read(projectRepositoryProvider)
          .createProject(
            ownerId: user.id,
            name: _nameController.text.trim(),
            tagline: _taglineController.text.trim().isEmpty ? null : _taglineController.text.trim(),
            description: _descriptionController.text.trim().isEmpty ? null : _descriptionController.text.trim(),
            pillarCode: _pillar,
            stage: _stage,
            lookingFor: _lookingForController.text.trim().isEmpty ? null : _lookingForController.text.trim(),
          );
      ref.invalidate(myProjectsProvider);
      if (!mounted) return;
      context.pushReplacement(RoutePaths.buildProject(id));
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not create the project. Please try again.')));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('New project')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.lg),
          children: [
            TextFormField(
              controller: _nameController,
              decoration: const InputDecoration(labelText: 'Project name'),
              validator: (v) => (v == null || v.trim().length < 2) ? 'Enter a project name' : null,
            ),
            const SizedBox(height: AppSpacing.md),
            TextFormField(controller: _taglineController, decoration: const InputDecoration(labelText: 'One-line tagline')),
            const SizedBox(height: AppSpacing.md),
            TextFormField(
              controller: _descriptionController,
              maxLines: 4,
              decoration: const InputDecoration(labelText: 'Description'),
            ),
            const SizedBox(height: AppSpacing.lg),
            Text('Pillar', style: Theme.of(context).textTheme.titleSmall),
            const SizedBox(height: AppSpacing.sm),
            Wrap(
              spacing: AppSpacing.sm,
              children: EvorienPillar.all
                  .map((p) => ChoiceChip(label: Text(p.name), selected: _pillar == p.code, onSelected: (_) => setState(() => _pillar = p.code)))
                  .toList(),
            ),
            const SizedBox(height: AppSpacing.lg),
            Text('Stage', style: Theme.of(context).textTheme.titleSmall),
            const SizedBox(height: AppSpacing.sm),
            Wrap(
              spacing: AppSpacing.sm,
              children: ProjectStages.all
                  .map((s) => ChoiceChip(label: Text(ProjectStages.label(s)), selected: _stage == s, onSelected: (_) => setState(() => _stage = s)))
                  .toList(),
            ),
            const SizedBox(height: AppSpacing.lg),
            TextFormField(
              controller: _lookingForController,
              maxLines: 2,
              decoration: const InputDecoration(labelText: 'Skills / collaborators needed'),
            ),
            const SizedBox(height: AppSpacing.xl),
            ElevatedButton(
              onPressed: _saving ? null : _submit,
              child: _saving
                  ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('Create project'),
            ),
          ],
        ),
      ),
    );
  }
}
