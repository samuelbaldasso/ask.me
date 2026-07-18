import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../account/presentation/state/auth_view_model.dart';
import '../state/subscription_view_model.dart';

/// Tela de gerenciamento de assinatura, acessível de dentro do app (ícone na
/// AppBar). O gate de acesso (login + assinatura obrigatórios antes de usar
/// o app) fica em lib/app_gate.dart e reaproveita [LoginPromptView] e
/// [PaywallView] definidos aqui.
class SubscriptionScreen extends StatefulWidget {
  const SubscriptionScreen({super.key});

  @override
  State<SubscriptionScreen> createState() => _SubscriptionScreenState();
}

class _SubscriptionScreenState extends State<SubscriptionScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<SubscriptionViewModel>().loadStatus();
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthViewModel>();

    return Scaffold(
      appBar: AppBar(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        title: const Text('Assinatura Ask.me'),
        actions: [
          if (auth.isAuthenticated)
            IconButton(
              icon: const Icon(Icons.logout_rounded),
              tooltip: 'Sair',
              onPressed: () => context.read<AuthViewModel>().signOut(),
            ),
        ],
      ),
      body: auth.isAuthenticated ? const _SubscriptionBody() : const LoginPromptView(),
    );
  }
}

class LoginPromptView extends StatelessWidget {
  const LoginPromptView({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthViewModel>();

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.workspace_premium_rounded, size: 56, color: AppColors.primary),
            const SizedBox(height: 16),
            const Text(
              'Entre com sua conta Google para usar o Ask.me.',
              textAlign: TextAlign.center,
              style: TextStyle(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 24),
            if (auth.errorMessage != null) ...[
              Text(
                auth.errorMessage!,
                style: const TextStyle(color: Colors.red),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
            ],
            ElevatedButton.icon(
              onPressed: auth.status == AuthStatus.authenticating
                  ? null
                  : () => context.read<AuthViewModel>().signInWithGoogle(),
              icon: auth.status == AuthStatus.authenticating
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Icon(Icons.login_rounded),
              label: const Text('Entrar com Google'),
            ),
          ],
        ),
      ),
    );
  }
}

class _SubscriptionBody extends StatelessWidget {
  const _SubscriptionBody();

  @override
  Widget build(BuildContext context) {
    final vm = context.watch<SubscriptionViewModel>();

    if (vm.status == SubscriptionViewStatus.loadingStatus) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primary));
    }

    if (vm.isActive) {
      return _ActivePlanView(vm: vm);
    }

    return PaywallView(vm: vm);
  }
}

class _ActivePlanView extends StatelessWidget {
  final SubscriptionViewModel vm;

  const _ActivePlanView({required this.vm});

  @override
  Widget build(BuildContext context) {
    final periodEnd = vm.subscription?.currentPeriodEnd;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.check_circle_rounded, size: 56, color: AppColors.success),
            const SizedBox(height: 16),
            const Text(
              'Sua assinatura está ativa!',
              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18),
            ),
            if (periodEnd != null) ...[
              const SizedBox(height: 8),
              Text(
                'Próxima renovação: ${periodEnd.day.toString().padLeft(2, '0')}/'
                '${periodEnd.month.toString().padLeft(2, '0')}/${periodEnd.year}',
              ),
            ],
            if (vm.subscription?.cancelAtPeriodEnd ?? false) ...[
              const SizedBox(height: 8),
              const Text(
                'Cancelamento agendado — ativa até o fim do período.',
                style: TextStyle(color: Colors.orange),
              ),
            ],
            const SizedBox(height: 24),
            if (vm.errorMessage != null) ...[
              Text(
                vm.errorMessage!,
                style: const TextStyle(color: Colors.red),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
            ],
            OutlinedButton.icon(
              onPressed: vm.status == SubscriptionViewStatus.openingPortal
                  ? null
                  : () => vm.openBillingPortal(),
              icon: vm.status == SubscriptionViewStatus.openingPortal
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.settings_rounded),
              label: const Text('Gerenciar assinatura'),
            ),
          ],
        ),
      ),
    );
  }
}

class PaywallView extends StatelessWidget {
  final SubscriptionViewModel vm;

  const PaywallView({super.key, required this.vm});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.workspace_premium_rounded, size: 56, color: AppColors.primary),
            const SizedBox(height: 16),
            const Text(
              'Ask.me Premium',
              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 20),
            ),
            const SizedBox(height: 8),
            const Text(
              'R\$ 20,00/mês · cartão de crédito · cancele quando quiser',
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            if (vm.errorMessage != null) ...[
              Text(
                vm.errorMessage!,
                style: const TextStyle(color: Colors.red),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
            ],
            ElevatedButton.icon(
              onPressed: vm.status == SubscriptionViewStatus.openingCheckout
                  ? null
                  : () => vm.startCheckout(),
              icon: vm.status == SubscriptionViewStatus.openingCheckout
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Icon(Icons.credit_card_rounded),
              label: const Text('Assinar com cartão'),
            ),
            const SizedBox(height: 12),
            TextButton(
              onPressed: () => vm.loadStatus(),
              child: const Text('Já paguei, atualizar status'),
            ),
          ],
        ),
      ),
    );
  }
}
