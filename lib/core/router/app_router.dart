import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/presentation/sign_in_screen.dart';
import '../../features/auth/presentation/sign_up_screen.dart';
import '../../features/build/presentation/build_hub_screen.dart';
import '../../features/build/presentation/create_project_screen.dart';
import '../../features/build/presentation/project_detail_screen.dart';
import '../../features/city/presentation/city_hub_screen.dart';
import '../../features/discover/presentation/discover_screen.dart';
import '../../features/home/presentation/home_screen.dart';
import '../../features/onboarding/presentation/onboarding_flow_screen.dart';
import '../../features/passport/data/profile_repository.dart';
import '../../features/passport/presentation/edit_profile_screen.dart';
import '../../features/passport/presentation/passport_screen.dart';
import '../../features/shell/presentation/app_shell.dart';
import '../providers/supabase_providers.dart';
import 'route_paths.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final refresh = GoRouterRefreshStream(ref.watch(supabaseClientProvider).auth.onAuthStateChange);
  ref.onDispose(refresh.dispose);

  return GoRouter(
    initialLocation: RoutePaths.home,
    refreshListenable: refresh,
    redirect: (context, state) async {
      final container = ProviderScope.containerOf(context);
      final session = container.read(supabaseClientProvider).auth.currentSession;
      final onAuthPage = state.matchedLocation == RoutePaths.signIn || state.matchedLocation == RoutePaths.signUp;

      if (session == null) {
        return onAuthPage ? null : RoutePaths.signIn;
      }

      if (state.matchedLocation == RoutePaths.onboarding) {
        return null;
      }

      final profile = await container.read(myProfileProvider.future);
      final onboardingCompleted = profile?.onboardingCompleted ?? false;

      if (!onboardingCompleted) {
        return RoutePaths.onboarding;
      }

      if (onAuthPage) {
        return RoutePaths.home;
      }

      return null;
    },
    routes: [
      GoRoute(path: RoutePaths.signIn, builder: (context, state) => const SignInScreen()),
      GoRoute(path: RoutePaths.signUp, builder: (context, state) => const SignUpScreen()),
      GoRoute(path: RoutePaths.onboarding, builder: (context, state) => const OnboardingFlowScreen()),
      GoRoute(
        path: RoutePaths.buildCreate,
        builder: (context, state) => const CreateProjectScreen(),
      ),
      GoRoute(
        path: RoutePaths.buildProjectPattern,
        builder: (context, state) => ProjectDetailScreen(projectId: state.pathParameters['id']!),
      ),
      GoRoute(path: RoutePaths.passportEdit, builder: (context, state) => const EditProfileScreen()),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) => AppShell(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(routes: [GoRoute(path: RoutePaths.home, builder: (context, state) => const HomeScreen())]),
          StatefulShellBranch(
            routes: [GoRoute(path: RoutePaths.discover, builder: (context, state) => const DiscoverScreen())],
          ),
          StatefulShellBranch(routes: [GoRoute(path: RoutePaths.build, builder: (context, state) => const BuildHubScreen())]),
          StatefulShellBranch(routes: [GoRoute(path: RoutePaths.city, builder: (context, state) => const CityHubScreen())]),
          StatefulShellBranch(
            routes: [GoRoute(path: RoutePaths.passport, builder: (context, state) => const PassportScreen())],
          ),
        ],
      ),
    ],
  );
});

/// Bridges a Stream (Supabase's auth changes) to a Listenable so go_router
/// re-evaluates its `redirect` callback whenever auth state changes.
class GoRouterRefreshStream extends ChangeNotifier {
  GoRouterRefreshStream(Stream<dynamic> stream) {
    notifyListeners();
    _subscription = stream.asBroadcastStream().listen((_) => notifyListeners());
  }

  late final StreamSubscription<dynamic> _subscription;

  @override
  void dispose() {
    _subscription.cancel();
    super.dispose();
  }
}
