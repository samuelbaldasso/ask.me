import 'package:flutter/foundation.dart';

import '../../../../core/models/place.dart';
import '../../data/favorites_repository.dart';

enum FavoritesStatus { idle, loading, loaded, error }

/// Favoritar é uma feature gratuita (só exige login, não assinatura) — é o
/// hook de retenção básico do app: dá motivo pra abrir de novo amanhã.
class FavoritesViewModel extends ChangeNotifier {
  final FavoritesRepository _repository;

  FavoritesViewModel(this._repository);

  FavoritesStatus status = FavoritesStatus.idle;
  List<Place> places = [];
  Set<String> favoritedIds = {};
  String? errorMessage;

  bool isFavorite(String placeId) => favoritedIds.contains(placeId);

  Future<void> load(double lat, double lng) async {
    status = FavoritesStatus.loading;
    errorMessage = null;
    notifyListeners();

    try {
      final result = await _repository.list(lat, lng);
      places = result.data;
      favoritedIds = places.map((p) => p.id).toSet();
      status = FavoritesStatus.loaded;
    } catch (e) {
      errorMessage = e.toString();
      status = FavoritesStatus.error;
    }
    notifyListeners();
  }

  /// Alterna o favorito com atualização otimista — desfaz se a chamada falhar.
  Future<void> toggle(String placeId) async {
    final wasFavorite = favoritedIds.contains(placeId);

    if (wasFavorite) {
      favoritedIds.remove(placeId);
    } else {
      favoritedIds.add(placeId);
    }
    notifyListeners();

    try {
      if (wasFavorite) {
        await _repository.remove(placeId);
      } else {
        await _repository.add(placeId);
      }
    } catch (e) {
      if (wasFavorite) {
        favoritedIds.add(placeId);
      } else {
        favoritedIds.remove(placeId);
      }
      errorMessage = e.toString();
      notifyListeners();
    }
  }

  void reset() {
    status = FavoritesStatus.idle;
    places = [];
    favoritedIds = {};
    notifyListeners();
  }
}
