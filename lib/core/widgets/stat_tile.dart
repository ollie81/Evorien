import 'package:flutter/material.dart';

import '../theme/app_spacing.dart';

/// A single "Evorien Progress" counter — always fed by a live query,
/// never a hard-coded number. Real, honest traction only.
class StatTile extends StatelessWidget {
  const StatTile({super.key, required this.value, required this.label});

  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(value, style: theme.textTheme.headlineSmall),
        const SizedBox(height: AppSpacing.xs / 2),
        Text(label, style: theme.textTheme.bodySmall),
      ],
    );
  }
}
