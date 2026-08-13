import 'category.dart';
import 'subscription_status.dart';

enum ClaimStatus { pending, approved, rejected, revoked }

ClaimStatus _parseClaimStatus(String raw) {
  switch (raw) {
    case 'approved':
      return ClaimStatus.approved;
    case 'rejected':
      return ClaimStatus.rejected;
    case 'revoked':
      return ClaimStatus.revoked;
    default:
      return ClaimStatus.pending;
  }
}

String claimStatusToJson(ClaimStatus status) {
  switch (status) {
    case ClaimStatus.approved:
      return 'approved';
    case ClaimStatus.rejected:
      return 'rejected';
    case ClaimStatus.revoked:
      return 'revoked';
    case ClaimStatus.pending:
      return 'pending';
  }
}

class BusinessPlace {
  final String id;
  final String name;
  final String? description;
  final String address;
  final String city;
  final String? phone;
  final String? website;
  final String? whatsappNumber;
  final String? menuUrl;
  final List<String> photoUrls;
  final bool acceptsPets;
  final bool acceptsCards;
  final bool hasParking;
  final PlaceCategory category;

  const BusinessPlace({
    required this.id,
    required this.name,
    required this.description,
    required this.address,
    required this.city,
    required this.phone,
    required this.website,
    required this.whatsappNumber,
    required this.menuUrl,
    required this.photoUrls,
    required this.acceptsPets,
    required this.acceptsCards,
    required this.hasParking,
    required this.category,
  });

  factory BusinessPlace.fromJson(Map<String, dynamic> json) {
    return BusinessPlace(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      address: json['address'] as String,
      city: json['city'] as String,
      phone: json['phone'] as String?,
      website: json['website'] as String?,
      whatsappNumber: json['whatsappNumber'] as String?,
      menuUrl: json['menuUrl'] as String?,
      photoUrls: (json['photoUrls'] as List<dynamic>? ?? []).map((e) => e as String).toList(),
      acceptsPets: json['acceptsPets'] as bool? ?? false,
      acceptsCards: json['acceptsCards'] as bool? ?? false,
      hasParking: json['hasParking'] as bool? ?? false,
      category: PlaceCategory.fromJson(json['category'] as Map<String, dynamic>),
    );
  }
}

class ClaimableBusinessPlace extends BusinessPlace {
  final bool isClaimed;
  final bool isMine;
  final ClaimStatus? myClaimStatus;

  const ClaimableBusinessPlace({
    required super.id,
    required super.name,
    required super.description,
    required super.address,
    required super.city,
    required super.phone,
    required super.website,
    required super.whatsappNumber,
    required super.menuUrl,
    required super.photoUrls,
    required super.acceptsPets,
    required super.acceptsCards,
    required super.hasParking,
    required super.category,
    required this.isClaimed,
    required this.isMine,
    required this.myClaimStatus,
  });

  factory ClaimableBusinessPlace.fromJson(Map<String, dynamic> json) {
    final base = BusinessPlace.fromJson(json);
    final rawStatus = json['myClaimStatus'] as String?;
    return ClaimableBusinessPlace(
      id: base.id,
      name: base.name,
      description: base.description,
      address: base.address,
      city: base.city,
      phone: base.phone,
      website: base.website,
      whatsappNumber: base.whatsappNumber,
      menuUrl: base.menuUrl,
      photoUrls: base.photoUrls,
      acceptsPets: base.acceptsPets,
      acceptsCards: base.acceptsCards,
      hasParking: base.hasParking,
      category: base.category,
      isClaimed: json['isClaimed'] as bool? ?? false,
      isMine: json['isMine'] as bool? ?? false,
      myClaimStatus: rawStatus != null ? _parseClaimStatus(rawStatus) : null,
    );
  }

  ClaimableBusinessPlace copyWith({
    bool? isClaimed,
    bool? isMine,
    ClaimStatus? myClaimStatus,
  }) {
    return ClaimableBusinessPlace(
      id: id,
      name: name,
      description: description,
      address: address,
      city: city,
      phone: phone,
      website: website,
      whatsappNumber: whatsappNumber,
      menuUrl: menuUrl,
      photoUrls: photoUrls,
      acceptsPets: acceptsPets,
      acceptsCards: acceptsCards,
      hasParking: hasParking,
      category: category,
      isClaimed: isClaimed ?? this.isClaimed,
      isMine: isMine ?? this.isMine,
      myClaimStatus: myClaimStatus ?? this.myClaimStatus,
    );
  }
}

class PlaceSummary {
  final String id;
  final String name;
  final String address;
  final String city;

  const PlaceSummary({
    required this.id,
    required this.name,
    required this.address,
    required this.city,
  });

  factory PlaceSummary.fromJson(Map<String, dynamic> json) {
    return PlaceSummary(
      id: json['id'] as String,
      name: json['name'] as String,
      address: json['address'] as String,
      city: json['city'] as String,
    );
  }
}

class PendingClaim {
  final String id;
  final ClaimStatus status;
  final DateTime createdAt;
  final PlaceSummary place;

  const PendingClaim({
    required this.id,
    required this.status,
    required this.createdAt,
    required this.place,
  });

  factory PendingClaim.fromJson(Map<String, dynamic> json) {
    return PendingClaim(
      id: json['id'] as String,
      status: _parseClaimStatus(json['status'] as String),
      createdAt: DateTime.parse(json['createdAt'] as String),
      place: PlaceSummary.fromJson(json['place'] as Map<String, dynamic>),
    );
  }
}

class MyBusiness {
  final List<BusinessPlace> places;
  final SubscriptionStatus subscription;
  final List<PendingClaim> pendingClaims;

  const MyBusiness({
    required this.places,
    required this.subscription,
    required this.pendingClaims,
  });

  factory MyBusiness.fromJson(Map<String, dynamic> json) {
    return MyBusiness(
      places: (json['places'] as List<dynamic>)
          .map((e) => BusinessPlace.fromJson(e as Map<String, dynamic>))
          .toList(),
      subscription: SubscriptionStatus.fromJson(json['subscription'] as Map<String, dynamic>),
      pendingClaims: (json['pendingClaims'] as List<dynamic>)
          .map((e) => PendingClaim.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

class AdminClaimUser {
  final String id;
  final String? name;
  final String email;

  const AdminClaimUser({required this.id, required this.name, required this.email});

  factory AdminClaimUser.fromJson(Map<String, dynamic> json) {
    return AdminClaimUser(
      id: json['id'] as String,
      name: json['name'] as String?,
      email: json['email'] as String,
    );
  }
}

class AdminClaim {
  final String id;
  final DateTime createdAt;
  final AdminClaimUser user;
  final PlaceSummary place;

  const AdminClaim({
    required this.id,
    required this.createdAt,
    required this.user,
    required this.place,
  });

  factory AdminClaim.fromJson(Map<String, dynamic> json) {
    return AdminClaim(
      id: json['id'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
      user: AdminClaimUser.fromJson(json['user'] as Map<String, dynamic>),
      place: PlaceSummary.fromJson(json['place'] as Map<String, dynamic>),
    );
  }
}

class ClickCounts {
  final int phoneClick;
  final int whatsappClick;
  final int websiteClick;
  final int routeClick;
  final int menuClick;

  const ClickCounts({
    required this.phoneClick,
    required this.whatsappClick,
    required this.websiteClick,
    required this.routeClick,
    required this.menuClick,
  });

  factory ClickCounts.fromJson(Map<String, dynamic> json) {
    return ClickCounts(
      phoneClick: json['phone_click'] as int? ?? 0,
      whatsappClick: json['whatsapp_click'] as int? ?? 0,
      websiteClick: json['website_click'] as int? ?? 0,
      routeClick: json['route_click'] as int? ?? 0,
      menuClick: json['menu_click'] as int? ?? 0,
    );
  }
}

class PlaceStats {
  final int windowDays;
  final int viewsTotal;
  final int clicksTotal;
  final int viewsLast30Days;
  final int clicksLast30Days;
  final ClickCounts clicksByTypeLast30Days;

  const PlaceStats({
    required this.windowDays,
    required this.viewsTotal,
    required this.clicksTotal,
    required this.viewsLast30Days,
    required this.clicksLast30Days,
    required this.clicksByTypeLast30Days,
  });

  factory PlaceStats.fromJson(Map<String, dynamic> json) {
    return PlaceStats(
      windowDays: json['windowDays'] as int,
      viewsTotal: json['viewsTotal'] as int,
      clicksTotal: json['clicksTotal'] as int,
      viewsLast30Days: json['viewsLast30Days'] as int,
      clicksLast30Days: json['clicksLast30Days'] as int,
      clicksByTypeLast30Days:
          ClickCounts.fromJson(json['clicksByTypeLast30Days'] as Map<String, dynamic>),
    );
  }
}

class UpdatePlaceProfileInput {
  final String? description;
  final String? phone;
  final String? website;
  final String? whatsappNumber;
  final String? menuUrl;
  final List<String>? photoUrls;
  final bool? acceptsPets;
  final bool? acceptsCards;
  final bool? hasParking;

  const UpdatePlaceProfileInput({
    this.description,
    this.phone,
    this.website,
    this.whatsappNumber,
    this.menuUrl,
    this.photoUrls,
    this.acceptsPets,
    this.acceptsCards,
    this.hasParking,
  });

  Map<String, dynamic> toJson() {
    return {
      if (description != null) 'description': description,
      if (phone != null) 'phone': phone,
      if (website != null) 'website': website,
      if (whatsappNumber != null) 'whatsappNumber': whatsappNumber,
      if (menuUrl != null) 'menuUrl': menuUrl,
      if (photoUrls != null) 'photoUrls': photoUrls,
      if (acceptsPets != null) 'acceptsPets': acceptsPets,
      if (acceptsCards != null) 'acceptsCards': acceptsCards,
      if (hasParking != null) 'hasParking': hasParking,
    };
  }
}

/// dayOfWeek: 0=domingo, 6=sábado — mesma convenção do backend/web.
class OpeningHour {
  final int dayOfWeek;
  final String opensAt;
  final String closesAt;
  final bool isClosed;

  const OpeningHour({
    required this.dayOfWeek,
    required this.opensAt,
    required this.closesAt,
    required this.isClosed,
  });

  factory OpeningHour.fromJson(Map<String, dynamic> json) {
    return OpeningHour(
      dayOfWeek: json['dayOfWeek'] as int,
      opensAt: json['opensAt'] as String,
      closesAt: json['closesAt'] as String,
      isClosed: json['isClosed'] as bool,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'dayOfWeek': dayOfWeek,
      'opensAt': opensAt,
      'closesAt': closesAt,
      'isClosed': isClosed,
    };
  }

  OpeningHour copyWith({String? opensAt, String? closesAt, bool? isClosed}) {
    return OpeningHour(
      dayOfWeek: dayOfWeek,
      opensAt: opensAt ?? this.opensAt,
      closesAt: closesAt ?? this.closesAt,
      isClosed: isClosed ?? this.isClosed,
    );
  }
}

const weekdayLabels = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
