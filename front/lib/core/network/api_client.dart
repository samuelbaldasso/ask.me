import 'package:dio/dio.dart';

import '../config/app_config.dart';

/// Wrapper fino sobre Dio, centraliza baseUrl e timeouts.
///
/// Toda chamada de rede tem timeout explícito — nenhuma requisição
/// deve travar a UI indefinidamente se o backend não responder.
class ApiClient {
  final Dio dio;

  /// Token JWT da aplicação. Setado pelo AuthService após login/restauração
  /// de sessão; anexado automaticamente via interceptor nas requisições que
  /// exigem autenticação (ex: /subscriptions/*). null quando deslogado.
  String? authToken;

  ApiClient()
      : dio = Dio(
          BaseOptions(
            baseUrl: AppConfig.apiBaseUrl,
            connectTimeout: const Duration(seconds: 8),
            receiveTimeout: const Duration(seconds: 8),
          ),
        ) {
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          if (authToken != null) {
            options.headers['Authorization'] = 'Bearer $authToken';
          }
          handler.next(options);
        },
      ),
    );
  }
}
