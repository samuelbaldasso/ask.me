class ApiException implements Exception {
  final String message;
  final int? statusCode;

  const ApiException(this.message, {this.statusCode});

  factory ApiException.fromDioError(dynamic error) {
    final statusCode = error?.response?.statusCode as int?;
    return ApiException(
      'Não foi possível carregar os resultados. Verifique sua conexão e tente novamente.',
      statusCode: statusCode,
    );
  }

  @override
  String toString() => message;
}
