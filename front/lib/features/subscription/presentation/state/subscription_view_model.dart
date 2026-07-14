import 'package:flutter/foundation.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/models/subscription_status.dart';
import '../../data/subscription_repository.dart';

enum SubscriptionViewStatus { idle, loadingStatus, openingCheckout, loaded, error }

/// Assinatura via cartão de crédito (Stripe Subscriptions, renovação
/// automática). Pix não é suportado nesta versão: Stripe não faz débito
/// automático recorrente via Pix — fica registrado como dívida técnica
/// para revisitar na Fase 6 (ver docs/plan.md e schema.prisma).
class SubscriptionViewModel extends ChangeNotifier {
  final SubscriptionRepository _repository;

  SubscriptionViewModel(this._repository);

  SubscriptionViewStatus status = SubscriptionViewStatus.idle;
  SubscriptionStatus? subscription;
  String? errorMessage;

  bool get isActive => subscription?.isActive ?? false;

  Future<void> loadStatus() async {
    status = SubscriptionViewStatus.loadingStatus;
    notifyListeners();

    try {
      subscription = await _repository.getStatus();
      status = SubscriptionViewStatus.loaded;
    } catch (e) {
      errorMessage = e.toString();
      status = SubscriptionViewStatus.error;
    } finally {
      notifyListeners();
    }
  }

  /// Abre o Stripe Checkout no navegador externo. Como o app não escuta
  /// deep link de retorno nesta versão, o usuário volta manualmente ao
  /// app e toca em "Atualizar" (loadStatus) para confirmar o pagamento.
  Future<void> startCheckout() async {
    status = SubscriptionViewStatus.openingCheckout;
    errorMessage = null;
    notifyListeners();

    try {
      final url = await _repository.createCheckoutUrl();
      final launched = await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);

      if (!launched) {
        throw Exception('Não foi possível abrir a página de pagamento.');
      }

      status = SubscriptionViewStatus.idle;
    } catch (e) {
      errorMessage = e.toString();
      status = SubscriptionViewStatus.error;
    } finally {
      notifyListeners();
    }
  }
}
