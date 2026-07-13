import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../state/search_view_model.dart';

class FilterBar extends StatelessWidget {
  const FilterBar({super.key});

  @override
  Widget build(BuildContext context) {
    final vm = context.watch<SearchViewModel>();
    final filters = vm.filters;
    if (filters == null) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          height: 44,
          child: ListView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            children: [
              ChoiceChip(
                label: const Text('Todas categorias'),
                selected: filters.categorySlug == null,
                onSelected: (_) => vm.updateCategory(null),
              ),
              const SizedBox(width: 8),
              ...SearchViewModel.availableCategories.map((c) {
                final selected = filters.categorySlug == c['slug'];
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(c['label']!),
                    selected: selected,
                    onSelected: (_) => vm.updateCategory(c['slug']),
                  ),
                );
              }),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Wrap(
            spacing: 8,
            children: [
              FilterChip(
                label: const Text('Aberto agora'),
                selected: filters.openNow,
                onSelected: vm.toggleOpenNow,
              ),
              FilterChip(
                label: const Text('Aceita pets'),
                selected: filters.acceptsPets,
                onSelected: vm.toggleAcceptsPets,
              ),
            ],
          ),
        ),
      ],
    );
  }
}
