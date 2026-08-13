import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/models/place.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../account/presentation/screens/login_screen.dart';
import '../../../account/presentation/state/auth_view_model.dart';
import '../../../favorites/presentation/state/favorites_view_model.dart';
import '../../../search/data/places_repository.dart';

class PlaceDetailScreen extends StatefulWidget {
  final Place place;

  const PlaceDetailScreen({super.key, required this.place});

  @override
  State<PlaceDetailScreen> createState() => _PlaceDetailScreenState();
}

class _PlaceDetailScreenState extends State<PlaceDetailScreen> {
  Place get place => widget.place;

  @override
  void initState() {
    super.initState();
    // Base do relatório de estatísticas do lojista; nunca deve travar a UI.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<PlacesRepository>().trackEvent(place.id, 'view');
    });
  }

  void _track(String type) {
    context.read<PlacesRepository>().trackEvent(place.id, type);
  }

  void _toggleFavorite(BuildContext context) {
    if (!context.read<AuthViewModel>().isAuthenticated) {
      Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
      return;
    }

    context.read<FavoritesViewModel>().toggle(place.id);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isOpen = place.isOpenNow;
    final categoryStyle = CategoryStyle.forSlug(place.category.slug);
    final isFavorite = context.watch<FavoritesViewModel>().isFavorite(place.id);
    final whatsappNumber = place.whatsappNumber ?? place.phone;

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 200,
            pinned: true,
            backgroundColor: AppColors.primary,
            actions: [
              IconButton(
                icon: Icon(isFavorite ? Icons.favorite_rounded : Icons.favorite_border_rounded),
                tooltip: 'Favoritar',
                onPressed: () => _toggleFavorite(context),
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(gradient: AppColors.heroGradient),
                child: Center(
                  child: Container(
                    width: 84,
                    height: 84,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.18),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(categoryStyle.icon, color: Colors.white, size: 40),
                  ),
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    place.category.label.toUpperCase(),
                    style: const TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w800,
                      fontSize: 12,
                      letterSpacing: 1,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      if (place.isFeatured) ...[
                        const Text('👑', style: TextStyle(fontSize: 20)),
                        const SizedBox(width: 6),
                      ],
                      Expanded(child: Text(place.name, style: theme.textTheme.headlineSmall)),
                    ],
                  ),
                  const SizedBox(height: 10),
                  if (isOpen != null)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: (isOpen ? AppColors.success : Colors.redAccent).withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            isOpen ? Icons.check_circle_rounded : Icons.schedule_rounded,
                            size: 14,
                            color: isOpen ? AppColors.success : Colors.redAccent,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            isOpen ? 'Aberto agora' : 'Fechado agora',
                            style: TextStyle(
                              color: isOpen ? AppColors.success : Colors.redAccent,
                              fontWeight: FontWeight.w700,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                    ),
                  const SizedBox(height: 18),
                  if (place.description != null && place.description!.isNotEmpty) ...[
                    Text(place.description!, style: theme.textTheme.bodyMedium),
                    const SizedBox(height: 18),
                  ],
                  if (place.photoUrls.isNotEmpty) ...[
                    SizedBox(
                      height: 160,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: place.photoUrls.length,
                        separatorBuilder: (_, _) => const SizedBox(width: 12),
                        itemBuilder: (context, index) => ClipRRect(
                          borderRadius: BorderRadius.circular(20),
                          child: Image.network(
                            place.photoUrls[index],
                            width: 220,
                            height: 160,
                            fit: BoxFit.cover,
                            errorBuilder: (_, _, _) => Container(
                              width: 220,
                              height: 160,
                              color: const Color(0xFFF1EBFF),
                              child: const Icon(Icons.image_not_supported_rounded, color: AppColors.primary),
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 18),
                  ],
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _ActionButton(
                        icon: Icons.navigation_rounded,
                        label: 'Ver rota',
                        onTap: () {
                          _track('route_click');
                          _openUrl(
                            'https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}',
                          );
                        },
                      ),
                      if (whatsappNumber != null)
                        _ActionButton(
                          icon: Icons.chat_rounded,
                          label: 'WhatsApp',
                          onTap: () {
                            _track('whatsapp_click');
                            _openUrl('https://wa.me/${whatsappNumber.replaceAll(RegExp(r'\D'), '')}');
                          },
                        ),
                      if (place.menuUrl != null)
                        _ActionButton(
                          icon: Icons.menu_book_rounded,
                          label: 'Ver cardápio',
                          onTap: () {
                            _track('menu_click');
                            _openUrl(place.menuUrl!);
                          },
                        ),
                    ],
                  ),
                  const SizedBox(height: 18),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withValues(alpha: 0.06),
                          blurRadius: 16,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        _InfoRow(icon: Icons.place_rounded, text: '${place.address}, ${place.city}'),
                        _InfoRow(icon: Icons.near_me_rounded, text: 'A ${place.distanceLabel} de você'),
                        if (place.phone != null)
                          _InfoRow(
                            icon: Icons.phone_rounded,
                            text: place.phone!,
                            onTap: () {
                              _track('phone_click');
                              _call(place.phone!);
                            },
                          ),
                        if (place.website != null)
                          _InfoRow(
                            icon: Icons.language_rounded,
                            text: place.website!,
                            onTap: () {
                              _track('website_click');
                              _openUrl(place.website!);
                            },
                            isLast: true,
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 18),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      if (place.acceptsPets)
                        const _Tag(label: 'Aceita pets', icon: Icons.pets_rounded, color: Color(0xFF3B82F6)),
                      if (place.acceptsCards)
                        const _Tag(label: 'Aceita cartão', icon: Icons.credit_card_rounded, color: Colors.blueGrey),
                      if (place.hasParking)
                        const _Tag(
                            label: 'Estacionamento', icon: Icons.local_parking_rounded, color: Colors.blueGrey),
                    ],
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
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

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _ActionButton({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(24),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: AppColors.primary,
          borderRadius: BorderRadius.circular(24),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: Colors.white),
            const SizedBox(width: 8),
            Text(label, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 13)),
          ],
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String text;
  final VoidCallback? onTap;
  final bool isLast;

  const _InfoRow({required this.icon, required this.text, this.onTap, this.isLast = false});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        decoration: BoxDecoration(
          border: isLast ? null : const Border(bottom: BorderSide(color: Color(0xFFF1EBFF))),
        ),
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
        child: Row(
          children: [
            Icon(icon, size: 20, color: AppColors.primary),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                text,
                style: TextStyle(
                  color: onTap != null ? AppColors.primary : Colors.black87,
                  fontWeight: onTap != null ? FontWeight.w600 : FontWeight.normal,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Tag extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;

  const _Tag({required this.label, required this.icon, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 15, color: color),
          const SizedBox(width: 6),
          Text(label, style: TextStyle(color: color, fontWeight: FontWeight.w700, fontSize: 13)),
        ],
      ),
    );
  }
}
