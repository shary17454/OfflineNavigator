import 'package:flutter/material.dart';

import '../../core/detail_page.dart';
import '../../core/theme.dart';

class PlaceDetailPage extends StatelessWidget {
  const PlaceDetailPage({super.key, required this.placeId});

  final String placeId;

  @override
  Widget build(BuildContext context) {
    return DetailPage(
      title: 'المكان',
      endpoint: '/places/$placeId',
      builder: (context, place) {
        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(place['name']?.toString() ?? '', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: context.rawaya.textPrimary)),
            const SizedBox(height: 12),
            if (place['description'] != null) Text(place['description'].toString(), style: const TextStyle(height: 1.8)),
          ],
        );
      },
    );
  }
}
