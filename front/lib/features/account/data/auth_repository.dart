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

  /// Busca os dados do usuário logado a partir do JWT salvo — usado para
  /// reidratar a sessão quando o app reabre (ver AuthViewModel.restoreSession).
  Future<AppUser> fetchCurrentUser() async {
    try {
      final response = await _apiClient.dio.get('/auth/me');
      final data = response.data as Map<String, dynamic>;
      return AppUser.fromJson(data['user'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}
