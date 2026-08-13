import 'package:flutter/foundation.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/models/business.dart';
import '../../data/business_repository.dart';

enum BusinessLoadStatus { loading, loaded, error }

class BusinessViewModel extends ChangeNotifier {
  final BusinessRepository _repository;

  BusinessViewModel(this._repository);

  BusinessLoadStatus status = BusinessLoadStatus.loading;
  MyBusiness? business;

  bool openingCheckout = false;
  bool openingPortal = false;
  String? subscriptionError;

  List<ClaimableBusinessPlace> claimResults = [];
  bool searchingClaims = false;
  String? claimingPlaceId;
  String? claimError;

  Future<void> load() async {
    status = BusinessLoadStatus.loading;
    notifyListeners();

    try {
      business = await _repository.getMyBusiness();
      status = BusinessLoadStatus.loaded;
    } catch (_) {
      status = BusinessLoadStatus.error;
    } finally {
      notifyListeners();
    }
  }

  Future<void> startCheckout() async {
    openingCheckout = true;
    subscriptionError = null;
    notifyListeners();

    try {
      final url = await _repository.createCheckoutUrl();
      final launched = await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
      if (!launched) throw Exception('Não foi possível abrir a página de pagamento.');
    } catch (_) {
      subscriptionError = 'Não foi possível abrir a página de pagamento.';
    } finally {
      openingCheckout = false;
      notifyListeners();
    }
  }

  Future<void> openBillingPortal() async {
    openingPortal = true;
    subscriptionError = null;
    notifyListeners();

    try {
      final url = await _repository.createBillingPortalUrl();
      final launched = await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
      if (!launched) throw Exception('Não foi possível abrir o gerenciamento da assinatura.');
    } catch (_) {
      subscriptionError = 'Não foi possível abrir o gerenciamento da assinatura.';
    } finally {
      openingPortal = false;
      notifyListeners();
    }
  }

  Future<void> searchClaimablePlaces(String query) async {
    final trimmed = query.trim();
    if (trimmed.length < 2) return;

    searchingClaims = true;
    claimError = null;
    notifyListeners();

    try {
      claimResults = await _repository.searchClaimablePlaces(trimmed);
    } catch (_) {
      claimError = 'Não foi possível concluir a ação. Tente novamente.';
    } finally {
      searchingClaims = false;
      notifyListeners();
    }
  }

  Future<void> claimPlace(String placeId) async {
    claimingPlaceId = placeId;
    notifyListeners();

    try {
      final claimStatus = await _repository.claimPlace(placeId);
      claimResults = claimResults
          .map((p) => p.id == placeId
              ? p.copyWith(
                  isMine: claimStatus == ClaimStatus.approved,
                  isClaimed: claimStatus == ClaimStatus.approved,
                  myClaimStatus: claimStatus,
                )
              : p)
          .toList();
      await load();
    } catch (_) {
      claimError = 'Não foi possível concluir a ação. Tente novamente.';
    } finally {
      claimingPlaceId = null;
      notifyListeners();
    }
  }

  Future<BusinessPlace?> updatePlace(String placeId, UpdatePlaceProfileInput input) async {
    try {
      final updated = await _repository.updatePlace(placeId, input);
      await load();
      return updated;
    } catch (_) {
      return null;
    }
  }

  Future<PlaceStats?> loadStats(String placeId) async {
    try {
      return await _repository.getPlaceStats(placeId);
    } catch (_) {
      return null;
    }
  }

  Future<List<OpeningHour>> loadHours(String placeId) async {
    try {
      final hours = await _repository.getPlaceHours(placeId);
      if (hours.isEmpty) return _defaultHours();
      final byDay = {for (final h in hours) h.dayOfWeek: h};
      return _defaultHours().map((fallback) => byDay[fallback.dayOfWeek] ?? fallback).toList();
    } catch (_) {
      return _defaultHours();
    }
  }

  Future<bool> saveHours(String placeId, List<OpeningHour> hours) async {
    try {
      await _repository.updatePlaceHours(placeId, hours);
      return true;
    } catch (_) {
      return false;
    }
  }

  List<OpeningHour> _defaultHours() {
    return List.generate(
      7,
      (dayOfWeek) => OpeningHour(
        dayOfWeek: dayOfWeek,
        opensAt: '09:00',
        closesAt: '18:00',
        isClosed: dayOfWeek == 0,
      ),
    );
  }
}
