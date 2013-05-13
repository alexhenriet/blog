Title: Amorçage réseau de Debian 7.0 et Centos 6.4 via PXE
Author: Alexandre Henriet
Slug: amorcage-reseau-de-debian-7.0-et-centos-6.4-via-pxe
Date: 2013-05-09 18:00

## Contexte

Parfois le réseau constitue la seule option disponible pour installer l'OS d'une machine.

## Boot via PXE

PXE est l'acronyme de **Pre-boot eXecution Environment**. Au même titre qu'un ordinateur
peut booter sur un disque dur, un DVD ou une clé USB, PXE lorsqu'il est supporté
par le BIOS permet d'amorcer une image **depuis le réseau**. Méthode commode pour les installations de serveurs en masse,
elle est également la seule disponible à défaut de lecteur optique et de port USB.

## Composants impliqués

Une installation via PXE fait intervenir plusieurs composants.

### Serveur TFTP

**[TFTP](http://fr.wikipedia.org/wiki/Trivial_File_Transfer_Protocol)** est un protocole simplifié de transfert de fichiers. Le serveur permet de rendre les fichiers d'amorçage accessibles à travers le LAN.

### Serveur DHCP

**[DHCP](http://fr.wikipedia.org/wiki/Dynamic_Host_Configuration_Protocol)** est un protocole d'assignation automatique de configuration réseau. Le serveur permet à la machine candidate à l'installation d'obtenir son adresse IP, celle de la gateway et du serveur DNS.

### PXELINUX

**[PXELINUX](http://www.syslinux.org/wiki/index.php/PXELINUX)** est l'utilitaire qui permet d'amorcer Linux via le réseau.

## Configuration DNSMASQ

Il existe plusieurs serveurs TFTP tels que **tftpd, tftpd-hpa et atftpd**, idem pour les serveurs DHCP. On opte pour **[DNSMASQ](http://www.thekelleys.org.uk/dnsmasq/doc.html)** qui a l'avantage de combiner les deux fonctionnalités.

    $ apt-get install dnsmasq
    $ vim /etc/dnsmasq.conf
    # Range IP allouable par le serveur DHCP et durée du bail
    dhcp-range=192.168.1.50,192.168.1.150,255.255.255.0,3h
    # IP de la gateway
    dhcp-option=option:router,192.168.1.1
    # IP du DNS server
    dhcp-option=option:dns-server,192.168.1.1
    # Interface réseau concernée
    interface=eth0
    # Exécutable de PXELINUX
    dhcp-boot=pxelinux.0
    # Activation du serveur TFTP intégré
    enable-tftp
    # DOC_ROOT du serveur TFTP, répertoire par défaut de tftpd-hpa
    tftp-root=/var/lib/tftpboot
    $ service dnsmasq restart
    * Restarting DNS forwarder and DHCP server dnsmasq                      [ OK ]

## Configuration PXELINUX

On télécharge **[SYSLINUX](http://www.syslinux.org/wiki/index.php/Download)** et on copie
les fichiers nécessaires à **PXELINUX** dans le répertoire racine du serveur TFTP.

    $ cd /tmp && wget https://www.kernel.org/pub/linux/utils/boot/syslinux/syslinux-5.01.tar.gz
    $ tar zxf syslinux-5.01.tar.gz
    $ mkdir /var/lib/tftpboot/
    $ cp syslinux-5.01/core/pxelinux.0 /var/lib/tftpboot/
    $ cp syslinux-5.01/com32/menu/menu.c32 /var/lib/tftpboot/
    $ cp syslinux-5.01/com32/elflink/ldlinux/ldlinux.c32 /var/lib/tftpboot/
    $ cp syslinux-5.01/com32/libutil/libutil.c32 /var/lib/tftpboot/

On crée le **fichier de configuration par défaut** de PXELINUX dans le sous-dossier **pxelinux.cfg**,
avec une entrée pour chaque OS qu'on souhaite rendre installable via le réseau.

    $ mkdir /var/lib/tftpboot/pxelinux.cfg
    $ vim /var/lib/tftpboot/pxelinux.cfg/default
    DEFAULT menu.c32
    PROMPT 0
    TIMEOUT 300
    ONTIMEOUT local
    MENU TITLE PXE Boot Menu
    LABEL Local
        MENU LABEL Local boot
        MENU DEFAULT
        LOCALBOOT 0
    LABEL Debian
        MENU LABEL Debian 7.0
        kernel debian/wheezy/i386/linux
        append initrd=debian/wheezy/i386/initrd.gz ramdisk_size=1000000
    LABEL Centos
        MENU LABEL Centos 6.4
        kernel centos/6.4/i386/vmlinuz
        append initrd=centos/6.4/i386/initrd.img ramdisk_size=1000000


## Fichiers d'installation

Le noyau et l'image minimale de **Debian 7.0** et **Centos 6.4** référencés dans la configuration de PXELINUX
sont téléchargés depuis un miroir Internet dans les répertoires correspondants.

    mkdir -p /var/lib/tftpboot/debian/wheezy/i386 && cd /var/lib/tftpboot/debian/wheezy/i386
    wget http://ftp.be.debian.org/debian/dists/wheezy/main/installer-i386/current/images/netboot/debian-installer/i386/linux
    wget http://ftp.be.debian.org/debian/dists/wheezy/main/installer-i386/current/images/netboot/debian-installer/i386/initrd.gz
    mkdir -p /var/lib/tftpboot/centos/6.4/i386 && cd /var/lib/tftpboot/centos/6.4/i386
    wget http://centos.cu.be/6.4/os/i386/images/pxeboot/vmlinuz
    wget http://centos.cu.be/6.4/os/i386/images/pxeboot/initrd.img

## Routeur maison et conflit DHCP

Si un routeur maison équipé d'un serveur DHCP est présent sur le LAN, il faut couper ce dernier avant de booter via PXE
de sorte que ce soit bien le DHCP de DNSMASQ qui soit utilisé.

Pour désactiver le serveur DHCP de la **BBox2 de Belgacom** : 

    Advanced Settings / Home network / DHCP server
    => Bouton stop

## SYSLINUX 5.01

Il semblerait qu'avec **SYSLINUX 5.01** il soit nécessaire de copier à la racine du serveur TFTP certains fichiers **.c32**
qui n'étaient pas requis par **PXELINUX** dans les versions antérieures. 

Si une erreur semblable aux erreurs suivantes s'affiche lors du boot, assurez-vous d'avoir copié l'ensemble des fichiers listés plus haut.

    Failed to load ldlinux.c32
    Failed to load COM32 file menu.c32

## Enjoy

Il est facile de tester le setup avec **[Virtualbox](https://www.virtualbox.org/wiki/Downloads)** en appuyant sur **F12** au boot de la machine virtuelle et en choisissant l'option **L** pour LAN.

<img class="border" alt="PyQT4 Hello world" src="./theme/img/pxe.png" />

## Pour aller plus loin

- [https://fr.wikipedia.org/wiki/Preboot_Execution_Environment](https://fr.wikipedia.org/wiki/Preboot_Execution_Environment)
- [http://www.syslinux.org/wiki/index.php/PXELINUX](http://www.syslinux.org/wiki/index.php/PXELINUX)
- [https://help.ubuntu.com/community/UbuntuLTSP/ProxyDHCP](https://help.ubuntu.com/community/UbuntuLTSP/ProxyDHCP)
