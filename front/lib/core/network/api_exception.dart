class ApiException implements Exception {
  final String message;
  final int? statusCode;

  const ApiException(this.message, {this.statusCode});

  factory ApiException.fromDioError(dynamic error) {
    final statusCode = error?.response?.statusCode as int?;
    // ignore: avoid_print
    print('[ApiException] type=${error?.type} status=$statusCode body=${error?.response?.data} message=${error?.message}');
    return ApiException(
      'Não foi possível carregar os resultados. Verifique sua conexão e tente novamente.',
      statusCode: statusCode,
    );
  }

  @override
  String toString() => message;
}
