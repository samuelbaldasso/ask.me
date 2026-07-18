import 'package:dio/dio.dart';

import '../../../core/models/subscription_status.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_exception.dart';

class SubscriptionRepository {
  final ApiClient _apiClient;

  SubscriptionRepository(this._apiClient);

  /// Cria uma Stripe Checkout Session (assinatura mensal, cartão de
  /// crédito) e retorna a URL hospedada pela Stripe para abrir no navegador.
  Future<String> createCheckoutUrl() async {
    try {
      final response = await _apiClient.dio.post('/subscriptions/checkout');
      return (response.data as Map<String, dynamic>)['url'] as String;
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<SubscriptionStatus> getStatus() async {
    try {
      final response = await _apiClient.dio.get('/subscriptions/me');
      return SubscriptionStatus.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// Cria uma Stripe Billing Portal session (cancelar, trocar cartão, ver
  /// faturas) e retorna a URL hospedada pela Stripe para abrir no navegador.
  Future<String> createBillingPortalUrl() async {
    try {
      final response = await _apiClient.dio.post('/subscriptions/portal');
      return (response.data as Map<String, dynamic>)['url'] as String;
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}
