import 'package:dio/dio.dart';

import '../../../core/models/business.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_exception.dart';

class AdminRepository {
  final ApiClient _apiClient;

  AdminRepository(this._apiClient);

  Future<List<AdminClaim>> listPendingClaims() async {
    try {
      final response = await _apiClient.dio.get('/admin/claims');
      final data = (response.data as Map<String, dynamic>)['data'] as List<dynamic>;
      return data.map((e) => AdminClaim.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<List<AdminClaim>> listApprovedClaims() async {
    try {
      final response = await _apiClient.dio.get('/admin/claims/approved');
      final data = (response.data as Map<String, dynamic>)['data'] as List<dynamic>;
      return data.map((e) => AdminClaim.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<void> approveClaim(String claimId) async {
    try {
      await _apiClient.dio.post('/admin/claims/$claimId/approve');
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<void> rejectClaim(String claimId) async {
    try {
      await _apiClient.dio.post('/admin/claims/$claimId/reject');
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<void> revokeClaim(String claimId) async {
    try {
      await _apiClient.dio.post('/admin/claims/$claimId/revoke');
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}
