import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../ai_search/presentation/screens/ai_search_screen.dart';
import '../../../place_detail/presentation/screens/place_detail_screen.dart';
import '../state/search_view_model.dart';
import '../widgets/filter_bar.dart';
import '../widgets/place_card.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<SearchViewModel>().loadInitial();
    });
  }

  @override
  Widget build(BuildContext context) {
    final vm = context.watch<SearchViewModel>();

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        title: const Text('Ask.me 👋'),
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.auto_awesome_rounded),
        label: const Text('Pergunte à IA'),
        onPressed: () {
          Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => const AiSearchScreen()),
          );
        },
      ),
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.heroGradient),
        child: SafeArea(
          child: Column(
            children: [
              const Padding(
                padding: EdgeInsets.fromLTRB(20, 8, 20, 16),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    'O que você procura perto de você?',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 15,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ),
              Expanded(
                child: Container(
                  width: double.infinity,
                  decoration: const BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
                  ),
                  child: _buildBody(vm),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBody(SearchViewModel vm) {
    switch (vm.status) {
      case SearchStatus.idle:
      case SearchStatus.loadingLocation:
        return const Center(
          child: Padding(
            padding: EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                CircularProgressIndicator(color: AppColors.primary),
                SizedBox(height: 16),
                Text('Obtendo sua localização...'),
              ],
            ),
          ),
        );

      case SearchStatus.error:
        return Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.location_off_rounded, size: 48, color: Colors.grey[400]),
                const SizedBox(height: 12),
                Text(
                  vm.errorMessage ?? 'Algo deu errado.',
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: vm.retry,
                  child: const Text('Tentar novamente'),
                ),
              ],
            ),
          ),
        );

      case SearchStatus.loading:
      case SearchStatus.loaded:
      case SearchStatus.empty:
        return Column(
          children: [
            const SizedBox(height: 16),
            const FilterBar(),
            const SizedBox(height: 8),
            Expanded(child: _buildResults(vm)),
          ],
        );
    }
  }

  Widget _buildResults(SearchViewModel vm) {
    if (vm.status == SearchStatus.loading) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primary));
    }

    if (vm.status == SearchStatus.empty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.search_off_rounded, size: 48, color: Colors.grey[400]),
              const SizedBox(height: 12),
              const Text(
                'Nenhum lugar encontrado com esses filtros.\nTente ampliar o raio de busca.',
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: vm.retry,
      child: ListView.builder(
        padding: const EdgeInsets.only(bottom: 96),
        itemCount: vm.results.length,
        itemBuilder: (context, index) {
          final place = vm.results[index];
          return PlaceCard(
            place: place,
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => PlaceDetailScreen(place: place),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
