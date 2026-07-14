import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/network/api_client.dart';
import 'core/services/location_service.dart';
import 'core/theme/app_theme.dart';
import 'features/ai_search/data/ask_repository.dart';
import 'features/ai_search/presentation/state/ai_search_view_model.dart';
import 'features/search/data/places_repository.dart';
import 'features/search/presentation/screens/search_screen.dart';
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
      ],
      child: MaterialApp(
        title: 'Ask.me',
        theme: AppTheme.theme,
        home: const SearchScreen(),
      ),
    );
  }
}
