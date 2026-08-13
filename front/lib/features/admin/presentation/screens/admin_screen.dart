import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/models/business.dart';
import '../../../../core/theme/app_theme.dart';
import '../state/admin_view_model.dart';

class AdminScreen extends StatefulWidget {
  const AdminScreen({super.key});

  @override
  State<AdminScreen> createState() => _AdminScreenState();
}

class _AdminScreenState extends State<AdminScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AdminViewModel>().load();
    });
  }

  @override
  Widget build(BuildContext context) {
    final vm = context.watch<AdminViewModel>();

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        title: const Text('Reivindicações de estabelecimento'),
      ),
      body: _body(vm),
    );
  }

  Widget _body(AdminViewModel vm) {
    switch (vm.status) {
      case AdminLoadStatus.loading:
        return const Center(child: CircularProgressIndicator(color: AppColors.primary));
      case AdminLoadStatus.forbidden:
        return const Center(
          child: Padding(
            padding: EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.lock_rounded, size: 48, color: Colors.black38),
                SizedBox(height: 12),
                Text('Essa página é restrita a administradores.', textAlign: TextAlign.center),
              ],
            ),
          ),
        );
      case AdminLoadStatus.error:
        return Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('Não foi possível carregar a fila de revisão.'),
                const SizedBox(height: 12),
                ElevatedButton(onPressed: () => context.read<AdminViewModel>().load(), child: const Text('Tentar novamente')),
              ],
            ),
          ),
        );
      case AdminLoadStatus.loaded:
        return RefreshIndicator(
          onRefresh: () => context.read<AdminViewModel>().load(),
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              Text('Pendentes${vm.pending.isNotEmpty ? ' (${vm.pending.length})' : ''}',
                  style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 17)),
              const SizedBox(height: 12),
              if (vm.pending.isEmpty)
                const _EmptyCard(text: 'Nenhuma reivindicação pendente no momento.')
              else
                ...vm.pending.map((claim) => _ClaimCard(
                      claim: claim,
                      busy: vm.actingClaimId == claim.id,
                      actions: [
                        OutlinedButton(
                          onPressed: vm.actingClaimId == claim.id
                              ? null
                              : () => context.read<AdminViewModel>().reject(claim.id),
                          style: OutlinedButton.styleFrom(foregroundColor: Colors.redAccent, side: const BorderSide(color: Colors.redAccent)),
                          child: const Text('Rejeitar'),
                        ),
                        const SizedBox(width: 8),
                        ElevatedButton(
                          onPressed: vm.actingClaimId == claim.id
                              ? null
                              : () => context.read<AdminViewModel>().approve(claim.id),
                          child: Text(vm.actingClaimId == claim.id ? 'Processando...' : 'Aprovar'),
                        ),
                      ],
                    )),
              const SizedBox(height: 28),
              Text('Aprovados${vm.approved.isNotEmpty ? ' (${vm.approved.length})' : ''}',
                  style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 17)),
              const SizedBox(height: 12),
              if (vm.approved.isEmpty)
                const _EmptyCard(text: 'Nenhum estabelecimento com dono aprovado ainda.')
              else
                ...vm.approved.map((claim) => _ClaimCard(
                      claim: claim,
                      busy: vm.actingClaimId == claim.id,
                      actions: [
                        OutlinedButton(
                          onPressed: vm.actingClaimId == claim.id ? null : () => _confirmRevoke(context, claim.id),
                          style: OutlinedButton.styleFrom(foregroundColor: Colors.redAccent, side: const BorderSide(color: Colors.redAccent)),
                          child: Text(vm.actingClaimId == claim.id ? 'Processando...' : 'Revogar'),
                        ),
                      ],
                    )),
            ],
          ),
        );
    }
  }

  Future<void> _confirmRevoke(BuildContext context, String claimId) async {
    final vm = context.read<AdminViewModel>();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Revogar acesso'),
        content: const Text('Revogar o acesso desse lojista ao estabelecimento?'),
        actions: [
          TextButton(onPressed: () => Navigator.of(dialogContext).pop(false), child: const Text('Cancelar')),
          TextButton(onPressed: () => Navigator.of(dialogContext).pop(true), child: const Text('Revogar')),
        ],
      ),
    );
    if (confirmed == true) await vm.revoke(claimId);
  }
}

class _EmptyCard extends StatelessWidget {
  final String text;
  const _EmptyCard({required this.text});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20)),
      child: Text(text, textAlign: TextAlign.center, style: const TextStyle(color: Colors.black54)),
    );
  }
}

class _ClaimCard extends StatelessWidget {
  final AdminClaim claim;
  final bool busy;
  final List<Widget> actions;

  const _ClaimCard({required this.claim, required this.busy, required this.actions});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(18)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(claim.place.name, style: const TextStyle(fontWeight: FontWeight.w800)),
          const SizedBox(height: 2),
          Text('${claim.place.address}, ${claim.place.city}', style: const TextStyle(color: Colors.black54, fontSize: 13)),
          const SizedBox(height: 6),
          Text.rich(
            TextSpan(
              style: const TextStyle(fontSize: 13, color: Colors.black87),
              children: [
                const TextSpan(text: 'Pedido de '),
                TextSpan(text: claim.user.name ?? claim.user.email, style: const TextStyle(fontWeight: FontWeight.w700)),
                TextSpan(text: ' (${claim.user.email})'),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Row(mainAxisAlignment: MainAxisAlignment.end, children: actions),
        ],
      ),
    );
  }
}
