import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

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
      appBar: AppBar(title: const Text('Ask.me')),
      body: SafeArea(child: _buildBody(vm)),
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
                CircularProgressIndicator(),
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
                const Icon(Icons.location_off, size: 48, color: Colors.grey),
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
            const SizedBox(height: 8),
            const FilterBar(),
            const SizedBox(height: 8),
            Expanded(child: _buildResults(vm)),
          ],
        );
    }
  }

  Widget _buildResults(SearchViewModel vm) {
    if (vm.status == SearchStatus.loading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (vm.status == SearchStatus.empty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Text(
            'Nenhum lugar encontrado com esses filtros.\nTente ampliar o raio de busca.',
            textAlign: TextAlign.center,
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: vm.retry,
      child: ListView.builder(
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
