import 'package:dio/dio.dart';

import '../../../core/models/paginated_result.dart';
import '../../../core/models/place.dart';
import '../../../core/models/search_filters.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_exception.dart';

class PlacesRepository {
  final ApiClient _apiClient;

  PlacesRepository(this._apiClient);

  Future<PaginatedResult<Place>> search(SearchFilters filters) async {
    try {
      final response = await _apiClient.dio.get(
        '/places',
        queryParameters: filters.toQueryParams(),
      );

      return PaginatedResult.fromJson(
        response.data as Map<String, dynamic>,
        Place.fromJson,
      );
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// Registra um evento de interação com o estabelecimento (visualização ou
  /// clique). Nunca deve bloquear a navegação do usuário se falhar.
  Future<void> trackEvent(String placeId, String type) async {
    try {
      await _apiClient.dio.post('/places/$placeId/track', data: {'type': type});
    } on DioException {
      // Silenciosamente ignorado — analytics não pode travar a UI.
    }
  }
}
