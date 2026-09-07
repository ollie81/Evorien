import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:evorien/core/config/env.dart';
import 'package:evorien/core/theme/app_theme.dart';
import 'package:evorien/core/widgets/empty_state.dart';
import 'package:evorien/core/widgets/stat_tile.dart';

void main() {
  group('Env.isConfigured', () {
    test('is false for placeholder credentials', () {
      dotenv.loadFromString(
        envString: 'SUPABASE_URL=https://placeholder.supabase.co\nSUPABASE_ANON_KEY=placeholder-anon-key-not-a-real-secret',
      );
      expect(Env.isConfigured, isFalse);
    });

    test('is true once real-looking credentials are set', () {
      dotenv.loadFromString(
        envString: 'SUPABASE_URL=https://abcdefghijk.supabase.co\nSUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
      );
      expect(Env.isConfigured, isTrue);
    });

    test('is false when a value is missing', () {
      dotenv.loadFromString(envString: 'SUPABASE_URL=https://abcdefghijk.supabase.co', isOptional: true);
      expect(Env.isConfigured, isFalse);
    });
  });

  testWidgets('StatTile renders its value and label', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light,
        home: const Scaffold(body: StatTile(value: '237', label: 'Members')),
      ),
    );

    expect(find.text('237'), findsOneWidget);
    expect(find.text('Members'), findsOneWidget);
  });

  testWidgets('EmptyState renders title, message and action', (tester) async {
    var tapped = false;
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light,
        home: Scaffold(
          body: EmptyState(
            icon: Icons.construction_outlined,
            title: 'No projects yet',
            message: 'Be the first to start building.',
            actionLabel: 'Create a project',
            onAction: () => tapped = true,
          ),
        ),
      ),
    );

    expect(find.text('No projects yet'), findsOneWidget);
    expect(find.text('Be the first to start building.'), findsOneWidget);

    await tester.tap(find.text('Create a project'));
    await tester.pump();
    expect(tapped, isTrue);
  });
}
