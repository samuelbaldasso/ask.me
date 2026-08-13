import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../admin/presentation/screens/admin_screen.dart';
import '../../../business/presentation/screens/dashboard_screen.dart';
import '../../../favorites/presentation/screens/favorites_screen.dart';
import '../screens/login_screen.dart';
import '../state/auth_view_model.dart';

/// Drawer de perfil, acessível a partir da SearchScreen. Login é opcional no
/// app (só é exigido por features como busca por IA/favoritos quando o
/// usuário tenta usá-las) — por isso o drawer também funciona para quem não
/// está logado, oferecendo "Entrar" em vez de "Sair". O item "Admin" só
/// aparece para o usuário com isAdmin = true.
class ProfileDrawer extends StatelessWidget {
  const ProfileDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthViewModel>();
    final user = auth.user;

    return Drawer(
      child: SafeArea(
        child: Column(
          children: [
            DrawerHeader(
              decoration: const BoxDecoration(gradient: AppColors.heroGradient),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 28,
                    backgroundColor: Colors.white,
                    backgroundImage:
                        user?.avatarUrl != null ? NetworkImage(user!.avatarUrl!) : null,
                    child: user?.avatarUrl == null
                        ? const Icon(Icons.person_rounded, color: AppColors.primary, size: 28)
                        : null,
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          user?.name ?? 'Visitante',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w800,
                            fontSize: 16,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                        if (user?.email != null) ...[
                          const SizedBox(height: 2),
                          Text(
                            user!.email,
                            style: const TextStyle(color: Colors.white70, fontSize: 13),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            ),
            ListTile(
              leading: const Icon(Icons.favorite_rounded, color: AppColors.primary),
              title: const Text('Favoritos'),
              onTap: () {
                Navigator.of(context).pop();
                final destination = auth.isAuthenticated
                    ? const FavoritesScreen()
                    : const LoginScreen();
                Navigator.of(context).push(MaterialPageRoute(builder: (_) => destination));
              },
            ),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.storefront_rounded, color: AppColors.primary),
              title: const Text('Painel do lojista'),
              subtitle: const Text('Para empresas', style: TextStyle(fontSize: 11)),
              onTap: () {
                Navigator.of(context).pop();
                final destination = auth.isAuthenticated
                    ? const DashboardScreen()
                    : const LoginScreen();
                Navigator.of(context).push(MaterialPageRoute(builder: (_) => destination));
              },
            ),
            if (user?.isAdmin ?? false)
              ListTile(
                leading: const Icon(Icons.admin_panel_settings_rounded, color: AppColors.primary),
                title: const Text('Admin'),
                onTap: () {
                  Navigator.of(context).pop();
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const AdminScreen()),
                  );
                },
              ),
            const Spacer(),
            const Divider(),
            ListTile(
              leading: Icon(
                auth.isAuthenticated ? Icons.logout_rounded : Icons.login_rounded,
                color: auth.isAuthenticated ? Colors.red : AppColors.primary,
              ),
              title: Text(
                auth.isAuthenticated ? 'Sair' : 'Entrar',
                style: TextStyle(color: auth.isAuthenticated ? Colors.red : null),
              ),
              onTap: () {
                Navigator.of(context).pop();
                if (auth.isAuthenticated) {
                  context.read<AuthViewModel>().signOut();
                } else {
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const LoginScreen()),
                  );
                }
              },
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}
