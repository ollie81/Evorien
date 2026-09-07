import 'package:flutter/material.dart';

/// Evorien's brand palette. Dark-first: the product should feel like a
/// serious, futuristic technology platform — never a generic social feed,
/// crypto casino, or government site.
abstract final class AppColors {
  // Brand
  static const Color brandPrimary = Color(0xFF5B6CFF); // electric indigo
  static const Color brandSecondary = Color(0xFF00D9C0); // signal teal
  static const Color brandViolet = Color(0xFF8B5CFF);

  // Dark theme surfaces
  static const Color darkBackground = Color(0xFF08090D);
  static const Color darkSurface = Color(0xFF101319);
  static const Color darkSurfaceRaised = Color(0xFF171B22);
  static const Color darkBorder = Color(0xFF262B35);
  static const Color darkTextPrimary = Color(0xFFF4F5F7);
  static const Color darkTextSecondary = Color(0xFF9AA1AE);

  // Light theme surfaces
  static const Color lightBackground = Color(0xFFF7F7F9);
  static const Color lightSurface = Color(0xFFFFFFFF);
  static const Color lightSurfaceRaised = Color(0xFFFFFFFF);
  static const Color lightBorder = Color(0xFFE4E5EA);
  static const Color lightTextPrimary = Color(0xFF14161C);
  static const Color lightTextSecondary = Color(0xFF5B6270);

  // Semantic
  static const Color success = Color(0xFF35D08C);
  static const Color warning = Color(0xFFFFB020);
  static const Color danger = Color(0xFFFF5C6A);
  static const Color info = Color(0xFF4DA6FF);

  // The five Evorien pillars each get a stable, recognizable accent used
  // consistently wherever that pillar appears (chips, icons, project cards).
  static const Color pillarTechnology = Color(0xFF5B6CFF);
  static const Color pillarDigitalEconomy = Color(0xFF00D9C0);
  static const Color pillarEntertainment = Color(0xFFFF4FA3);
  static const Color pillarArts = Color(0xFFFFA53E);
  static const Color pillarTourism = Color(0xFF3EC6FF);

  static const Map<String, Color> pillarColors = {
    'TECHNOLOGY': pillarTechnology,
    'DIGITAL_ECONOMY': pillarDigitalEconomy,
    'ENTERTAINMENT': pillarEntertainment,
    'ARTS': pillarArts,
    'TOURISM': pillarTourism,
  };

  static Color pillarColor(String code) => pillarColors[code] ?? brandPrimary;
}
