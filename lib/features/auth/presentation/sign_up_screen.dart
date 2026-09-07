import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/router/route_paths.dart';
import '../../../core/theme/app_spacing.dart';
import '../application/auth_controller.dart';

class SignUpScreen extends ConsumerStatefulWidget {
  const SignUpScreen({super.key});

  @override
  ConsumerState<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends ConsumerState<SignUpScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _submitted = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    await ref
        .read(authControllerProvider.notifier)
        .signUp(email: _emailController.text.trim(), password: _passwordController.text);
    if (!mounted) return;
    if (!ref.read(authControllerProvider).hasError) {
      setState(() => _submitted = true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);

    ref.listen(authControllerProvider, (previous, next) {
      if (next.hasError) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(_friendlyError(next.error))),
        );
      }
    });

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: _submitted ? _CheckEmailNotice(email: _emailController.text.trim()) : _buildForm(authState),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildForm(AsyncValue<void> authState) {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Build the future with us.', style: Theme.of(context).textTheme.headlineMedium),
          const SizedBox(height: AppSpacing.xs),
          Text(
            'Create your Evorien Passport — a digital membership identity for the network. '
            'It is not a government ID or citizenship.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: AppSpacing.xxl),
          TextFormField(
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            autofillHints: const [AutofillHints.email],
            decoration: const InputDecoration(labelText: 'Email'),
            validator: (value) => (value == null || !value.contains('@')) ? 'Enter a valid email' : null,
          ),
          const SizedBox(height: AppSpacing.md),
          TextFormField(
            controller: _passwordController,
            obscureText: true,
            autofillHints: const [AutofillHints.newPassword],
            decoration: const InputDecoration(labelText: 'Password', helperText: 'At least 8 characters'),
            validator: (value) => (value == null || value.length < 8) ? 'At least 8 characters' : null,
            onFieldSubmitted: (_) => _submit(),
          ),
          const SizedBox(height: AppSpacing.lg),
          ElevatedButton(
            onPressed: authState.isLoading ? null : _submit,
            child: authState.isLoading
                ? const SizedBox(
                    height: 18,
                    width: 18,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : const Text('Create my Passport'),
          ),
          const SizedBox(height: AppSpacing.md),
          TextButton(
            onPressed: () => context.go(RoutePaths.signIn),
            child: const Text('Already a member? Sign in'),
          ),
        ],
      ),
    );
  }

  String _friendlyError(Object? error) {
    final message = error.toString();
    if (message.contains('already registered') || message.contains('User already registered')) {
      return 'An account with this email already exists.';
    }
    return 'Could not create your account. Please try again.';
  }
}

class _CheckEmailNotice extends StatelessWidget {
  const _CheckEmailNotice({required this.email});

  final String email;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(Icons.mark_email_read_outlined, size: 40, color: Theme.of(context).colorScheme.primary),
        const SizedBox(height: AppSpacing.md),
        Text('Check your email', style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: AppSpacing.xs),
        Text(
          "We've sent a confirmation link to $email. Open it to activate your account, then come back and sign in.",
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        const SizedBox(height: AppSpacing.lg),
        OutlinedButton(
          onPressed: () => context.go(RoutePaths.signIn),
          child: const Text('Back to sign in'),
        ),
      ],
    );
  }
}
