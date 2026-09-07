import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Space Grotesk for headlines gives Evorien a distinctive, confident,
/// slightly technical voice; Inter carries body text because it stays
/// highly readable at small sizes. Two families, one clear hierarchy.
abstract final class AppTypography {
  static TextTheme textTheme(Color primary, Color secondary) {
    final base = GoogleFonts.interTextTheme();
    final display = GoogleFonts.spaceGroteskTextTheme();

    return base
        .copyWith(
          displayLarge: display.displayLarge?.copyWith(color: primary, fontWeight: FontWeight.w600),
          displayMedium: display.displayMedium?.copyWith(color: primary, fontWeight: FontWeight.w600),
          displaySmall: display.displaySmall?.copyWith(color: primary, fontWeight: FontWeight.w600),
          headlineLarge: display.headlineLarge?.copyWith(color: primary, fontWeight: FontWeight.w600),
          headlineMedium: display.headlineMedium?.copyWith(color: primary, fontWeight: FontWeight.w600),
          headlineSmall: display.headlineSmall?.copyWith(color: primary, fontWeight: FontWeight.w600),
          titleLarge: display.titleLarge?.copyWith(color: primary, fontWeight: FontWeight.w600),
          titleMedium: base.titleMedium?.copyWith(color: primary, fontWeight: FontWeight.w600),
          titleSmall: base.titleSmall?.copyWith(color: primary, fontWeight: FontWeight.w600),
          bodyLarge: base.bodyLarge?.copyWith(color: primary),
          bodyMedium: base.bodyMedium?.copyWith(color: primary),
          bodySmall: base.bodySmall?.copyWith(color: secondary),
          labelLarge: base.labelLarge?.copyWith(color: primary, fontWeight: FontWeight.w600),
          labelMedium: base.labelMedium?.copyWith(color: secondary, fontWeight: FontWeight.w500),
          labelSmall: base.labelSmall?.copyWith(color: secondary, fontWeight: FontWeight.w500),
        )
        .apply(bodyColor: primary, displayColor: primary);
  }
}
