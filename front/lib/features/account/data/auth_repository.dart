import 'package:dio/dio.dart';

import '../../../core/models/user.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_exception.dart';

class AuthRepository {
  final ApiClient _apiClient;

  AuthRepository(this._apiClient);

  /// Troca o ID token do Google Sign-In por um JWT próprio da aplicação.
  Future<({String token, AppUser user})> loginWithGoogle(String idToken) async {
    try {
      final response = await _apiClient.dio.post(
        '/auth/google',
        data: {'idToken': idToken},
      );

      final data = response.data as Map<String, dynamic>;
      return (
        token: data['token'] as String,
        user: AppUser.fromJson(data['user'] as Map<String, dynamic>),
      );
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}
