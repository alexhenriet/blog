Title: Installation de l'extension OCI8 pour PHP sous Linux 
Author: Alexandre Henriet
Slug: installation-extension-oci8-pour-php-sous-linux 
Date: 2014-06-18 06:00

## Contexte

L'installation de l'**extension OCI8** permettant d'interfacer **PHP** aux SGBD Oracle implique qu'elle soit compilée après avoir installé un client propriétaire tel que **Oracle Instant Client**.

## Système 32 vs 64 bits

Afin de télécharger le bon client Oracle dont la taille est assez conséquente, il est nécessaire de déterminer si votre machine fait tourner un système d'exploitation **32** ou **64 bits**.

Première méthode :

    $ uname -m
    i686   # système 32 bits
    $ uname -m
    x86_64 # système 64 bits

Deuxième méthode :

    $ file /sbin/init
    /sbin/init: ELF 32-bit ... # système 32 bits
    $ file /sbin/init 
    /sbin/init: ELF 64-bit ... # système 64 bits

## Téléchargement Oracle Instant Client

Le **Oracle Instant Client** doit être installé pour pouvoir compiler l'**extension OCI8**. Il est téléchargeable gratuitement sur le site d'Oracle depuis [cette page](http://www.oracle.com/technetwork/database/features/instant-client/index-097480.html) moyennant la création d'un compte utilisateur, lui aussi gratuit.

Sur un système 32 bits, suivre le lien **Instant Client for Linux x86** et télécharger :

- instantclient-basic-linux-12.1.0.1.0.zip (68,148,424 bytes) (cksum - 3718793959)
- instantclient-sdk-linux-12.1.0.1.0.zip (665,652 bytes) (cksum - 4115916196)

Sur un système 64 bits, suivre le lien **Instant Client for Linux x86-64** et télécharger :

- instantclient-basic-linux.x64-12.1.0.1.0.zip (71,003,110 bytes) (cksum - 2744529887)
- instantclient-sdk-linux.x64-12.1.0.1.0.zip (665,643 bytes) (cksum - 2267301004)

## Installation et configuration Oracle Instant Client

### Décompression des archives téléchargées

On commence par extraire les **2 fichiers** téléchargés dans le dossier **/usr/local/lib**.

    $ cd /usr/local/lib
    $ sudo unzip chemin/vers/instantclient-basic-linux-12.1.0.1.0.zip
    $ ls instantclient_12_1/
    adrci                  libclntsh.so.12.1  libocijdbc12.so   ojdbc7.jar
    BASIC_README           libnnz12.so        libons.so         uidrvci
    genezi                 libocci.so.12.1    liboramysql12.so  xstreams.jar
    libclntshcore.so.12.1  libociei.so        ojdbc6.jar
    $ sudo unzip chemin/vers/instantclient-sdk-linux-12.1.0.1.0.zip
    $ ls instantclient_12_1/sdk/
    admin  demo  include  ott  ottclasses.zip  SDK_README

### Lien symbolique

Pour compiler, l'extension OCI8 a besoin du fichier **libclntsh.so** qui est présent sous un autre nom.
Un lien symbolique doit donc être créé.

    $ cd /usr/local/lib/instantclient_12_1
    $ sudo ln -s libclntsh.so.12.1 libclntsh.so
    $ ls -l libclntsh.so
    lrwxrwxrwx 1 root root 17 jun 18 06:27 libclntsh.so -> libclntsh.so.12.1

### Variables d'environnement

Le client Oracle exploite des **variables d'environnement** qui doivent dès lors être définies en respectant le chemin correspondant à l'installation.

    $ sudo vim /etc/environment # sous Debian/Ubuntu
    ...
    LD_LIBRARY_PATH="/usr/local/lib/instantclient_12_1"
    TNS_ADMIN="/usr/local/lib/instantclient_12_1"
    ORACLE_BASE="/usr/local/lib/instantclient_12_1"
    ORACLE_HOME="/usr/local/lib/instantclient_12_1"

## Compilation extension OCI8

L'archive de l'extension est téléchargeable sur le site de PECL.

    $ cd /tmp
    $ wget http://pecl.php.net/get/oci8-2.0.8.tgz
    $ tar zxf oci8-2.0.8.tgz 
    $ ls oci8-2.0.8
    config.m4   LICENSE            oci8.dsp          oci8_lob.c        php_oci8_int.h
    config.w32  oci8.c             oci8_dtrace.d     oci8_statement.c  README
    CREDITS     oci8_collection.c  oci8_interface.c  php_oci8.h        tests

Le binaire **phpize** est inclus dans le paquet **php5-dev** sous Debian/Ubuntu.

    $ cd /tmp/oci8-2.0.8
    $ phpize
    Configuring for:
    PHP Api Version:         20100412
    Zend Module Api No:      20100525
    Zend Extension Api No:   220100525
    $ ./configure --with-oci8=share,instantclient,/usr/local/lib/instantclient_12_1
    configure: creating ./config.status
    config.status: creating config.h
    config.status: executing libtool commands
    $ make 
    Build complete.
    Don't forget to run 'make test'.
    $ sudo make install
    Installing shared extensions:     /usr/lib/php5/20100525+lfs/
    $ ls -lh /usr/lib/php5/20100525+lfs/
    -rwxr-xr-x 1 root root 406K jun 18 09:41 oci8.so

## Activation extension OCI8

Il reste à dire à PHP de charger l'extension via le **php.ini**. Il peut exister un fichier de configuration différent par SAPI, 
il est donc possible qu'il faille en modifier plusieurs.

Par exemple, sous **Ubuntu 12.04 LTS** avec un PHP en provenance du **PPA http://ppa.launchpad.net/ondrej/php5-oldstable** :

    $ sudo vim /etc/php5/mods-available/oci8.ini
    extension=oci8.so
    $ ln -s /etc/php5/mods-available/oci8.ini /etc/php5/conf.d/10-oci8.ini
    $ ls -l /etc/php5/cli/
    lrwxrwxrwx 1 root root     9 mai  5 11:50 conf.d -> ../conf.d
    $ ls -l /etc/php5/cli/conf.d/10-oci8.ini 
    lrwxrwxrwx 1 root root 33 jun 18 06:59 /etc/php5/cli/conf.d/10-oci8.ini -> /etc/php5/mods-available/oci8.ini

L'extension est désormais disponible pour le **SAPI cli**.

    $ php -i |grep OCI
    OCI8 Support => enabled
    OCI8 DTrace Support => disabled
    OCI8 Version => 2.0.8

## Pour aller plus loin

- [http://php.net/manual/en/oci8.installation.php](http://php.net/manual/en/oci8.installation.php)
- [http://www.oracle.com/technetwork/articles/technote-php-instant-084410.html](http://www.oracle.com/technetwork/articles/technote-php-instant-084410.html)
