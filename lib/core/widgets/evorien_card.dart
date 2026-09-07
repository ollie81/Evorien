import 'package:flutter/material.dart';

import '../theme/app_spacing.dart';

/// The base surface used everywhere a "beautiful card" is called for:
/// project tiles, opportunity rows, passport sections, city phase cards.
class EvorienCard extends StatelessWidget {
  const EvorienCard({super.key, required this.child, this.onTap, this.padding});

  final Widget child;
  final VoidCallback? onTap;
  final EdgeInsetsGeometry? padding;

  @override
  Widget build(BuildContext context) {
    final card = Card(
      child: Padding(
        padding: padding ?? const EdgeInsets.all(AppSpacing.md),
        child: child,
      ),
    );

    if (onTap == null) return card;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        onTap: onTap,
        child: card,
      ),
    );
  }
}
