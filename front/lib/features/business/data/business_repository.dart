import 'package:dio/dio.dart';

import '../../../core/models/business.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_exception.dart';

class BusinessRepository {
  final ApiClient _apiClient;

  BusinessRepository(this._apiClient);

  Future<List<ClaimableBusinessPlace>> searchClaimablePlaces(String query) async {
    try {
      final response = await _apiClient.dio.get('/business/places/search', queryParameters: {'q': query});
      final data = (response.data as Map<String, dynamic>)['data'] as List<dynamic>;
      return data.map((e) => ClaimableBusinessPlace.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<ClaimStatus> claimPlace(String placeId) async {
    try {
      final response = await _apiClient.dio.post('/business/claim', data: {'placeId': placeId});
      final raw = (response.data as Map<String, dynamic>)['status'] as String;
      return ClaimStatus.values.firstWhere(
        (s) => claimStatusToJson(s) == raw,
        orElse: () => ClaimStatus.pending,
      );
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<MyBusiness> getMyBusiness() async {
    try {
      final response = await _apiClient.dio.get('/business/me');
      return MyBusiness.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<BusinessPlace> updatePlace(String placeId, UpdatePlaceProfileInput input) async {
    try {
      final response = await _apiClient.dio.patch('/business/places/$placeId', data: input.toJson());
      return BusinessPlace.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<PlaceStats> getPlaceStats(String placeId) async {
    try {
      final response = await _apiClient.dio.get('/business/places/$placeId/stats');
      return PlaceStats.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<List<OpeningHour>> getPlaceHours(String placeId) async {
    try {
      final response = await _apiClient.dio.get('/business/places/$placeId/hours');
      final data = (response.data as Map<String, dynamic>)['data'] as List<dynamic>;
      return data.map((e) => OpeningHour.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<List<OpeningHour>> updatePlaceHours(String placeId, List<OpeningHour> hours) async {
    try {
      final response = await _apiClient.dio.put(
        '/business/places/$placeId/hours',
        data: {'hours': hours.map((h) => h.toJson()).toList()},
      );
      final data = (response.data as Map<String, dynamic>)['data'] as List<dynamic>;
      return data.map((e) => OpeningHour.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// Reaproveita a mesma assinatura Stripe do app (/subscriptions/*):
  /// no dashboard web isso é a assinatura de "destaque" do lojista.
  Future<String> createCheckoutUrl() async {
    try {
      final response = await _apiClient.dio.post('/subscriptions/checkout');
      return (response.data as Map<String, dynamic>)['url'] as String;
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<String> createBillingPortalUrl() async {
    try {
      final response = await _apiClient.dio.post('/subscriptions/portal');
      return (response.data as Map<String, dynamic>)['url'] as String;
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}
