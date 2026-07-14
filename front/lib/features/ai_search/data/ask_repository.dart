import 'package:dio/dio.dart';

import '../../../core/models/ask_result.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_exception.dart';

class AskRepository {
  final ApiClient _apiClient;

  AskRepository(this._apiClient);

  Future<AskResult> ask({
    required String query,
    required double lat,
    required double lng,
  }) async {
    try {
      final response = await _apiClient.dio.post(
        '/ask',
        data: {'query': query, 'lat': lat, 'lng': lng},
      );

      return AskResult.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}
