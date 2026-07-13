class PlaceCategory {
  final String slug;
  final String label;

  const PlaceCategory({required this.slug, required this.label});

  factory PlaceCategory.fromJson(Map<String, dynamic> json) {
    return PlaceCategory(
      slug: json['slug'] as String,
      label: json['label'] as String,
    );
  }
}
