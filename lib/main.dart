import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'app.dart';
import 'core/config/env.dart';
import 'core/theme/app_theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  try {
    await dotenv.load(fileName: '.env');
  } catch (_) {
    // Missing .env is handled by Env.isConfigured below, not treated as fatal.
  }

  if (!Env.isConfigured) {
    runApp(const _SetupNeededApp());
    return;
  }

  await Supabase.initialize(url: Env.supabaseUrl, publishableKey: Env.supabaseAnonKey);

  runApp(const ProviderScope(child: EvorienApp()));
}

/// Shown instead of crashing when a founder runs the app before creating a
/// real `.env` file. Plain language, no stack traces.
class _SetupNeededApp extends StatelessWidget {
  const _SetupNeededApp();

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Evorien',
      theme: AppTheme.dark,
      darkTheme: AppTheme.dark,
      home: Scaffold(
        body: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.settings_outlined, size: 40, color: Theme.of(context).colorScheme.primary),
                  const SizedBox(height: 16),
                  Text('Evorien needs to be connected to Supabase', style: Theme.of(context).textTheme.headlineSmall),
                  const SizedBox(height: 12),
                  const Text(
                    '1. Copy the file ".env.example" in the project root and rename the copy to ".env".\n\n'
                    '2. Open Supabase.com -> your project -> Settings -> API.\n\n'
                    '3. Copy the "Project URL" into SUPABASE_URL, and the "anon public" key into SUPABASE_ANON_KEY.\n\n'
                    '4. Save the file and restart the app.',
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
