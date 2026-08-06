import 'dart:io' show Platform;

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

const _kAccessTokenKey = 'rawaya_access_token';
const _kRefreshTokenKey = 'rawaya_refresh_token';

// محاكي أندرويد يصل للمضيف عبر العنوان الخاص 10.0.2.2 — أما محاكي iOS
// فيشغَّل على نفس جهاز الماك فيصله مباشرة عبر localhost. استخدام 10.0.2.2
// دائمًا كان يجعل الاتصال بالخادم يفشل بصمت على iOS تحديدًا، وهو المنصة
// المستهدفة فعليًا لهذا التطبيق (Xcode Cloud / App Store Connect).
String _defaultBaseUrl() {
  if (kIsWeb) return 'http://localhost:4000/api';
  if (Platform.isAndroid) return 'http://10.0.2.2:4000/api';
  return 'http://localhost:4000/api';
}

class ApiClient {
  ApiClient([String? base])
      : dio = Dio(
          BaseOptions(
            baseUrl: base ?? _defaultBaseUrl(),
            connectTimeout: const Duration(seconds: 10),
            receiveTimeout: const Duration(seconds: 12),
          ),
        ) {
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.read(key: _kAccessTokenKey);
          if (token != null) options.headers['Authorization'] = 'Bearer $token';
          handler.next(options);
        },
      ),
    );
  }

  final Dio dio;
  static const _storage = FlutterSecureStorage();

  Future<Response<T>> get<T>(String path) => dio.get<T>(path);

  Future<Response<T>> post<T>(String path, {Object? data}) => dio.post<T>(path, data: data);

  Future<Response<T>> patch<T>(String path, {Object? data}) => dio.patch<T>(path, data: data);

  Future<Response<T>> delete<T>(String path, {Object? data}) => dio.delete<T>(path, data: data);

  static Future<void> saveTokens({required String accessToken, String? refreshToken}) async {
    await _storage.write(key: _kAccessTokenKey, value: accessToken);
    if (refreshToken != null) {
      await _storage.write(key: _kRefreshTokenKey, value: refreshToken);
    }
  }

  static Future<String?> readAccessToken() => _storage.read(key: _kAccessTokenKey);

  static Future<void> clearTokens() async {
    await _storage.delete(key: _kAccessTokenKey);
    await _storage.delete(key: _kRefreshTokenKey);
  }
}
