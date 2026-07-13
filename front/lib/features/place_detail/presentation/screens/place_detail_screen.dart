import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/models/place.dart';

class PlaceDetailScreen extends StatelessWidget {
  final Place place;

  const PlaceDetailScreen({super.key, required this.place});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isOpen = place.isOpenNow;

    return Scaffold(
      appBar: AppBar(title: Text(place.name)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(place.category.label, style: theme.textTheme.labelLarge),
          const SizedBox(height: 4),
          Text(place.name, style: theme.textTheme.headlineSmall),
          const SizedBox(height: 8),
          if (isOpen != null)
            Text(
              isOpen ? 'Aberto agora' : 'Fechado agora',
              style: TextStyle(
                color: isOpen ? Colors.green : Colors.red,
                fontWeight: FontWeight.w600,
              ),
            ),
          const SizedBox(height: 16),
          if (place.description != null && place.description!.isNotEmpty) ...[
            Text(place.description!, style: theme.textTheme.bodyMedium),
            const SizedBox(height: 16),
          ],
          _InfoRow(icon: Icons.place_outlined, text: '${place.address}, ${place.city}'),
          _InfoRow(icon: Icons.social_distance_outlined, text: 'A ${place.distanceLabel} de você'),
          if (place.phone != null)
            _InfoRow(icon: Icons.phone_outlined, text: place.phone!, onTap: () => _call(place.phone!)),
          if (place.website != null)
            _InfoRow(icon: Icons.language_outlined, text: place.website!, onTap: () => _openUrl(place.website!)),
          const SizedBox(height: 16),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              if (place.acceptsPets) const Chip(label: Text('Aceita pets')),
              if (place.acceptsCards) const Chip(label: Text('Aceita cartão')),
              if (place.hasParking) const Chip(label: Text('Estacionamento')),
            ],
          ),
        ],
      ),
    );
  }

  Future<void> _call(String phone) async {
    final uri = Uri(scheme: 'tel', path: phone);
    if (await canLaunchUrl(uri)) await launchUrl(uri);
  }

  Future<void> _openUrl(String url) async {
    final uri = Uri.tryParse(url);
    if (uri != null && await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String text;
  final VoidCallback? onTap;

  const _InfoRow({required this.icon, required this.text, this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(
          children: [
            Icon(icon, size: 20, color: Colors.grey[700]),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                text,
                style: TextStyle(
                  color: onTap != null ? Theme.of(context).colorScheme.primary : null,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
