import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'app_gate.dart';
import 'core/network/api_client.dart';
import 'core/services/location_service.dart';
import 'core/theme/app_theme.dart';
import 'features/account/data/auth_repository.dart';
import 'features/account/presentation/state/auth_view_model.dart';
import 'features/admin/data/admin_repository.dart';
import 'features/admin/presentation/state/admin_view_model.dart';
import 'features/ai_search/data/ask_repository.dart';
import 'features/ai_search/presentation/state/ai_search_view_model.dart';
import 'features/business/data/business_repository.dart';
import 'features/business/presentation/state/business_view_model.dart';
import 'features/favorites/data/favorites_repository.dart';
import 'features/favorites/presentation/state/favorites_view_model.dart';
import 'features/search/data/places_repository.dart';
import 'features/search/presentation/state/search_view_model.dart';

void main() {
  runApp(const AskMeApp());
}

class AskMeApp extends StatelessWidget {
  const AskMeApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        Provider(create: (_) => ApiClient()),
        Provider(create: (_) => LocationService()),
        ProxyProvider<ApiClient, PlacesRepository>(
          update: (_, apiClient, _) => PlacesRepository(apiClient),
        ),
        ChangeNotifierProxyProvider<PlacesRepository, SearchViewModel>(
          create: (context) => SearchViewModel(
            context.read<PlacesRepository>(),
            context.read<LocationService>(),
          ),
          update: (context, repository, previous) =>
              previous ?? SearchViewModel(repository, context.read<LocationService>()),
        ),
        ProxyProvider<ApiClient, AskRepository>(
          update: (_, apiClient, _) => AskRepository(apiClient),
        ),
        ChangeNotifierProxyProvider<AskRepository, AiSearchViewModel>(
          create: (context) => AiSearchViewModel(
            context.read<AskRepository>(),
            context.read<LocationService>(),
          ),
          update: (context, repository, previous) =>
              previous ?? AiSearchViewModel(repository, context.read<LocationService>()),
        ),
        ProxyProvider<ApiClient, AuthRepository>(
          update: (_, apiClient, _) => AuthRepository(apiClient),
        ),
        ChangeNotifierProxyProvider<AuthRepository, AuthViewModel>(
          create: (context) =>
              AuthViewModel(context.read<AuthRepository>(), context.read<ApiClient>())
                ..restoreSession(),
          update: (context, repository, previous) =>
              previous ?? AuthViewModel(repository, context.read<ApiClient>()),
        ),
        ProxyProvider<ApiClient, FavoritesRepository>(
          update: (_, apiClient, _) => FavoritesRepository(apiClient),
        ),
        ChangeNotifierProxyProvider<FavoritesRepository, FavoritesViewModel>(
          create: (context) => FavoritesViewModel(context.read<FavoritesRepository>()),
          update: (context, repository, previous) => previous ?? FavoritesViewModel(repository),
        ),
        ProxyProvider<ApiClient, BusinessRepository>(
          update: (_, apiClient, _) => BusinessRepository(apiClient),
        ),
        ChangeNotifierProxyProvider<BusinessRepository, BusinessViewModel>(
          create: (context) => BusinessViewModel(context.read<BusinessRepository>()),
          update: (context, repository, previous) => previous ?? BusinessViewModel(repository),
        ),
        ProxyProvider<ApiClient, AdminRepository>(
          update: (_, apiClient, _) => AdminRepository(apiClient),
        ),
        ChangeNotifierProxyProvider<AdminRepository, AdminViewModel>(
          create: (context) => AdminViewModel(context.read<AdminRepository>()),
          update: (context, repository, previous) => previous ?? AdminViewModel(repository),
        ),
      ],
      child: MaterialApp(
        title: 'Ask.me',
        theme: AppTheme.theme,
        home: const AppGate(),
      ),
    );
  }
}
