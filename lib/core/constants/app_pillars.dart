/// The five long-term Evorien pillars. Codes must match `public.pillars.code`
/// in the database exactly.
class EvorienPillar {
  final String code;
  final String name;
  final String description;

  const EvorienPillar(this.code, this.name, this.description);

  static const technology = EvorienPillar(
    'TECHNOLOGY',
    'Technology',
    'AI, software, robotics, infrastructure, startups and innovation.',
  );
  static const digitalEconomy = EvorienPillar(
    'DIGITAL_ECONOMY',
    'Digital Economy',
    'Cryptocurrency, blockchain and digital economic experimentation.',
  );
  static const entertainment = EvorienPillar(
    'ENTERTAINMENT',
    'Entertainment',
    'Film, video, gaming, events, music, experiences.',
  );
  static const arts = EvorienPillar(
    'ARTS',
    'Arts',
    'Artists, designers, musicians, writers, filmmakers, architects.',
  );
  static const tourism = EvorienPillar(
    'TOURISM',
    'Tourism',
    'Hospitality, experiences, travel, events, culture, future destinations.',
  );

  static const all = <EvorienPillar>[technology, digitalEconomy, entertainment, arts, tourism];

  static EvorienPillar? byCode(String? code) {
    if (code == null) return null;
    for (final pillar in all) {
      if (pillar.code == code) return pillar;
    }
    return null;
  }
}
