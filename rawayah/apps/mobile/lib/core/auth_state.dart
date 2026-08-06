import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'api_client.dart';

class AuthState {
  const AuthState({this.isAuthenticated = false, this.checked = false});

  final bool isAuthenticated;
  final bool checked;
}

class AuthController extends StateNotifier<AuthState> {
  AuthController() : super(const AuthState()) {
    _restore();
  }

  Future<void> _restore() async {
    final token = await ApiClient.readAccessToken();
    state = AuthState(isAuthenticated: token != null, checked: true);
  }

  Future<void> signIn({required String accessToken, String? refreshToken}) async {
    await ApiClient.saveTokens(accessToken: accessToken, refreshToken: refreshToken);
    state = const AuthState(isAuthenticated: true, checked: true);
  }

  Future<void> signOut() async {
    await ApiClient.clearTokens();
    state = const AuthState(isAuthenticated: false, checked: true);
  }
}

final authControllerProvider = StateNotifierProvider<AuthController, AuthState>((ref) => AuthController());
