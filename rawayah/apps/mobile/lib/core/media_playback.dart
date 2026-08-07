import 'dart:async';

import 'package:audio_session/audio_session.dart';
import 'package:flutter/material.dart';
import 'package:just_audio/just_audio.dart';
import 'package:video_player/video_player.dart';

import 'theme.dart';

/// تشغيل الصوت والفيديو داخل التطبيق.
///
/// الروابط التي تصل هنا **موقَّعة ومؤقتة الصلاحية** (يولّدها الخادم عند كل
/// قراءة، انظر `resolveItemsMediaUrls` في `poetry.service.ts`)، فلا تُخزَّن
/// ولا يُعاد استخدامها بعد انتهاء الشاشة. المادة التي لم تُجَز حقوقها يصل
/// رابطها `null` من الخادم أصلًا، والواجهة هنا تعرض سبب تعذّر التشغيل بدل
/// زر معطَّل بلا تفسير.

/// تهيئة جلسة الصوت مرة واحدة عند إقلاع التطبيق.
///
/// بدونها يخضع التشغيل على iOS لمفتاح كتم الصوت الجانبي — أي أن مستخدمًا
/// كاتمًا لجهازه يضغط "تشغيل" فلا يسمع شيئًا ولا يفهم السبب. تصنيف
/// `music()` هو المناسب لمحتوى يقصد المستخدم سماعه (قصائد وتسجيلات رواة).
Future<void> configureAudioSession() async {
  final session = await AudioSession.instance;
  await session.configure(const AudioSessionConfiguration.music());
}

String formatDuration(Duration? d) {
  if (d == null) return '--:--';
  final totalSeconds = d.inSeconds;
  final hours = totalSeconds ~/ 3600;
  final minutes = (totalSeconds % 3600) ~/ 60;
  final seconds = totalSeconds % 60;
  final mm = minutes.toString().padLeft(2, '0');
  final ss = seconds.toString().padLeft(2, '0');
  return hours > 0 ? '$hours:$mm:$ss' : '$mm:$ss';
}

/// يضمن ألّا يعمل أكثر من مشغّل صوتي واحد في وقت واحد.
///
/// شاشة مكتبة الشاعر قد تعرض عشرات التسجيلات معًا، ولولا هذا لتراكب صوتان
/// أو أكثر عند الضغط على أكثر من بطاقة — وهي حالة يقع فيها المستخدم بسهولة
/// لا حالة نادرة.
class _AudioPlaybackCoordinator {
  static AudioPlayer? _active;

  static void claim(AudioPlayer player) {
    if (identical(_active, player)) return;
    _active?.pause();
    _active = player;
  }

  static void release(AudioPlayer player) {
    if (identical(_active, player)) _active = null;
  }
}

/// المشغّل العامل حاليًا — للاختبارات فقط.
///
/// اختبار الوِدجت يرى الأيقونة تتحول من "تشغيل" إلى "إيقاف"، وهذا وحده
/// لا يثبت أن صوتًا خرج فعلًا: قد تتحول الأيقونة ويبقى الموضع صفرًا لأن
/// الملف تالف أو ترميزه غير مدعوم. هذا المنفذ يتيح فحص الموضع والمدة
/// الحقيقيين من محرك الصوت الأصلي.
@visibleForTesting
AudioPlayer? get debugActiveAudioPlayer => _AudioPlaybackCoordinator._active;

/// مشغّل صوتي مضمَّن داخل بطاقة المادة — لا يفتح شاشة جديدة لأن الاستماع
/// يرافق تصفّح بقية المواد عادةً.
class RawayaAudioPlayer extends StatefulWidget {
  const RawayaAudioPlayer({super.key, required this.url, this.title});

  final String url;
  final String? title;

  @override
  State<RawayaAudioPlayer> createState() => _RawayaAudioPlayerState();
}

class _RawayaAudioPlayerState extends State<RawayaAudioPlayer> {
  final _player = AudioPlayer();
  StreamSubscription<PlayerState>? _stateSub;

  bool _loading = false;
  bool _prepared = false;
  String? _error;

  /// موضع يُمسك أثناء سحب المؤشر: أثناء السحب تُعرض قيمة الإصبع لا قيمة
  /// المشغّل، وإلا قفز المؤشر رجوعًا تحت الإصبع مع كل تحديث من الجهاز.
  Duration? _dragPosition;

  @override
  void initState() {
    super.initState();
    _stateSub = _player.playerStateStream.listen((state) {
      // انتهاء المقطع يعيده إلى بدايته جاهزًا لإعادة الاستماع بدل تركه
      // عالقًا عند النهاية وزر التشغيل بلا أثر.
      if (state.processingState == ProcessingState.completed) {
        _player.pause();
        _player.seek(Duration.zero);
      }
    });
  }

  @override
  void dispose() {
    _stateSub?.cancel();
    _AudioPlaybackCoordinator.release(_player);
    _player.dispose();
    super.dispose();
  }

  Future<void> _toggle() async {
    if (_player.playing) {
      await _player.pause();
      return;
    }

    // التحميل مؤجَّل إلى أول ضغطة: تحميل كل تسجيلات الشاشة مسبقًا يستهلك
    // شبكة المستخدم بلا أن يطلب ذلك، وروابط التوقيع قد تنتهي قبل استخدامها.
    if (!_prepared) {
      setState(() {
        _loading = true;
        _error = null;
      });
      try {
        await _player.setUrl(widget.url);
        _prepared = true;
      } catch (_) {
        if (mounted) {
          setState(() {
            _loading = false;
            _error = 'تعذّر تشغيل التسجيل. تحقّق من الاتصال ثم أعد المحاولة.';
          });
        }
        return;
      }
      if (!mounted) return;
      setState(() => _loading = false);
    }

    _AudioPlaybackCoordinator.claim(_player);
    await _player.play();
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.rawaya;

    if (_error != null) {
      return _PlaybackNotice(message: _error!, onRetry: () => setState(() => _error = null));
    }

    return StreamBuilder<Duration>(
      stream: _player.positionStream,
      builder: (context, positionSnapshot) {
        final duration = _player.duration ?? Duration.zero;
        final position = _dragPosition ?? positionSnapshot.data ?? Duration.zero;
        final maxMs = duration.inMilliseconds;
        final valueMs = position.inMilliseconds.clamp(0, maxMs == 0 ? 0 : maxMs);

        return Container(
          margin: const EdgeInsets.only(top: 10),
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
          decoration: BoxDecoration(
            color: colors.surfaceAlt,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: colors.border),
          ),
          child: Row(
            children: [
              _PlayButton(
                loading: _loading,
                playing: _player.playing,
                onPressed: _loading ? null : _toggle,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    SliderTheme(
                      data: SliderTheme.of(context).copyWith(
                        trackHeight: 2,
                        activeTrackColor: colors.gold,
                        inactiveTrackColor: colors.border,
                        thumbColor: colors.gold,
                        overlayShape: SliderComponentShape.noOverlay,
                        thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 6),
                      ),
                      child: Slider(
                        value: valueMs.toDouble(),
                        max: maxMs == 0 ? 1 : maxMs.toDouble(),
                        // لا يُسمح بالسحب قبل معرفة المدة — وإلا كان المؤشر
                        // يتحرك على مسار وهمي بلا أثر على الصوت.
                        onChanged: maxMs == 0
                            ? null
                            : (v) => setState(() => _dragPosition = Duration(milliseconds: v.round())),
                        onChangeEnd: maxMs == 0
                            ? null
                            : (v) async {
                                await _player.seek(Duration(milliseconds: v.round()));
                                if (mounted) setState(() => _dragPosition = null);
                              },
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            formatDuration(position),
                            style: TextStyle(fontSize: 11, color: colors.textSecondary),
                          ),
                          Text(
                            formatDuration(_player.duration),
                            style: TextStyle(fontSize: 11, color: colors.textSecondary),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _PlayButton extends StatelessWidget {
  const _PlayButton({required this.loading, required this.playing, required this.onPressed});

  final bool loading;
  final bool playing;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    final colors = context.rawaya;
    return SizedBox(
      width: 40,
      height: 40,
      child: loading
          ? Center(
              child: SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(strokeWidth: 2, color: colors.gold),
              ),
            )
          : Material(
              color: colors.gold,
              shape: const CircleBorder(),
              child: InkWell(
                customBorder: const CircleBorder(),
                onTap: onPressed,
                child: Icon(
                  playing ? Icons.pause : Icons.play_arrow,
                  color: colors.onGold,
                  size: 22,
                  semanticLabel: playing ? 'إيقاف مؤقت' : 'تشغيل',
                ),
              ),
            ),
    );
  }
}

/// شاشة تشغيل الفيديو — منفصلة لا مضمَّنة، لأن المرئي يحتاج مساحة الشاشة
/// كاملة ولا يُتابَع أثناء التمرير في قائمة.
class RawayaVideoPlayerPage extends StatefulWidget {
  const RawayaVideoPlayerPage({super.key, required this.url, this.title});

  final String url;
  final String? title;

  @override
  State<RawayaVideoPlayerPage> createState() => _RawayaVideoPlayerPageState();
}

class _RawayaVideoPlayerPageState extends State<RawayaVideoPlayerPage> {
  VideoPlayerController? _controller;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    final controller = VideoPlayerController.networkUrl(Uri.parse(widget.url));
    try {
      await controller.initialize();
    } catch (_) {
      await controller.dispose();
      if (mounted) {
        setState(() {
          _loading = false;
          _error = 'تعذّر تشغيل المقطع. تحقّق من الاتصال ثم أعد المحاولة.';
        });
      }
      return;
    }

    // الشاشة قد تُغلق قبل انتهاء التهيئة — بلا هذا يبقى المتحكّم حيًّا
    // بلا مالك ويستمر في استهلاك الشبكة.
    if (!mounted) {
      await controller.dispose();
      return;
    }

    setState(() {
      _controller = controller;
      _loading = false;
    });
    await controller.play();
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.rawaya;
    final controller = _controller;

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: colors.background,
        appBar: AppBar(title: Text(widget.title ?? 'مقطع مرئي')),
        body: Center(
          child: _loading
              ? CircularProgressIndicator(color: colors.gold)
              : _error != null
                  ? Padding(
                      padding: const EdgeInsets.all(24),
                      child: _PlaybackNotice(message: _error!),
                    )
                  : Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        AspectRatio(
                          aspectRatio: controller!.value.aspectRatio,
                          child: VideoPlayer(controller),
                        ),
                        VideoProgressIndicator(
                          controller,
                          allowScrubbing: true,
                          colors: VideoProgressColors(
                            playedColor: colors.gold,
                            bufferedColor: colors.border,
                            backgroundColor: colors.surfaceAlt,
                          ),
                        ),
                        const SizedBox(height: 8),
                        ValueListenableBuilder<VideoPlayerValue>(
                          valueListenable: controller,
                          builder: (context, value, _) => Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                '${formatDuration(value.position)} / ${formatDuration(value.duration)}',
                                style: TextStyle(fontSize: 12, color: colors.textSecondary),
                              ),
                              const SizedBox(width: 16),
                              _PlayButton(
                                loading: false,
                                playing: value.isPlaying,
                                onPressed: () =>
                                    value.isPlaying ? controller.pause() : controller.play(),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
        ),
      ),
    );
  }
}

/// ملاحظة تعذّر التشغيل — تُذكر بنصّها لا كزر معطَّل صامت.
class _PlaybackNotice extends StatelessWidget {
  const _PlaybackNotice({required this.message, this.onRetry});

  final String message;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    final colors = context.rawaya;
    return Container(
      margin: const EdgeInsets.only(top: 10),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: colors.warningSurface,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: colors.border),
      ),
      child: Row(
        children: [
          Icon(Icons.error_outline, size: 18, color: colors.warning),
          const SizedBox(width: 8),
          Expanded(
            child: Text(message, style: TextStyle(fontSize: 12, color: colors.textPrimary)),
          ),
          if (onRetry != null)
            TextButton(
              onPressed: onRetry,
              child: Text('إعادة', style: TextStyle(color: colors.gold)),
            ),
        ],
      ),
    );
  }
}

/// المادة موجودة لكن لا رابط لها — الخادم يحجب الرابط حتى تُجاز حقوقها.
/// تُشرح الحالة للمستخدم بدل إخفاء المادة أو إظهار زر لا يعمل.
class RawayaMediaUnavailableNote extends StatelessWidget {
  const RawayaMediaUnavailableNote({super.key});

  @override
  Widget build(BuildContext context) {
    return const _PlaybackNotice(message: 'المادة غير متاحة للتشغيل حاليًا — لم تُجَز حقوقها بعد.');
  }
}
