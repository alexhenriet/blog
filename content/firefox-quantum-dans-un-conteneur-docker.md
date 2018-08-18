Title: Firefox Quantum dans un conteneur Docker
Author: Alexandre Henriet
Slug: firefox-quantum-dans-un-conteneur-docker.md
Date: 2018-08-18 11:26

## Contexte

Isolation du navigateur web Mozilla Firefox Quantum 61.0.2 (64-bit-) pré-configuré avec support d'Adobe Flash dans un conteneur Docker Debian Stretch.

    $ uname -a
    Linux wabisuke 4.17.14-arch1-1-ARCH #1 SMP PREEMPT Thu Aug 9 11:56:50 UTC 2018 x86_64 GNU/Linux
    $ docker -v
	Docker version 18.05.0-ce, build f150324782


## Test docker et connectivité réseau

Le howto postule que Docker est correctement installé et sait accéder à Internet. Le test suivant permet de valider ces assertions.

    $ sudo docker run hello-world

    Hello from docker!
    This message shows that your installation appears to be working correctly.
    ...

## Connectivité réseau derrière un pare-feu via un proxy HTTP

Il se peut qu'un pare-feu empêche Docker d'accéder au serveur depuis lequel il télécharge les images de conteneurs.

    $ sudo docker run hello-world
    Unable to find image 'hello-world:latest' locally
    docker: Error response from daemon: Get https://registry-1.docker.io/v2/: dial tcp: lookup registry-1.docker.io on *.*.*.*:53: no such host.
    See 'docker run --help'.

Il est possible de fournir à Docker la configuration du proxy HTTP à utiliser pour passer le firewall via un fichier de configuration systemd.

    $ sudo /etc/systemd/system/docker.service.d/http-proxy.conf
    [Service]
    Environment="http_proxy=http://proxy_user:proxy_pass@proxy_host:proxy_port/"
    $ sudo systemctl daemon-reload
    $ sudo systemctl show --property Environment docker
    Environment=http_proxy=http://proxy_user:proxy_pass@proxy_host:proxy_port/
    $ systemctl restart docker


## Recette de l'image docker

Les instructions à exécuter pour générer l'image docker sont contenues dans un fichier Dockerfile à créer manuellement.

L'image utilise Debian Stretch comme système d'exploitation de base en dépit de sa taille plus importante car Firefox 
semble avoir quelques problèmes de compatibilité avec la musl-libc incluse dans Alpine Linux.

Firefox et de Flash sont téléchargés depuis leur site officiel repectif.

Firefox est pré-configuré avec en ligne de mire un maximum de confidentialité.

    $ mkdir docker/firefox/Dockerfile
    $ vim docker/firefox/Dockerfile

    FROM debian:stretch as base
    ARG http_proxy
    ARG https_proxy
    RUN apt-get update \
    && apt-get upgrade \ 
    && apt-get install -y \
        bzip2 \
        dbus-x11 \ 
        fonts-dejavu \
        gstreamer1.0-alsa \ 
        gstreamer1.0-plugins-base \
        gstreamer1.0-plugins-good \
        gstreamer1.0-x \
        libdbus-glib-1-2 \
        libgl1-mesa-dri \
        libgl1-mesa-glx \
        libgtk2.0 \
        libgtk3.0-cil \
        libvdpau-va-gl1 \
        libxss1 \
        libxt6 \
        pulseaudio \
        pulseaudio-utils \
        ttf-freefont \
        va-driver-all \
        wget \
        xdg-utils \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists \
    && echo enable-shm=no >> /etc/pulse/client.conf \
    && adduser --disabled-login --gecos "" user

    FROM base as archives
    WORKDIR /home/user
    USER user
    RUN wget -q https://ftp.mozilla.org/pub/firefox/releases/61.0.2/linux-x86_64/en-US/firefox-61.0.2.tar.bz2 \
    && wget -q https://fpdownload.adobe.com/get/flashplayer/pdc/30.0.0.154/flash_player_npapi_linux.x86_64.tar.gz

    FROM archives
    RUN tar jxf firefox-61.0.2.tar.bz2 \
    && /home/user/firefox/firefox --headless -CreateProfile default \
    && prefs=`find /home/user -name prefs.js` \
    && echo 'user_pref("app.normandy.enabled", false);' >> $prefs \
    && echo 'user_pref("app.shield.optoutstudies.enabled", false);' >> $prefs \
    && echo 'user_pref("browser.download.useDownloadDir", false);' >> $prefs \
    && echo 'user_pref("browser.formfill.enable", false);' >> $prefs \
    && echo 'user_pref("browser.newtabpage.enabled", false);' >> $prefs \
    && echo 'user_pref("browser.privatebrowsing.autostart", true);' >> $prefs \
    && echo 'user_pref("browser.rights.3.shown", true);' >> $prefs \
    && echo 'user_pref("browser.safebrowsing.downloads.enabled", false);' >> $prefs \
    && echo 'user_pref("browser.safebrowsing.downloads.remote.enabled", false);' >> $prefs \
    && echo 'user_pref("browser.safebrowsing.downloads.remote.url", "");' >> $prefs \
    && echo 'user_pref("browser.safebrowsing.malware.enabled", false);' >> $prefs \
    && echo 'user_pref("browser.safebrowsing.phishing.enabled", false);' >> $prefs \
    && echo 'user_pref("browser.search.update", false);' >> $prefs \
    && echo 'user_pref("browser.search.suggest.enabled", false);' >> $prefs \
    && echo 'user_pref("browser.send_pings", false);' >> $prefs \
    && echo 'user_pref("browser.shell.checkDefaultBrowser", false);' >> $prefs \
    && echo 'user_pref("browser.startup.firstrunSkipsHomepage", true);' >> $prefs \
    && echo 'user_pref("browser.startup.homepage", "about:blank");' >> $prefs \
    && echo 'user_pref("browser.tabs.warnOnCloseOtherTabs", false);' >> $prefs \
    && echo 'user_pref("browser.tabs.warnOnClose", false);' >> $prefs \
    && echo 'user_pref("browser.tabs.warnOnOpen", false);' >> $prefs \
    && echo 'user_pref("datareporting.policy.dataSubmissionEnabled", false);' >> $prefs \
    && echo 'user_pref("datareporting.policy.dataSubmissionPolicyBypassNotification", true);' >> $prefs \
    && echo 'user_pref("datareporting.healthreport.service.enabled", false);' >> $prefs \
    && echo 'user_pref("datareporting.healthreport.uploadEnabled", false);' >> $prefs \
    && echo 'user_pref("experiments.enabled", false);' >> $prefs \
    && echo 'user_pref("extensions.shield-recipe-client.enabled", false);' >> $prefs \
    && echo 'user_pref("general.warnOnAboutConfig", false);' >> $prefs \
    && echo 'user_pref("intl.accept_languages", "fr-fr");' >> $prefs \
    && echo 'user_pref("layout.spellcheckDefault", 0);' >> $prefs \
    # && echo 'user_pref("network.proxy.autoconfig_url", "http://proxy_host/autoconfig.pac");' >> $prefs \
    # && echo 'user_pref("network.proxy.type", 2);' >> $prefs \
    && echo 'user_pref("places.history.enabled", false);' >> $prefs \
    && echo 'user_pref("privacy.clearOnShutdown.cookies", true);' >> $prefs \
    && echo 'user_pref("privacy.trackingprotection.enabled", true);' >> $prefs \
    && echo 'user_pref("signon.rememberSignons", false);' >> $prefs \
    && echo 'user_pref("security.sandbox.content.syscall_whitelist", "16");' >> $prefs \
    && echo 'user_pref("startup.homepage_welcome_url", "about:blank");' >> $prefs \
    && host_ip=`ip route|awk '/default/ { print $3 }'` \
    && export PULSE_SERVER=$host_ip \
    && mkdir -p /home/user/.cache/dconf /home/user/.mozilla/plugins \
    && tar -zxf flash_player_npapi_linux.x86_64.tar.gz libflashplayer.so \
    && mv libflashplayer.so /home/user/.mozilla/plugins/ \
    && rm firefox-61.0.2.tar.bz2 flash_player_npapi_linux.x86_64.tar.gz
    ENTRYPOINT ["/home/user/firefox/firefox", "--no-remote"]


## Génération de l'image docker

Pour générer l'image docker depuis le Dockerfile précédent, on exécute docker build sur le dossier qui le contient en lui passant au besoin la configuration du proxy HTTP.

    $ sudo docker build docker/firefox/ --build-arg http_proxy="http://proxy_user:proxy_pass@proxy_host:proxy_port/" --build-arg https_proxy="http://proxy_user:proxy_pass@proxy_host:proxy_port/" -t firefox
    ...
    $ docker images
    REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
    firefox             latest              431cb7ee8717        28 seconds ago      1.35GB

Cette étape sera plus ou moins longue en fonction de la puissance de la machine hôte de docker, de la connection à Internet et de l'état des caches.


## Accès distant à PulseAudio

Le serveur de son réseau PulseAudio est utilisé pour le support du son dans Firefox. Le démon tourne sur la machine hôte de docker (tcp port 4713) et le conteneur s'y connecte en tant que client. 
PulseAudio doit être configuré sur la machine hôte pour autoriser cette connection distante.

D'abord on s'assure que PulseAudio fonctionne sur la machine hôte de docker via la commande suivante qui doit générer un bruit constant.

    $ pacat /dev/urandom

L'utilitaire paprefs (GUI) permet d'autoriser l'accès distant à PulseAudio.

    $ sudo apt-get install paprefs
    $ paprefs

    PulseAudio preferences > Network Server : 
        - Enable network access to local devices : checked
        - Don't require authentication : checked

Pour débugguer le son à l'intérieur d'une instance active de conteneur.

    $ docker exec -it image_name bash
    $ pacat /dev/urandom # which will use environment variable PULSE_SERVER passed via docker run and pointing to host's IP


## Accès distant au serveur X

Pour que Firefox puisse s'afficher à l'écran, il faut que le serveur X autorise également les connections distantes.

    $ xhost +
    access control disabled, clients can connect from any host

Il est possible d'appliquer cette autorisation à chaque démarrage du serveur X.

    $ vim .xinitrc 
    xhost +
    exec mate-session

## Lancement de Firefox

Pour lancer Firefox, on exécute l'image en passant à Docker un certain nombre de variables d'environnement concernant l'écran, le serveur X et PulseAudio.

    $ docker run --rm -it --shm-size 2g -e PULSE_SERVER=172.17.0.1 --device /dev/snd -e DISPLAY -v /tmp/.X11-unix/:/tmp/.X11-unix -v /dev/snd:/dev/snd firefox

La création d'un alias permet de simplifier l'exécution de la commande.

    $ vim .bashrc 
    alias ff='docker run --rm -it --shm-size 2g -e PULSE_SERVER=172.17.0.1 --device /dev/snd -e DISPLAY -v /tmp/.X11-unix/:/tmp/.X11-unix -v /dev/snd:/dev/snd firefox'


## Pour aller plus loin
 
  * [Documentation officielle de Docker](https://docs.docker.com/)
  * [Editeur de configuration pour Firefox](https://support.mozilla.org/fr/kb/editeur-de-configuration-pour-firefox)
  * [Documentation officielle de PulseAudio](https://www.freedesktop.org/wiki/Software/PulseAudio/Documentation/User/)
