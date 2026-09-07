import 'package:flutter_dotenv/flutter_dotenv.dart';

/// Reads Supabase configuration from the bundled `.env` file.
///
/// Only ever holds the Supabase **anon** (public) key. The service role key
/// must never appear in this app — see `.env.example` for details.
abstract final class Env {
  static String get supabaseUrl => dotenv.maybeGet('SUPABASE_URL')?.trim() ?? '';
  static String get supabaseAnonKey => dotenv.maybeGet('SUPABASE_ANON_KEY')?.trim() ?? '';

  /// False until a real founder has copied `.env.example` to `.env` and
  /// filled in their own project's values. Used to show a friendly setup
  /// screen instead of a confusing crash on first run.
  static bool get isConfigured {
    if (supabaseUrl.isEmpty || supabaseAnonKey.isEmpty) return false;
    if (!supabaseUrl.startsWith('http')) return false;
    const placeholderMarkers = ['your-project-ref', 'your-anon-public-key', 'placeholder'];
    return !placeholderMarkers.any(
      (marker) => supabaseUrl.contains(marker) || supabaseAnonKey.contains(marker),
    );
  }
}
