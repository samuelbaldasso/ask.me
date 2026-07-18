import 'package:dio/dio.dart';

import '../../../core/models/paginated_result.dart';
import '../../../core/models/place.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_exception.dart';

class FavoritesRepository {
  final ApiClient _apiClient;

  FavoritesRepository(this._apiClient);

  Future<PaginatedResult<Place>> list(double lat, double lng) async {
    try {
      final response = await _apiClient.dio.get(
        '/favorites',
        queryParameters: {'lat': lat, 'lng': lng},
      );

      return PaginatedResult.fromJson(
        response.data as Map<String, dynamic>,
        Place.fromJson,
      );
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<void> add(String placeId) async {
    try {
      await _apiClient.dio.post('/favorites', data: {'placeId': placeId});
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<void> remove(String placeId) async {
    try {
      await _apiClient.dio.delete('/favorites/$placeId');
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}
