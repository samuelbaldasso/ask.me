import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/services/location_service.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../place_detail/presentation/screens/place_detail_screen.dart';
import '../../../search/presentation/widgets/place_card.dart';
import '../state/favorites_view_model.dart';

class FavoritesScreen extends StatefulWidget {
  const FavoritesScreen({super.key});

  @override
  State<FavoritesScreen> createState() => _FavoritesScreenState();
}

class _FavoritesScreenState extends State<FavoritesScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    try {
      final position = await LocationService().getCurrentPosition();
      if (!mounted) return;
      await context
          .read<FavoritesViewModel>()
          .load(position.latitude, position.longitude);
    } on LocationServiceException {
      // Sem localização não dá pra calcular distância — a tela mostra o
      // estado de erro do próprio ViewModel de forma implícita (lista vazia).
    }
  }

  @override
  Widget build(BuildContext context) {
    final vm = context.watch<FavoritesViewModel>();

    return Scaffold(
      appBar: AppBar(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        title: const Text('Favoritos'),
      ),
      body: _buildBody(vm),
    );
  }

  Widget _buildBody(FavoritesViewModel vm) {
    if (vm.status == FavoritesStatus.loading || vm.status == FavoritesStatus.idle) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primary));
    }

    if (vm.status == FavoritesStatus.error) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Text(vm.errorMessage ?? 'Algo deu errado.', textAlign: TextAlign.center),
        ),
      );
    }

    if (vm.places.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.favorite_border_rounded, size: 48, color: Colors.grey[400]),
              const SizedBox(height: 12),
              const Text(
                'Você ainda não favoritou nenhum lugar.\nToque no coração de um resultado da busca.',
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: vm.places.length,
      itemBuilder: (context, index) {
        final place = vm.places[index];
        return PlaceCard(
          place: place,
          isFavorite: true,
          onToggleFavorite: () => context.read<FavoritesViewModel>().toggle(place.id),
          onTap: () {
            Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => PlaceDetailScreen(place: place)),
            );
          },
        );
      },
    );
  }
}
