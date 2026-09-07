import 'package:flutter/material.dart';

import '../constants/app_pillars.dart';
import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';

class PillarChip extends StatelessWidget {
  const PillarChip({super.key, required this.code, this.dense = false});

  final String code;
  final bool dense;

  @override
  Widget build(BuildContext context) {
    final color = AppColors.pillarColor(code);
    final label = EvorienPillar.byCode(code)?.name ?? code;
    return Container(
      padding: EdgeInsets.symmetric(horizontal: dense ? AppSpacing.sm : AppSpacing.md, vertical: AppSpacing.xs),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(color: color, fontWeight: FontWeight.w600),
      ),
    );
  }
}
