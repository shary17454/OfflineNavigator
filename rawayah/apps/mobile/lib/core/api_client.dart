import 'package:dio/dio.dart';

class ApiClient {
  ApiClient([String? base])
      : dio = Dio(BaseOptions(baseUrl: base ?? 'http://10.0.2.2:4000/api', connectTimeout: const Duration(seconds: 10), receiveTimeout: const Duration(seconds: 12)));

  final Dio dio;

  Future<Response<T>> get<T>(String path) => dio.get<T>(path);
}
