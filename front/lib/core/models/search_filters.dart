class SearchFilters {
  final double lat;
  final double lng;
  final int radiusMeters;
  final String? categorySlug;
  final bool openNow;
  final bool acceptsPets;
  final int limit;
  final int offset;

  const SearchFilters({
    required this.lat,
    required this.lng,
    this.radiusMeters = 5000,
    this.categorySlug,
    this.openNow = false,
    this.acceptsPets = false,
    this.limit = 20,
    this.offset = 0,
  });

  SearchFilters copyWith({
    double? lat,
    double? lng,
    int? radiusMeters,
    String? categorySlug,
    bool? clearCategory,
    bool? openNow,
    bool? acceptsPets,
    int? limit,
    int? offset,
  }) {
    return SearchFilters(
      lat: lat ?? this.lat,
      lng: lng ?? this.lng,
      radiusMeters: radiusMeters ?? this.radiusMeters,
      categorySlug: clearCategory == true ? null : (categorySlug ?? this.categorySlug),
      openNow: openNow ?? this.openNow,
      acceptsPets: acceptsPets ?? this.acceptsPets,
      limit: limit ?? this.limit,
      offset: offset ?? this.offset,
    );
  }

  Map<String, dynamic> toQueryParams() {
    return {
      'lat': lat,
      'lng': lng,
      'radius': radiusMeters,
      if (categorySlug != null) 'category': categorySlug,
      if (openNow) 'openNow': 'true',
      if (acceptsPets) 'acceptsPets': 'true',
      'limit': limit,
      'offset': offset,
    };
  }
}
