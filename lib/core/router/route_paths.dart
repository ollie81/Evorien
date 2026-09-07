abstract final class RoutePaths {
  static const signIn = '/sign-in';
  static const signUp = '/sign-up';
  static const onboarding = '/onboarding';

  static const home = '/';
  static const discover = '/discover';
  static const build = '/build';
  static const buildCreate = '/build/create';
  static const city = '/city';
  static const passport = '/passport';
  static const passportEdit = '/passport/edit';

  static String buildProject(String id) => '/build/project/$id';
  static const buildProjectPattern = '/build/project/:id';
}
