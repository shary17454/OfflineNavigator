import 'package:dio/dio.dart';

class ApiClient {
  factory ApiClient([String? base]) {
    final baseUrl = base ?? const String.fromEnvironment('API_BASE_URL');
    final uri = Uri.tryParse(baseUrl);
    if (uri == null || uri.scheme != 'https' || uri.host.isEmpty) {
      throw StateError('API_BASE_URL must be a valid HTTPS URL.');
    }
    return ApiClient._(
      Dio(
        BaseOptions(
          baseUrl: baseUrl,
          connectTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 12),
        ),
      ),
    );
  }

  ApiClient._(this.dio);

  final Dio dio;

  Future<Response<T>> get<T>(String path) => dio.get<T>(path);
}
