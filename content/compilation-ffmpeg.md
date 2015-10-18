Title: Compilation FFmpeg static sous Linux et conversion H.265/HEVC
Author: Alexandre Henriet
Slug: compilation-ffmpeg-static-sous-linux-et-conversion-H-265-HEVC
Date: 2015-10-16 18:00

## Contexte
                   
Compilation sous **Linux**, depuis les sources de **FFmpeg** et des principales librairies de codecs, d'un exécutable **static** pouvant être déployé sans aucune dépendance.

## Présentation FFmpeg

**FFmpeg** est un **logiciel libre** multiplateforme ayant pour vocation la **conversion audio et vidéo**. En plus du convertisseur **ffmpeg** proprement dit, la suite FFmpeg intègre également un player audio et vidéo **ffplay** et un serveur HTTP de streaming **ffserver**. Ces outils sont utilisés par des logiciels multimédias assez connus tels que MPlayer, xine, VLC media player, WinFF, etc.

## Espace de travail

On décompresse les sources de FFmpeg dans le dossier **ffmpeg-stack/ffmpeg-2.8.1/**. Toutes les librairies qui seront compilées seront installées dans le sous-dossier **lib/** de ce dossier.

    $ mkdir $HOME/ffmpeg-stack && cd $HOME/ffmpeg-stack
    $ wget http://ffmpeg.org/releases/ffmpeg-2.8.1.tar.bz2
    $ tar -jxf ffmpeg-2.8.1.tar.bz2

## Installation de YASM

Une version récente de l'assembleur **YASM** est requise pour la compilation de certaines librairies.

    $ wget http://www.tortall.net/projects/yasm/releases/yasm-1.3.0.tar.gz
    $ tar -zxf yasm-1.3.0.tar.gz
    $ cd yasm-1.3.0
    $ ./configure --prefix=$HOME/ffmpeg-stack/yasm-build
    $ make && make install

On l'ajoute à la variable d'environnement **PATH** dans le **.bashrc**.
    
    $ vim $HOME/.bashrc
    export PATH=$HOME/ffmpeg-stack/yasm-build/bin:$PATH
    $ source $HOME/.bashrc

## Configuration pkg-config

Il faut indiquer à pkg-config où trouver les fichiers **.pc** générés par les librairies de codecs. On crée la variable d'environnement **PKG_CONFIG_PATH** dans le **.bashrc**.

    $ vim $HOME/.bashrc
    export PKG_CONFIG_PATH="$HOME/ffmpeg-stack/ffmpeg-2.8.1/lib/pkgconfig"
    $ source $HOME/.bashrc

## Compilation des codecs

### Librairie x264

    $ wget ftp://ftp.videolan.org/pub/videolan/x264/snapshots/last_stable_x264.tar.bz2
    $ tar -jxf last_x264.tar.bz2
    $ cd x264-snapshot-20151015-2245-stable/
    $ ./configure --enable-static --enable-shared --prefix=$HOME/ffmpeg-stack/ffmpeg-2.8.1
    $ make && make install

Le paramètre **--enable-shared** est requis sous peine de rencontrer l'erreur **libx264 not found** à la compilation de FFmpeg avec le paramètre **--pkg-config-flags="--static"** lui-même requis par les librairies x265 et schroedinger.

### Librairie FDK_AAC

    $ wget https://github.com/mstorsjo/fdk-aac/archive/v0.1.4.tar.gz
    $ tar -zxf fdk-aac-0.1.4.tar.gz
    $ cd fdk-aac-0.1.4
    $ autoreconf -fiv
    $ ./configure --prefix=$HOME/ffmpeg-stack/ffmpeg-2.8.1 --disable-shared
    $ make && make install

### Librairie MP3 LAME

    $ wget http://downloads.sourceforge.net/project/lame/lame/3.99/lame-3.99.5.tar.gz
    $ tar -zxf lame-3.99.5.tar.gz
    $ cd lame-3.99.5
    $ ./configure --prefix=$HOME/ffmpeg-stack/ffmpeg-2.8.1 --disable-shared
    $ make && make install

### Librairie OGG_VORBIS

    $ wget http://downloads.xiph.org/releases/ogg/libogg-1.3.2.tar.gz
    $ tar xzvf libogg-1.3.2.tar.gz
    $ cd libogg-1.3.2
    $ ./configure --prefix=$HOME/ffmpeg-stack/ffmpeg-2.8.1 --disable-shared
    $ make && make install
    $ wget http://downloads.xiph.org/releases/vorbis/libvorbis-1.3.4.tar.gz
    $ tar xzvf libvorbis-1.3.4.tar.gz
    $ cd libvorbis-1.3.4
    $ ./configure --prefix="$HOME/ffmpeg-stack/ffmpeg-2.8.1" --with-ogg="$HOME/ffmpeg-stack/ffmpeg-2.8.1" --disable-shared
    $ make && make install

### Librairie VPX

    $ wget https://chromium.googlesource.com/webm/libvpx.git/+archive/master.tar.gz --no-check-certificate
    $ mkdir libvpx && tar -zxf master.tar.gz -C libvpx
    $ cd libvpx/
    $ ./configure --prefix=$HOME/ffmpeg-stack/ffmpeg-2.8.1 --disable-examples
    $ make && make install

### Librairie OPUS

    $ wget http://downloads.xiph.org/releases/opus/opus-1.1.tar.gz
    $ tar -zxvf opus-1.1.tar.gz
    $ cd opus-1.1
    $ ./configure --prefix=$HOME/ffmpeg-stack/ffmpeg-2.8.1 --disable-shared
    $ make && make install

### Librairie Speex

    $ wget http://downloads.xiph.org/releases/speex/speexdsp-1.2rc3.tar.gz
    $ tar -zxf speexdsp-1.2rc3.tar.gz
    $ cd speexdsp-1.2rc3
    $ autoreconf -fiv
    $ ./configure --prefix=$HOME/ffmpeg-stack/ffmpeg-2.8.1 --disable-shared
    $ make && make install

### Librairie Gsm

    $ wget http://libgsm.sourcearchive.com/downloads/1.0.13-4/libgsm_1.0.13.orig.tar.gz
    $ tar -zxf libgsm_1.0.13.orig.tar.gz
    $ cd gsm-1.0-pl13/
    $ make
    $ cp lib/libgsm.a $HOME/ffmpeg-stack/ffmpeg-2.8.1/lib/
    $ cp inc/gsm.h $HOME/ffmpeg-stack/ffmpeg-2.8.1/include/


### Librairie XVID

    $ wget http://downloads.xvid.org/downloads/xvidcore-1.3.4.tar.gz
    $ tar -zxvf xvidcore-1.3.4.tar.gz 
    $ cd xvidcore/build/generic/
    $ ./configure --prefix=$HOME/ffmpeg-stack/ffmpeg-2.8.1
    $ make && make install

### Librairie Schroedinger

    $ wget http://gstreamer.freedesktop.org/src/orc/orc-0.4.24.tar.xz
    $ tar -Jxf orc-0.4.24.tar.xz
    $ cd orc-0.4.24
    $ ./configure --prefix=$HOME/ffmpeg-stack/ffmpeg-2.8.1 --disable-shared
    $ make && make install
    $ wget https://launchpad.net/schroedinger/trunk/1.0.11/+download/schroedinger-1.0.11.tar.gz
    $ tar -zxf schroedinger-1.0.11.tar.gz
    $ cd schroedinger-1.0.11
    $ ./configure --prefix=$HOME/ffmpeg-stack/ffmpeg-2.8.1 --disable-shared

Avant d'exécuter le **make**, il est nécessaire de **modifier le Makefile** comme suit.

    $ vim Makefile
    SUBDIRS = schroedinger doc tools
    DIST_SUBDIRS = schroedinger doc tools
    $ make && make install

Sans quoi vous pourriez rencontrer cette erreur.

    /ffmpeg-stack/schroedinger-1.0.11/testsuite/perf/tmp-orc.c:13466: first defined here
    collect2: ld returned 1 exit status
    make[4]: *** [dequantise_speed] Erreur 1

### Librairie x265

Pour compiler le codec **x265**, il est nécessaire de disposer de **cmake**.

    $ wget https://cmake.org/files/v3.3/cmake-3.3.2.tar.gz --no-check-certificate
    $ tar -zxvf cmake-3.3.2.tar.gz
    $ cd cmake-3.3.2
    $ ./bootstrap --prefix=$HOME/ffmpeg-stack/cmake-build
    $ make && make install
    $ wget http://ftp.videolan.org/pub/videolan/x265/x265_1.8.tar.gz
    $ tar -zxf x265_1.8.tar.gz
    $ cd x265_1.8
    $ $HOME/ffmpeg-stack/cmake-build/bin/cmake -G "Unix Makefiles" -DCMAKE_INSTALL_PREFIX="$HOME/ffmpeg-stack/ffmpeg-2.8.1" -DENABLE_SHARED:bool=off $HOME/ffmpeg-stack/x265_1.8/source
    $ make && make install

### Librairie Theora

    $ wget http://downloads.xiph.org/releases/theora/libtheora-1.1.1.tar.bz2
    $ tar -jxf libtheora-1.1.1.tar.bz2
    $ cd libtheora-1.1.1
    $ ./configure --prefix=$HOME/ffmpeg-stack/ffmpeg-2.8.1 --disable-shared
    $ make && make install

## Compilation de FFmpeg

Une fois toutes les librairies compilées, il ne reste plus qu'à compiler **FFmpeg**.

    $ ./configure --extra-version="weasel" --disable-ffserver --disable-ffplay --disable-devices --disable-network --enable-small --enable-runtime-cpudetect --enable-memalign-hack --enable-hardcoded-tables --enable-gpl --enable-nonfree --enable-postproc --extra-ldflags="-static" --enable-libfdk-aac --enable-libmp3lame --enable-libvorbis --enable-libvpx --enable-libopus --enable-libspeex --enable-libgsm --enable-libxvid --enable-libschroedinger  --enable-libx264  --enable-libx265 --enable-libtheora --pkg-config-flags="--static"
    $ make

On obtient un exécutable **static** sans aucune dépendance et donc portable sur n'importe quel système de même architecture.

    $ ldd ffmpeg
    /usr/bin/ldd: ligne 161: /lib64/ld-linux-x86-64.so.2 : fichier binaire impossible à lancer
	    n'est pas un exécutable dynamique
    $ ./ffmpeg -version
    ffmpeg version 2.8.1-weasel Copyright (c) 2000-2015 the FFmpeg developers
    built with gcc 4.6 (Ubuntu/Linaro 4.6.4-1ubuntu1~12.04)
    configuration: --extra-version=nagatobimaru --disable-ffserver --disable-ffplay --disable-devices --disable-network --enable-small --enable-runtime-cpudetect --enable-memalign-hack --enable-hardcoded-tables --enable-gpl --enable-nonfree --enable-postproc --extra-ldflags=-static --enable-libfdk-aac --enable-libmp3lame --enable-libvorbis --enable-libvpx --enable-libopus --enable-libspeex --enable-libgsm --enable-libxvid --enable-libschroedinger --enable-libx264 --enable-libx265 --enable-libtheora --pkg-config-flags=--static
    libavutil      54. 31.100 / 54. 31.100
    libavcodec     56. 60.100 / 56. 60.100
    libavformat    56. 40.101 / 56. 40.101
    libavdevice    56.  4.100 / 56.  4.100
    libavfilter     5. 40.101 /  5. 40.101
    libswscale      3.  1.101 /  3.  1.101
    libswresample   1.  2.101 /  1.  2.101
    libpostproc    53.  3.100 / 53.  3.100

## Conversion H.265/HEVC

Pour réaliser les tests, on télécharge sur **[http://www.sample-videos.com/](http://http//www.sample-videos.com)** une vidéo encodée en H.264/AAC.

    $ ls -lh videos/
    -rw-r----- 1 alex alex 2,1M oct 16 15:03 SampleVideo_1080x720_2mb.mp4
    $ ffprobe videos/SampleVideo_1080x720_2mb.mp4 2>&1|grep "Stream #"
        Stream #0:0(und): Video: h264 (avc1 / 0x31637661), yuv420p, 1280x720 [SAR 1:1 DAR 16:9], 862 kb/s, 25 fps, 25 tbr, 12800 tbn, 50 tbc (default)
        Stream #0:1(und): Audio: aac (LC) (mp4a / 0x6134706D), 48000 Hz, 5.1, fltp, 381 kb/s (default)

### Conversion en 2 passes

On effectue une conversion en 2 passes en reprenant l'[exemple donné pour H.264](https://trac.ffmpeg.org/wiki/Encode/H.264#twopass), en changeant juste le codec video par **libx265**.

    $ ffmpeg -y -i videos/SampleVideo_1080x720_2mb.mp4 -c:v libx265 -preset medium -b:v 555k -pass 1 -c:a libfdk_aac -b:a 128k -f mp4 /dev/null && \
    $ ffmpeg -i videos/SampleVideo_1080x720_2mb.mp4 -c:v libx265 -preset medium -b:v 555k -pass 2 -c:a libfdk_aac -b:a 128k videos/output3.mp4
    ...
    Stream mapping:
      Stream #0:0 -> #0:0 (h264 (native) -> hevc (libx265))
      Stream #0:1 -> #0:1 (aac (native) -> aac (libfdk_aac))
    ...
    encoded 337 frames in 121.90s (2.76 fps), 446.33 kb/s, Avg QP:31.1

Après un temps de conversion non négligeable, on obtient en sortie un fichier vidéo de taille considérablement amoindrie.

    $ ls -lh videos/
    -rw-rw-r-- 1 alex alex 962K oct 17 23:31 output3.mp4
    $ ffprobe videos/output3.mp4 2>&1|grep "Stream #"    
    Stream #0:0(und): Video: hevc (hev1 / 0x31766568), yuv420p(tv), 1280x720 [SAR 1:1 DAR 16:9], 447 kb/s, 25 fps, 25 tbr, 12800 tbn, 25 tbc (default)
    Stream #0:1(und): Audio: aac (LC) (mp4a / 0x6134706D), 48000 Hz, 5.1, fltp, 128 kb/s (default)

### Conversion avec preset ultrafast (meilleure vitesse d'encodage)

    $ ffmpeg -i videos/SampleVideo_1080x720_2mb.mp4 -c:v libx265 -preset ultrafast -acodec copy videos/output-ultrafast.mkv
    encoded 337 frames in 24.43s (13.80 fps), 458.89 kb/s, Avg QP:28.27
    $ ls -lh videos/output-ultrafast.mkv 
    -rw-rw-r-- 1 alex alex 1,4M oct 18 06:52 videos/output-ultrafast.mkv
    $ ffprobe videos/output-ultrafast.mkv 2>&1|grep Stream #
    Stream #0:0(und): Video: hevc, yuv420p(tv), 1280x720 [SAR 1:1 DAR 16:9], 25 fps, 25 tbr, 1k tbn, 25 tbc (default)
    Stream #0:1(und): Audio: aac (LC), 48000 Hz, 5.1, fltp (default)


### Conversion avec preset veryslow (meilleure compression)

    $ ffmpeg -i videos/SampleVideo_1080x720_2mb.mp4 -c:v libx265 -preset veryslow -acodec copy videos/output-veryslow.mkv
    encoded 337 frames in 1351.07s (0.25 fps), 353.06 kb/s, Avg QP:33.72
    $ ls -lh videos/output-veryslow.mkv
    -rw-rw-r-- 1 alex alex 1,2M oct 18 07:23 videos/output-veryslow.mkv
    $ ffprobe /home/alex/Bureau/videos/output-veryslow.mkv 2>&1|grep Stream #
    Stream #0:0(und): Video: hevc, yuv420p(tv), 1280x720 [SAR 1:1 DAR 16:9], 25 fps, 25 tbr, 1k tbn, 25 tbc (default)
    Stream #0:1(und): Audio: aac (LC), 48000 Hz, 5.1, fltp (default)

## Conversion VP9

### Conversion en 2 passes

Paramètres copiés depuis **[http://wiki.webmproject.org/ffmpeg/vp9-encoding-guide](http://wiki.webmproject.org/ffmpeg/vp9-encoding-guide)**.

    $ ffmpeg -y -i videos/SampleVideo_1080x720_2mb.mp4 -c:v libvpx-vp9 -pass 1 -b:v 1000K -threads 1 -speed 4 -tile-columns 0 -frame-parallel 0 -g 9999 -aq-mode 0 -an -f webm /dev/null
    $ ffmpeg -i videos/SampleVideo_1080x720_2mb.mp4 -c:v libvpx-vp9 -pass 2 -b:v 1000K -threads 1 -speed 0 -tile-columns 0 -frame-parallel 0 -auto-alt-ref 1 -lag-in-frames 25 -g 9999 -aq-mode 0 -c:a libopus -b:a 64k -f videos/output.webm
    Stream mapping:
    Stream #0:0 -> #0:0 (h264 (native) -> vp9 (libvpx-vp9))
    Stream #0:1 -> #0:1 (aac (native) -> opus (libopus))
    Press [q] to stop, [?] for help
    $ ls -lh videos/output.webm 
    -rw-rw-r-- 1 alex alex 1,7M oct 18 08:45 videos/output.webm
    $ ffprobe videos/output.webm 2>&1|grep Stream #
    Stream #0:0: Video: vp9, yuv420p(tv), 1280x720, SAR 1:1 DAR 16:9, 25 fps, 25 tbr, 1k tbn, 1k tbc (default)
    Stream #0:1: Audio: opus, 48000 Hz, 5.1, fltp (default)

## Pour aller plus loin

### FFmpeg

- [Documentation FFmpeg](https://ffmpeg.org/ffmpeg.html)
- [Quelques exemples de commandes utiles avec ffmpeg](http://korben.info/ffmpeg-pour-les-nuls.html)
- [Wiki FFmpeg sur la conversion H.265](https://trac.ffmpeg.org/wiki/Encode/H.265)

### Codecs

- [Wikipedia, Codec](https://fr.wikipedia.org/wiki/Codec)
- [Wikipedia, Format conteneur](https://fr.wikipedia.org/wiki/Format_conteneur)
- [Wikipedia, Comparison of video codecs](https://en.wikipedia.org/wiki/Comparison_of_video_codecs)
- [Presets de configuration du codec x265](http://x265.readthedocs.org/en/default/presets.html)
- [Autres tests x265 sur linuxfr](http://linuxfr.org/users/elyotna/journaux/hevc-h-265-et-x265-mes-premiers-tests)
- [Site officiel x265 HEVC Encoder / H.265 Video Codec](http://x265.org/)
- [Player HEVC pour Chrome](https://chrome.google.com/webstore/detail/h265-hevc-player/dambgipgbnhmnkdolkljibpcbocimnpd)
- [Le point sur les codecs vidéo en 2015](http://www.streamingmedia.com/Articles/Editorial/Featured-Articles/The-State-of-Video-Codecs-2015-102806.aspx)
- [Meilleurs codecs pour la vidéo](http://www.techradar.com/news/home-cinema/best-codecs-for-video-and-how-to-encode-1044575)
- [Codec VP9](http://youtube-eng.blogspot.be/2015/04/vp9-faster-better-buffer-free-youtube.html)
- [Utilisation du codec VP9](http://wiki.webmproject.org/ffmpeg/vp9-encoding-guide)

### Autres outils
- [Logiciels de montage vidéo sous Linux](http://doc.ubuntu-fr.org/montage_video)
- [Screencast avec RecordMyDesktop](http://doc.ubuntu-fr.org/recordmydesktop)
