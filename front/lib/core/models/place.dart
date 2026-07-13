import 'category.dart';

class Place {
  final String id;
  final String name;
  final String? description;
  final String address;
  final String city;
  final double lat;
  final double lng;
  final double distanceMeters;
  final PlaceCategory category;
  final bool acceptsPets;
  final bool acceptsCards;
  final bool hasParking;
  final String? phone;
  final String? website;
  final bool? isOpenNow;

  const Place({
    required this.id,
    required this.name,
    required this.description,
    required this.address,
    required this.city,
    required this.lat,
    required this.lng,
    required this.distanceMeters,
    required this.category,
    required this.acceptsPets,
    required this.acceptsCards,
    required this.hasParking,
    required this.phone,
    required this.website,
    required this.isOpenNow,
  });

  factory Place.fromJson(Map<String, dynamic> json) {
    return Place(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      address: json['address'] as String,
      city: json['city'] as String,
      lat: (json['lat'] as num).toDouble(),
      lng: (json['lng'] as num).toDouble(),
      distanceMeters: (json['distanceMeters'] as num).toDouble(),
      category: PlaceCategory.fromJson(json['category'] as Map<String, dynamic>),
      acceptsPets: json['acceptsPets'] as bool,
      acceptsCards: json['acceptsCards'] as bool,
      hasParking: json['hasParking'] as bool,
      phone: json['phone'] as String?,
      website: json['website'] as String?,
      isOpenNow: json['isOpenNow'] as bool?,
    );
  }

  String get distanceLabel {
    if (distanceMeters < 1000) {
      return '${distanceMeters.round()} m';
    }
    return '${(distanceMeters / 1000).toStringAsFixed(1)} km';
  }
}
