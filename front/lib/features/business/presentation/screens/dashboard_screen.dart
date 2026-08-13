import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/models/business.dart';
import '../../../../core/theme/app_theme.dart';
import '../state/business_view_model.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<BusinessViewModel>().load();
    });
  }

  @override
  Widget build(BuildContext context) {
    final vm = context.watch<BusinessViewModel>();

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        title: const Text('Painel do lojista'),
      ),
      body: _body(vm),
    );
  }

  Widget _body(BusinessViewModel vm) {
    if (vm.status == BusinessLoadStatus.loading) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primary));
    }

    if (vm.status == BusinessLoadStatus.error || vm.business == null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Não foi possível carregar o painel.'),
              const SizedBox(height: 12),
              ElevatedButton(onPressed: () => context.read<BusinessViewModel>().load(), child: const Text('Tentar novamente')),
            ],
          ),
        ),
      );
    }

    final business = vm.business!;

    return RefreshIndicator(
      onRefresh: () => context.read<BusinessViewModel>().load(),
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const Text(
            'Gerencie seus estabelecimentos, veja quantas pessoas encontraram seu negócio no ask.me e assine para aparecer em destaque.',
            style: TextStyle(color: Colors.black54),
          ),
          const SizedBox(height: 20),
          _SubscriptionBanner(vm: vm),
          if (business.places.isNotEmpty) ...[
            const SizedBox(height: 24),
            const Text('Seus estabelecimentos', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 17)),
            const SizedBox(height: 12),
            ...business.places.map((place) => _PlaceManageCard(place: place)),
          ],
          if (business.pendingClaims.isNotEmpty) ...[
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Reivindicações enviadas', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                  const SizedBox(height: 8),
                  ...business.pendingClaims.map((claim) => Padding(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(claim.place.name, style: const TextStyle(fontWeight: FontWeight.w700)),
                                  Text('${claim.place.address}, ${claim.place.city}',
                                      style: const TextStyle(fontSize: 12, color: Colors.black54)),
                                ],
                              ),
                            ),
                            Text(
                              claim.status == ClaimStatus.pending
                                  ? 'Aguardando aprovação'
                                  : claim.status == ClaimStatus.revoked
                                      ? 'Acesso revogado'
                                      : 'Não aprovado',
                              style: TextStyle(
                                fontWeight: FontWeight.w700,
                                fontSize: 12,
                                color: claim.status == ClaimStatus.pending ? const Color(0xFFC2410C) : Colors.redAccent,
                              ),
                            ),
                          ],
                        ),
                      )),
                ],
              ),
            ),
          ],
          const SizedBox(height: 24),
          const _ClaimSection(),
        ],
      ),
    );
  }
}

class _SubscriptionBanner extends StatelessWidget {
  final BusinessViewModel vm;
  const _SubscriptionBanner({required this.vm});

  @override
  Widget build(BuildContext context) {
    final isActive = vm.business!.subscription.isActive;
    final busy = vm.openingCheckout || vm.openingPortal;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('PLANO', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Colors.black38, letterSpacing: 1)),
          const SizedBox(height: 6),
          Text(isActive ? '👑 Destaque ativo' : 'Plano gratuito', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 17)),
          const SizedBox(height: 4),
          Text(
            isActive
                ? 'Seu negócio aparece em destaque nas buscas do ask.me.'
                : 'R\$ 99,90/mês · apareça em destaque nas buscas · cancele quando quiser.',
            style: const TextStyle(color: Colors.black54),
          ),
          if (vm.subscriptionError != null) ...[
            const SizedBox(height: 6),
            Text(vm.subscriptionError!, style: const TextStyle(color: Colors.redAccent)),
          ],
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: isActive
                ? OutlinedButton(
                    onPressed: busy ? null : () => context.read<BusinessViewModel>().openBillingPortal(),
                    child: Text(busy ? 'Abrindo...' : 'Gerenciar assinatura'),
                  )
                : ElevatedButton(
                    onPressed: busy ? null : () => context.read<BusinessViewModel>().startCheckout(),
                    child: Text(busy ? 'Abrindo...' : 'Assinar'),
                  ),
          ),
        ],
      ),
    );
  }
}

class _PlaceManageCard extends StatefulWidget {
  final BusinessPlace place;
  const _PlaceManageCard({required this.place});

  @override
  State<_PlaceManageCard> createState() => _PlaceManageCardState();
}

class _PlaceManageCardState extends State<_PlaceManageCard> {
  bool _expanded = false;
  PlaceStats? _stats;

  late final TextEditingController _descriptionController;
  late final TextEditingController _phoneController;
  late final TextEditingController _websiteController;
  late final TextEditingController _whatsappController;
  late final TextEditingController _menuUrlController;
  late final TextEditingController _photoUrlsController;
  late bool _acceptsPets;
  late bool _acceptsCards;
  late bool _hasParking;
  bool _saving = false;
  bool _saveError = false;

  @override
  void initState() {
    super.initState();
    final p = widget.place;
    _descriptionController = TextEditingController(text: p.description ?? '');
    _phoneController = TextEditingController(text: p.phone ?? '');
    _websiteController = TextEditingController(text: p.website ?? '');
    _whatsappController = TextEditingController(text: p.whatsappNumber ?? '');
    _menuUrlController = TextEditingController(text: p.menuUrl ?? '');
    _photoUrlsController = TextEditingController(text: p.photoUrls.join('\n'));
    _acceptsPets = p.acceptsPets;
    _acceptsCards = p.acceptsCards;
    _hasParking = p.hasParking;
  }

  @override
  void dispose() {
    _descriptionController.dispose();
    _phoneController.dispose();
    _websiteController.dispose();
    _whatsappController.dispose();
    _menuUrlController.dispose();
    _photoUrlsController.dispose();
    super.dispose();
  }

  void _toggleExpanded() {
    setState(() => _expanded = !_expanded);
    if (_expanded && _stats == null) {
      context.read<BusinessViewModel>().loadStats(widget.place.id).then((stats) {
        if (mounted) setState(() => _stats = stats);
      });
    }
  }

  Future<void> _save() async {
    setState(() {
      _saving = true;
      _saveError = false;
    });

    final photoUrls = _photoUrlsController.text
        .split('\n')
        .map((url) => url.trim())
        .where((url) => url.isNotEmpty)
        .take(6)
        .toList();

    final input = UpdatePlaceProfileInput(
      description: _descriptionController.text,
      phone: _phoneController.text,
      website: _websiteController.text,
      whatsappNumber: _whatsappController.text,
      menuUrl: _menuUrlController.text,
      photoUrls: photoUrls,
      acceptsPets: _acceptsPets,
      acceptsCards: _acceptsCards,
      hasParking: _hasParking,
    );

    final result = await context.read<BusinessViewModel>().updatePlace(widget.place.id, input);

    if (!mounted) return;
    setState(() {
      _saving = false;
      _saveError = result == null;
    });
  }

  @override
  Widget build(BuildContext context) {
    final p = widget.place;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20)),
      child: Column(
        children: [
          InkWell(
            onTap: _toggleExpanded,
            borderRadius: BorderRadius.circular(20),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(p.category.label.toUpperCase(),
                            style: const TextStyle(color: AppColors.primary, fontSize: 11, fontWeight: FontWeight.w800)),
                        const SizedBox(height: 2),
                        Text(p.name, style: const TextStyle(fontWeight: FontWeight.w800)),
                        Text('${p.address}, ${p.city}', style: const TextStyle(fontSize: 12, color: Colors.black54)),
                      ],
                    ),
                  ),
                  Icon(_expanded ? Icons.expand_less_rounded : Icons.expand_more_rounded, color: AppColors.primary),
                ],
              ),
            ),
          ),
          if (_expanded)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Divider(),
                  if (_stats != null) ...[
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        _StatTile(label: 'Visualizações (30d)', value: _stats!.viewsLast30Days),
                        _StatTile(label: 'Cliques (30d)', value: _stats!.clicksLast30Days),
                        _StatTile(label: 'Visualizações (total)', value: _stats!.viewsTotal),
                        _StatTile(label: 'Cliques (total)', value: _stats!.clicksTotal),
                      ],
                    ),
                    const SizedBox(height: 10),
                    const Text('CLIQUES POR AÇÃO (30D)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Colors.black38)),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        _StatTile(label: 'Telefone', value: _stats!.clicksByTypeLast30Days.phoneClick),
                        _StatTile(label: 'WhatsApp', value: _stats!.clicksByTypeLast30Days.whatsappClick),
                        _StatTile(label: 'Site', value: _stats!.clicksByTypeLast30Days.websiteClick),
                        _StatTile(label: 'Ver rota', value: _stats!.clicksByTypeLast30Days.routeClick),
                        _StatTile(label: 'Cardápio', value: _stats!.clicksByTypeLast30Days.menuClick),
                      ],
                    ),
                    const SizedBox(height: 16),
                  ],
                  _field('Descrição', _descriptionController, maxLines: 3, hint: 'Conte o que torna seu negócio especial'),
                  const SizedBox(height: 10),
                  _field('Telefone', _phoneController, hint: '(00) 00000-0000'),
                  const SizedBox(height: 10),
                  _field('Site', _websiteController, hint: 'https://...'),
                  const SizedBox(height: 10),
                  _field('WhatsApp', _whatsappController, hint: '(00) 00000-0000'),
                  const SizedBox(height: 10),
                  _field('Link do cardápio', _menuUrlController, hint: 'https://...'),
                  const SizedBox(height: 10),
                  _field('Fotos (um link por linha, até 6)', _photoUrlsController, maxLines: 3, hint: 'https://...\nhttps://...'),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 16,
                    children: [
                      _ToggleField(label: 'Aceita pets', value: _acceptsPets, onChanged: (v) => setState(() => _acceptsPets = v)),
                      _ToggleField(label: 'Aceita cartão', value: _acceptsCards, onChanged: (v) => setState(() => _acceptsCards = v)),
                      _ToggleField(label: 'Estacionamento', value: _hasParking, onChanged: (v) => setState(() => _hasParking = v)),
                    ],
                  ),
                  if (_saveError) ...[
                    const SizedBox(height: 8),
                    const Text('Não foi possível salvar. Tente novamente.', style: TextStyle(color: Colors.redAccent)),
                  ],
                  const SizedBox(height: 14),
                  ElevatedButton(
                    onPressed: _saving ? null : _save,
                    child: Text(_saving ? 'Salvando...' : 'Salvar alterações'),
                  ),
                  const SizedBox(height: 20),
                  const Divider(),
                  _OpeningHoursEditor(placeId: p.id),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _field(String label, TextEditingController controller, {int maxLines = 1, String? hint}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Colors.black87)),
        const SizedBox(height: 4),
        TextField(
          controller: controller,
          maxLines: maxLines,
          decoration: InputDecoration(
            hintText: hint,
            filled: true,
            fillColor: AppColors.surface,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          ),
        ),
      ],
    );
  }
}

class _StatTile extends StatelessWidget {
  final String label;
  final int value;
  const _StatTile({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 100,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(14)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('$value', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18, color: AppColors.primary)),
          Text(label, style: const TextStyle(fontSize: 11, color: Colors.black54)),
        ],
      ),
    );
  }
}

class _ToggleField extends StatelessWidget {
  final String label;
  final bool value;
  final ValueChanged<bool> onChanged;
  const _ToggleField({required this.label, required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => onChanged(!value),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Checkbox(value: value, onChanged: (v) => onChanged(v ?? false), activeColor: AppColors.primary),
          Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

class _OpeningHoursEditor extends StatefulWidget {
  final String placeId;
  const _OpeningHoursEditor({required this.placeId});

  @override
  State<_OpeningHoursEditor> createState() => _OpeningHoursEditorState();
}

class _OpeningHoursEditorState extends State<_OpeningHoursEditor> {
  List<OpeningHour>? _hours;
  bool _saving = false;
  bool _saved = false;
  bool _error = false;

  @override
  void initState() {
    super.initState();
    context.read<BusinessViewModel>().loadHours(widget.placeId).then((hours) {
      if (mounted) setState(() => _hours = hours);
    });
  }

  void _updateDay(int dayOfWeek, OpeningHour Function(OpeningHour) update) {
    setState(() {
      _hours = _hours!.map((h) => h.dayOfWeek == dayOfWeek ? update(h) : h).toList();
      _saved = false;
    });
  }

  Future<void> _save() async {
    setState(() {
      _saving = true;
      _error = false;
    });
    final ok = await context.read<BusinessViewModel>().saveHours(widget.placeId, _hours!);
    if (!mounted) return;
    setState(() {
      _saving = false;
      _saved = ok;
      _error = !ok;
    });
  }

  Future<void> _pickTime(int dayOfWeek, bool isOpensAt) async {
    final current = isOpensAt ? _hours!.firstWhere((h) => h.dayOfWeek == dayOfWeek).opensAt : _hours!.firstWhere((h) => h.dayOfWeek == dayOfWeek).closesAt;
    final parts = current.split(':');
    final picked = await showTimePicker(
      context: context,
      initialTime: TimeOfDay(hour: int.parse(parts[0]), minute: int.parse(parts[1])),
    );
    if (picked == null) return;
    final formatted = '${picked.hour.toString().padLeft(2, '0')}:${picked.minute.toString().padLeft(2, '0')}';
    _updateDay(dayOfWeek, (h) => isOpensAt ? h.copyWith(opensAt: formatted) : h.copyWith(closesAt: formatted));
  }

  @override
  Widget build(BuildContext context) {
    if (_hours == null) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 12),
        child: Text('Carregando horários...', style: TextStyle(color: Colors.black54)),
      );
    }

    return Padding(
      padding: const EdgeInsets.only(top: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('HORÁRIO DE FUNCIONAMENTO', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Colors.black38)),
          const SizedBox(height: 8),
          ..._hours!.map((h) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  children: [
                    SizedBox(width: 76, child: Text(weekdayLabels[h.dayOfWeek], style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13))),
                    Checkbox(
                      value: !h.isClosed,
                      onChanged: (v) => _updateDay(h.dayOfWeek, (hour) => hour.copyWith(isClosed: !(v ?? false))),
                      activeColor: AppColors.primary,
                    ),
                    const Text('Aberto', style: TextStyle(fontSize: 13)),
                    if (!h.isClosed) ...[
                      const SizedBox(width: 8),
                      TextButton(onPressed: () => _pickTime(h.dayOfWeek, true), child: Text(h.opensAt)),
                      const Text('até', style: TextStyle(fontSize: 12, color: Colors.black45)),
                      TextButton(onPressed: () => _pickTime(h.dayOfWeek, false), child: Text(h.closesAt)),
                    ],
                  ],
                ),
              )),
          if (_error) ...[
            const SizedBox(height: 6),
            const Text('Não foi possível salvar os horários. Tente novamente.', style: TextStyle(color: Colors.redAccent)),
          ],
          const SizedBox(height: 10),
          OutlinedButton(
            onPressed: _saving ? null : _save,
            child: Text(_saving ? 'Salvando...' : _saved ? 'Salvo ✓' : 'Salvar horários'),
          ),
        ],
      ),
    );
  }
}

class _ClaimSection extends StatefulWidget {
  const _ClaimSection();

  @override
  State<_ClaimSection> createState() => _ClaimSectionState();
}

class _ClaimSectionState extends State<_ClaimSection> {
  final _queryController = TextEditingController();

  @override
  void dispose() {
    _queryController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final vm = context.watch<BusinessViewModel>();

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Reivindicar meu negócio', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
          const SizedBox(height: 4),
          const Text(
            'Encontre seu estabelecimento na nossa base e envie o pedido de vínculo — nossa equipe revisa e aprova em até alguns dias.',
            style: TextStyle(color: Colors.black54, fontSize: 13),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _queryController,
                  decoration: InputDecoration(
                    hintText: 'Nome do estabelecimento',
                    filled: true,
                    fillColor: AppColors.surface,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide.none),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  ),
                  onSubmitted: (v) => context.read<BusinessViewModel>().searchClaimablePlaces(v),
                ),
              ),
              const SizedBox(width: 8),
              ElevatedButton(
                onPressed: vm.searchingClaims || _queryController.text.trim().length < 2
                    ? null
                    : () => context.read<BusinessViewModel>().searchClaimablePlaces(_queryController.text),
                child: Text(vm.searchingClaims ? 'Buscando...' : 'Buscar'),
              ),
            ],
          ),
          if (vm.claimError != null) ...[
            const SizedBox(height: 10),
            Text(vm.claimError!, style: const TextStyle(color: Colors.redAccent)),
          ],
          if (vm.claimResults.isNotEmpty) ...[
            const SizedBox(height: 12),
            ...vm.claimResults.map((place) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(place.name, style: const TextStyle(fontWeight: FontWeight.w700)),
                            Text('${place.address}, ${place.city}', style: const TextStyle(fontSize: 12, color: Colors.black54)),
                          ],
                        ),
                      ),
                      _claimAction(context, vm, place),
                    ],
                  ),
                )),
          ],
        ],
      ),
    );
  }

  Widget _claimAction(BuildContext context, BusinessViewModel vm, ClaimableBusinessPlace place) {
    if (place.isMine) {
      return const Text('Seu negócio', style: TextStyle(fontWeight: FontWeight.w800, color: AppColors.primary, fontSize: 13));
    }
    if (place.isClaimed) {
      return const Text('Já reivindicado', style: TextStyle(fontWeight: FontWeight.w600, color: Colors.black38, fontSize: 13));
    }
    if (place.myClaimStatus == ClaimStatus.pending) {
      return const Text('Aguardando aprovação', style: TextStyle(fontWeight: FontWeight.w700, color: Color(0xFFC2410C), fontSize: 13));
    }

    final busy = vm.claimingPlaceId == place.id;
    return OutlinedButton(
      onPressed: busy ? null : () => context.read<BusinessViewModel>().claimPlace(place.id),
      child: Text(busy ? 'Enviando...' : place.myClaimStatus == ClaimStatus.rejected ? 'Tentar novamente' : 'Esse é o meu negócio'),
    );
  }
}
