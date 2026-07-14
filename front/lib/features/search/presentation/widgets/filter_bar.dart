import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/theme/app_theme.dart';
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
            padding: const EdgeInsets.symmetric(horizontal: 16),
            children: [
              _CategoryChip(
                label: 'Todas',
                icon: Icons.apps_rounded,
                selected: filters.categorySlug == null,
                onSelected: (_) => vm.updateCategory(null),
              ),
              const SizedBox(width: 8),
              ...SearchViewModel.availableCategories.map((c) {
                final slug = c['slug']!;
                final selected = filters.categorySlug == slug;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: _CategoryChip(
                    label: c['label']!,
                    icon: CategoryStyle.forSlug(slug).icon,
                    selected: selected,
                    onSelected: (_) => vm.updateCategory(slug),
                  ),
                );
              }),
            ],
          ),
        ),
        const SizedBox(height: 8),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Wrap(
            spacing: 8,
            children: [
              _CategoryChip(
                label: 'Aberto agora',
                icon: Icons.schedule_rounded,
                selected: filters.openNow,
                onSelected: vm.toggleOpenNow,
              ),
              _CategoryChip(
                label: 'Aceita pets',
                icon: Icons.pets_rounded,
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

class _CategoryChip extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool selected;
  final ValueChanged<bool> onSelected;

  const _CategoryChip({
    required this.label,
    required this.icon,
    required this.selected,
    required this.onSelected,
  });

  @override
  Widget build(BuildContext context) {
    return ChoiceChip(
      avatar: Icon(icon, size: 16, color: selected ? Colors.white : AppColors.primary),
      label: Text(
        label,
        style: TextStyle(
          color: selected ? Colors.white : const Color(0xFF3A2E5C),
          fontWeight: FontWeight.w600,
        ),
      ),
      selected: selected,
      onSelected: onSelected,
      backgroundColor: AppColors.surfaceDim,
      selectedColor: AppColors.primary,
      showCheckmark: false,
    );
  }
}
