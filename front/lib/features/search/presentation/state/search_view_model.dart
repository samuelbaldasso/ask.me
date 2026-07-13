import 'package:flutter/foundation.dart';

import '../../../../core/models/place.dart';
import '../../../../core/models/search_filters.dart';
import '../../../../core/services/location_service.dart';
import '../../data/places_repository.dart';

enum SearchStatus { idle, loadingLocation, loading, loaded, empty, error }

/// ViewModel da tela de busca — mantém estado de filtros, resultados e
/// status de carregamento, seguindo o padrão MVVM usado no restante do app.
class SearchViewModel extends ChangeNotifier {
  final PlacesRepository _repository;
  final LocationService _locationService;

  SearchViewModel(this._repository, this._locationService);

  SearchStatus status = SearchStatus.idle;
  String? errorMessage;

  SearchFilters? filters;
  List<Place> results = [];
  int total = 0;

  static const List<Map<String, String>> availableCategories = [
    {'slug': 'restaurante', 'label': 'Restaurante'},
    {'slug': 'bar', 'label': 'Bar'},
    {'slug': 'cafe', 'label': 'Café'},
    {'slug': 'mercado', 'label': 'Mercado'},
    {'slug': 'farmacia', 'label': 'Farmácia'},
  ];

  Future<void> loadInitial() async {
    status = SearchStatus.loadingLocation;
    errorMessage = null;
    notifyListeners();

    try {
      final position = await _locationService.getCurrentPosition();
      filters = SearchFilters(lat: position.latitude, lng: position.longitude);
      await _runSearch();
    } on LocationServiceException catch (e) {
      status = SearchStatus.error;
      errorMessage = e.message;
      notifyListeners();
    } catch (_) {
      status = SearchStatus.error;
      errorMessage = 'Não foi possível obter sua localização.';
      notifyListeners();
    }
  }

  Future<void> updateCategory(String? categorySlug) async {
    if (filters == null) return;
    filters = filters!.copyWith(
      categorySlug: categorySlug,
      clearCategory: categorySlug == null,
      offset: 0,
    );
    await _runSearch();
  }

  Future<void> toggleOpenNow(bool value) async {
    if (filters == null) return;
    filters = filters!.copyWith(openNow: value, offset: 0);
    await _runSearch();
  }

  Future<void> toggleAcceptsPets(bool value) async {
    if (filters == null) return;
    filters = filters!.copyWith(acceptsPets: value, offset: 0);
    await _runSearch();
  }

  Future<void> updateRadius(int radiusMeters) async {
    if (filters == null) return;
    filters = filters!.copyWith(radiusMeters: radiusMeters, offset: 0);
    await _runSearch();
  }

  Future<void> retry() => loadInitial();

  Future<void> _runSearch() async {
    status = SearchStatus.loading;
    errorMessage = null;
    notifyListeners();

    try {
      final result = await _repository.search(filters!);
      results = result.data;
      total = result.total;
      status = results.isEmpty ? SearchStatus.empty : SearchStatus.loaded;
    } catch (e) {
      status = SearchStatus.error;
      errorMessage = e.toString();
    }
    notifyListeners();
  }
}
