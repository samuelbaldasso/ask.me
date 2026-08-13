import 'package:flutter/foundation.dart';

import '../../../../core/models/business.dart';
import '../../../../core/network/api_exception.dart';
import '../../data/admin_repository.dart';

enum AdminLoadStatus { loading, loaded, forbidden, error }

class AdminViewModel extends ChangeNotifier {
  final AdminRepository _repository;

  AdminViewModel(this._repository);

  AdminLoadStatus status = AdminLoadStatus.loading;
  List<AdminClaim> pending = [];
  List<AdminClaim> approved = [];
  String? actingClaimId;

  Future<void> load() async {
    status = AdminLoadStatus.loading;
    notifyListeners();

    try {
      final results = await Future.wait([
        _repository.listPendingClaims(),
        _repository.listApprovedClaims(),
      ]);
      pending = results[0];
      approved = results[1];
      status = AdminLoadStatus.loaded;
    } on ApiException catch (e) {
      status = e.statusCode == 403 ? AdminLoadStatus.forbidden : AdminLoadStatus.error;
    } catch (_) {
      status = AdminLoadStatus.error;
    } finally {
      notifyListeners();
    }
  }

  Future<void> approve(String claimId) async {
    actingClaimId = claimId;
    notifyListeners();
    try {
      await _repository.approveClaim(claimId);
      await load();
    } catch (_) {
      // mantém o item na lista — o admin tenta de novo
    } finally {
      actingClaimId = null;
      notifyListeners();
    }
  }

  Future<void> reject(String claimId) async {
    actingClaimId = claimId;
    notifyListeners();
    try {
      await _repository.rejectClaim(claimId);
      await load();
    } catch (_) {
      // mantém o item na lista — o admin tenta de novo
    } finally {
      actingClaimId = null;
      notifyListeners();
    }
  }

  Future<void> revoke(String claimId) async {
    actingClaimId = claimId;
    notifyListeners();
    try {
      await _repository.revokeClaim(claimId);
      approved = approved.where((c) => c.id != claimId).toList();
    } catch (_) {
      // mantém o item na lista — o admin tenta de novo
    } finally {
      actingClaimId = null;
      notifyListeners();
    }
  }
}
