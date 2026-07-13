import 'package:dio/dio.dart';

import '../config/app_config.dart';

/// Wrapper fino sobre Dio, centraliza baseUrl e timeouts.
///
/// Toda chamada de rede tem timeout explícito — nenhuma requisição
/// deve travar a UI indefinidamente se o backend não responder.
class ApiClient {
  final Dio dio;

  ApiClient()
      : dio = Dio(
          BaseOptions(
            baseUrl: AppConfig.apiBaseUrl,
            connectTimeout: const Duration(seconds: 8),
            receiveTimeout: const Duration(seconds: 8),
          ),
        );
}
