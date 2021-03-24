Title: Carte d'identité électronique belge eID sous Archlinux
Author: Alexandre Henriet
Slug: carte-identite-electronique-belge-eid-sous-archlinux
Date: 2021-03-24 19:22

## Contexte

Lecture des informations de la carte d'identité électronique belge sur la machine locale, puis authentification [CSAM](https://www.csam.be/fr/a-propos-csam.html) sur le web avec Mozilla Firefox, le tout grâce au [logiciel eID](https://eid.belgium.be/fr) mis à disposition par le Service Public Fédéral Stratégie et Appui.

## Pré-requis

Pour pouvoir mettre en oeuvre les informations présentées sur cette page, sont requis :

  * Un système Archlinux à jour avec les privilèges root
  * Une connection à Internet
  * Un lecteur de carte eID supporté
  * Une carte d'identité belge eID et son code PIN

## Décharge de responsabilité

La puce de la carte eID se bloque lorsque trois codes PIN erronés sont saisis d'affilée, que ce soit dans le logiciel eID Viewer fourni par le SPF ou lors d'une authentification CSAM sur le web. Pour la débloquer, il faut se rendre au guichet de l'administration communale muni de la carte eID et du code PUK. Lorsqu'on ne dispose plus de ce dernier, il est nécessaire de commander de nouveaux codes, soit à la commune qui peut facturer le service, soit directement [sur le site du SPF Intérieur](https://www.ibz.rrn.fgov.be/fr/documents-didentite/eid/demande-dun-code-pin/)

**Je me décharge de toute responsabilité quant au blocage éventuel d'une carte eID lors de l'utilisation des informations présentées sur cette page.**

## Présentation de l'environnement de test

La procédure décrite sur cette page a été testée sur un système avec la configuration suivante :

    $ hostnamectl
      ...
      Operating System: Arch Linux
                Kernel: Linux 5.11.8-arch1-1
          Architecture: x86-64

## Distribution Archlinux non prise en charge par le SPF

Le SPF Stratégie et Appui a packagé son logiciel eID pour les distributions [Debian, Ubuntu, Mint, Fedora, Red Hat, Centos et openSUSE](https://eid.belgium.be/fr/installation-du-logiciel-eid-sous-linux). Il met à disposition les sources pour les distributions non prises en charge.

Certaines distributions proposent le logiciel officiel [dans des paquets réalisés par des tiers](https://eid.belgium.be/fr/faq/quelles-sont-les-distributions-linux-prises-en-charge#7403), c'est le cas d'Archlinux qui dispose d'un paquet [eid-mw](https://aur.archlinux.org/packages/eid-mw/) sur AUR.
    
## Installation des dépendances via pacman

Les paquets suivants doivent être installés sur le système pour pouvoir suivre la procédure :

  - **git** : utilisé pour cloner le dépôt du package AUR **eid-mw** depuis github.

  - **ccid** : qui contient des pilotes de périphériques pour lecteurs de cartes.
  
  - **pcsc-tools** : qui contient des outils pour interagir avec les lecteurs de cartes.

On utilise pour ce faire le gestionnaire de paquets de la distribution.

     $ sudo pacman -S git ccid pcsc-tools

Pour compiler les sources du logiciel eID avec **makepkg**, les outils du groupe **[base-devel](https://archlinux.org/groups/x86_64/base-devel/)** doivent également être présents et **sudo** doit être correctement configuré pour l'utilisateur.

    $ sudo pacman -S base-devel

## Communication avec le lecteur de carte grâce au deamon pcscd

Le deamon **pcscd** permet la communication avec les lecteurs de cartes. On l'exécute via systemctl.

    $ sudo systemctl start pcscd
    $ ps -ef |grep pcscd
    root        2007       1  0 11:03 ?        00:00:00 /usr/bin/pcscd --foreground --auto-exit

On peut si nécessaire l'activer / le désactiver au boot de la machine. 

    $ sudo systemctl enable pcscd
    $ sudo systemctl disable pcscd

## Test du lecteur de carte avec l'outil pcsc_scan

Le binaire **pcsc_scan** scanne les lecteurs de cartes connectés au système et affiche un statut en cas de changement d'état. Il permet de valider que la communication s'opère correctement avec le lecteur de carte.

    $ pcsc_scan 
    Using reader plug'n play mechanism
    Scanning present readers...
    0: Smart Card Reader Name [CCID Interface] (...) 00 00
     
    Wed Mar 24 19:30:27 2021
     Reader 0: Smart Card Reader Name [CCID Interface] (...) 00 00
      Event number: 0
      Card state: Card removed, 

    Wed Mar 24 19:32:53 2021
     Reader 0: Smart Card Reader Name [CCID Interface] (...) 00 00
      Event number: 1
      Card state: Card inserted, 
      ATR: 3B ...
  
Lorsque le démon **pcscd** n'est pas lancé, pcsc_scan retourne un message d'erreur.

    $ pcsc_scan 
    SCardEstablishContext: Service not available.
    
## Installation du logiciel eID du SPF via AUR

En tant que simple utilisateur, on clone les sources du package **eid-mw** depuis github, on installe la clé publique GPG requise par makepkg, on construit le paquet pour Archlinux et on l'installe. 

    $ git clone https://aur.archlinux.org/eid-mw.git
    $ cd eid-mw/
    $ gpg --recv-key 824A5E0010A04D46
    gpg: clef 824A5E0010A04D46 : clef publique « Belgian eID Automatic Signing Key (continuous builds) » importée
    gpg:       Quantité totale traitée : 1
    gpg:                     importées : 1
    $ makepkg -s
      ...
    ==> Création du paquet « eid-mw »…
      -> Génération du fichier .PKGINFO…
      -> Génération du fichier .BUILDINFO…
      -> Génération du fichier .MTREE…
      -> Compression du paquet…
    ==> Quitte l’environnement fakeroot.
    ==> Création terminée : eid-mw 5.0.14-1 (mer 24 mar 2021 18:44:40)
    $ ls
    eid-mw-5.0.14-1-x86_64.pkg.tar.zst  eid-mw-5.0.14-v5.0.14.tar.gz  eid-mw-5.0.14-v5.0.14.tar.gz.asc  pkg  PKGBUILD  src
    $ makepkg -i eid-mw-5.0.14-v5.0.14.tar.gz
    ...
    résolution des dépendances…
    recherche des conflits entre paquets…
    Paquets (1) eid-mw-5.0.14-1
    Taille totale installée :    1,37 MiB
    Taille de mise à jour nette :  0,00 MiB
    :: Procéder à l’installation ? [O/n] o
    ...
    $ which eid-viewer
    /usr/bin/eid-viewer

La compilation des sources est plus ou moins longue selon la puissance du système.

## Lecture de la carte eID localement avec eid-viewer

Le package AUR **eid-mw** inclut une application GUI dont le binaire s'appelle **eid-viewer** qui permet de visualiser les informations stockées sur la carte eID. Connecté à un serveur X, on l'exécute dans un terminal et le GUI s'affiche invitant l'utilisateur à insérer une carte.

    $ eid-viewer
    
**Attention**: Les tests de code PIN réalisés dans eid-viewer sont considérés comme
des tentatives d'authentification et sont donc susceptibles de bloquer la puce après trois tentatives infructueuses, cfr. la section <a href="#decharge_de_responsabilite">Décharge de responsabilité</a>.

## Authentification CSAM sur le web avec Mozilla Firefox 

Une extension est requise pour pouvoir réaliser une authentification CSAM depuis Firefox. Le navigateur propose automatiquement son installation lorsqu'elle est manquante. Elle est disponible [dans le catalogue des add-ons Firefox](https://addons.mozilla.org/fr/firefox/addon/belgium-eid/) 

Le lecteur de carte doit être connecté et fonctionnel et la carte eID insérée dans ce dernier avant d'entamer une tentative de **Log in**, qui se fait en deux temps :

  - Un premier popup demande de sélectionner le certificat à utiliser pour l'authentification, avec une selectbox affichant l'identité stockée sur la carte insérée. 
  - Un second popup demande de saisir le code PIN de la puce.

**Attention**: le timeout pour valider les deux étapes n'est pas très long. En cas d'erreur liée au timeout, il est nécessaire de vider le cache du navigateur et de le relancer, sans quoi le même message d'erreur d'authentification continue de s'afficher lors des tentatives suivantes.

## Pour aller plus loin

  * [Qu'est-ce que la eID ?](https://eid.belgium.be/fr/quest-ce-que-la-eid)
  * [Questions et réponses eID](https://eid.belgium.be/fr/questions-et-reponses)
  * [Quelles sont les distributions Linux prises en charge ?](https://eid.belgium.be/fr/faq/quelles-sont-les-distributions-linux-prises-en-charge#7403)
  * [CSAM, la porte d’accès aux services de l'État](https://www.csam.be/fr/index.html)
  * [pcsc-tools](http://ludovic.rousseau.free.fr/softwares/pcsc-tools/)
  * [Archlinux wiki: makepkg](https://wiki.archlinux.org/index.php/makepkg)
  * [Archlinux wiki: Sudo](https://wiki.archlinux.fr/sudo)
  * [Archlinux wiki: GnuPG](https://wiki.archlinux.org/index.php/GnuPG)  
  * [Bien démarrer avec GnuPG](https://linuxfr.org/news/bien-demarrer-avec-gnupg)