Title: Stack AMP depuis les sources sans les droits root 
Author: Alexandre Henriet
Slug: stack-amp-depuis-les-sources-sans-les-droits-root 
Date: 2013-02-24 08:48

## Contexte

Besoin d'un environnement Apache-MySQL-PHP à jour et optimisé pour l'architecture cible sans les privilèges root ([phpinfo](./theme/pdf/amp.pdf)).

## Requirements

  - Une connexion internet pour télécharger les archives.
  - Les outils de compilation suivants dont l'installation sort du scope de cet article :
  
    **gcc, g++, make, cmake, libncurses5-dev, bison, libldap2-dev.**

## Optimisations GCC

Plus d'informations sur la page [http://en.gentoo-wiki.com/wiki/Safe_Cflags](http://en.gentoo-wiki.com/wiki/Safe_Cflags).

    $ export CFLAGS="-march=native -O2 -fomit-frame-pointer -pipe" && export CXXFLAGS="-march=native -O2 -fomit-frame-pointer -pipe"

## Installation des dépendances

Les librairies manquantes sur le système sont compilées et installées dans **/home/toto/lib/**.

### openssl

    $ wget http://www.openssl.org/source/openssl-1.0.1e.tar.gz
    $ gunzip -c openssl-1.0.1e.tar.gz | tar xf - && cd openssl-1.0.1e
    $ ./config --prefix=/home/toto/lib/openssl
    $ make && make install

### apr

    $ wget http://apache.belnet.be/apr/apr-1.4.6.tar.bz2
    $ bunzip2 -c apr-1.4.6.tar.bz2 | tar xf - && cd apr-1.4.6
    $ ./configure --prefix=/home/toto/lib/apr
    $ make && make install

### apr-util

    $ wget http://apache.belnet.be/apr/apr-util-1.5.1.tar.bz2
    $ bunzip2 -c apr-util-1.5.1.tar.bz2 | tar xf - && cd apr-util-1.5.1
    $ ./configure --prefix=/home/toto/lib/apr-util --with-apr=/home/toto/lib/apr --with-openssl=/home/toto/lib/openssl --width-ldap --with-ldap-lib=/usr/lib --with-ldap-include=/usr/include
    $ make && make install

### pcre

    $ wget http://downloads.sourceforge.net/project/pcre/pcre/8.32/pcre-8.32.tar.bz2
    $ bunzip2 -c pcre-8.32.tar.bz2 | tar xf - && cd pcre-8.32
    $ ./configure --prefix=/home/toto/lib/pcre/ --enable-utf --enable-unicode-properties --enable-jit --enable-pcre16 --enable-pcre32
    $ make && make install

### libxml2

    $ wget ftp://xmlsoft.org/libxml2/libxml2-2.9.0.tar.gz
    $ gunzip -c libxml2-2.9.0.tar.gz | tar xf - && cd libxml2-2.9.0
    $ ./configure --prefix=/home/toto/lib/libxml2
    $ make && make install

### libpng

    $ wget --content-disposition http://prdownloads.sourceforge.net/libpng/libpng-1.5.14.tar.gz?download
    $ gunzip -c libpng-1.5.14.tar.gz | tar xf - && cd libpng-1.5.14
    $ ./configure --prefix=/home/toto/lib/png
    $ make && make install

### libjpeg

    $ wget http://www.ijg.org/files/jpegsrc.v9.tar.gz
    $ gunzip -c jpegsrc.v9.tar.gz | tar xf - && cd jpeg-9
    $ ./configure --prefix=/home/toto/lib/jpeg
    $ make && make install

### icu

    $ wget http://download.icu-project.org/files/icu4c/50.1.2/icu4c-50_1_2-src.tgz
    $ gunzip -c icu4c-50_1_2-src.tgz | tar xf - && cd icu/source
    $ ./configure --prefix=/home/toto/lib/icu
    $ make && make install

### zlib

    $ wget http://zlib.net/zlib-1.2.7.tar.bz2
    $ bunzip2 -c zlib-1.2.7.tar.bz2 | tar xf - && cd zlib-1.2.7
    $ ./configure --prefix=/home/toto/lib/zlib
    $ make && make install

### curl

    $ wget http://curl.haxx.se/download/curl-7.29.0.tar.bz2
    $ bunzip2 -c curl-7.29.0.tar.bz2 | tar xf - && cd curl-7.29.0
    $ ./configure --prefix=/home/toto/lib/curl --with-ssl=/home/toto/lib/openssl
    $ make && make install

### autoconf

    $ wget http://ftp.gnu.org/gnu/autoconf/autoconf-latest.tar.gz
    $ gunzip -c autoconf-latest.tar.gz | tar xf - && cd autoconf-2.69
    $ ./configure --prefix=/home/toto/lib/autoconf
    $ make && make install
    $ echo "export PHP_AUTOCONF=/home/toto/lib/autoconf/bin/autoconf" >> ~/.bashrc
    $ echo "export PHP_AUTOHEADER=/home/toto/lib/autoconf/bin/autoheader" >> ~/.bashrc
    $ source ~/.bashrc

## Apache 2.4

### Compilation et installation

    $ wget http://apache.cu.be/httpd/httpd-2.4.3.tar.bz2
    $ bunzip2 -c httpd-2.4.3.tar.bz2 | tar xf - && cd httpd-2.4.3
    $ ./configure --prefix=/home/toto/apache --localstatedir=/home/toto/var  --with-apr=/home/toto/lib/apr --with-apr-util=/home/toto/lib/apr-util --with-pcre=/home/toto/lib/pcre --with-libxml2=/home/toto/lib/libxml2 --with-ssl=/home/toto/lib/openssl --enable-ssl --enable-rewrite --enable-so --enable-shared --enable-mime-magic --enable-authnz-ldap --enable-expires --enable-deflate --enable-dav --enable-mpms-shared
    $ make && make install
    $ echo "export PATH=/home/toto/apache/bin:\$PATH" >> ~/.bashrc && source ~/.bashrc

### Configuration
 
    $ vim /home/toto/apache/conf/httpd.conf
    User toto
    Group toto
    Listen 50080 # Seul root peut binder un port < 1024
    ServerName nom_serveur

### Test
 
    $ apachectl start
    $ ps -ef |grep httpd
    toto     18646     1  0 15:29 ?        00:00:00 /home/toto/httpd/bin/httpd -k start
    toto     18647 18646  0 15:29 ?        00:00:00 /home/toto/httpd/bin/httpd -k start
    toto     18648 18646  0 15:29 ?        00:00:00 /home/toto/httpd/bin/httpd -k start
    toto     18649 18646  0 15:29 ?        00:00:00 /home/toto/httpd/bin/httpd -k start
    $ wget -qO- localhost:50080
    <html><body><h1>It works!</h1></body></html>



## MySQL 5.6.10

### Compilation et installation

Plus de détails sur [http://dev.mysql.com/doc/refman/5.6/en/installing-source-distribution.html](http://dev.mysql.com/doc/refman/5.6/en/installing-source-distribution.html).

    $ wget http://downloads.sourceforge.net/project/mysql.mirror/MySQL%205.6.10/mysql-5.6.10.tar.gz
    $ gunzip -c mysql-5.6.10.tar.gz | tar xf - && cd mysql-5.6.10
    $ make clean && rm CMakeCache.txt # Pour nettoyer une précédente compilation
    $ cmake . -DCMAKE_INSTALL_PREFIX=/home/toto/mysql -DENABLE_DEBUG_SYNC=OFF -DMYSQL_UNIX_ADDR=/home/toto/var/mysql.sock -DMYSQL_DATADIR=/home/toto/var/mysql -DWITH_UNIT_TESTS=FALSE -DWITH_SSL=/home/toto/lib/openssl 
    $ make
    $ make install
    $ echo "export PATH=/home/toto/mysql/bin:\$PATH" >> ~/.bashrc && source ~/.bashrc

### Configuration

    $ chmod +x ./scripts/mysql_install_db
    $ ./scripts/mysql_install_db --user=toto --basedir=/home/toto/mysql --datadir=/home/toto/var/mysql
    $ cp support-files/mysql.server /home/toto/init.d/mysql
    $ chmod +x /home/toto/init.d/mysql

### Test

    $ /home/toto/init.d/mysql start
    Starting MySQL
    ..
    $ mysql -u root
    Welcome to the MySQL monitor.  Commands end with ; or \g.
    ...
    mysql> quit
    Bye

### Sécurisation du SGBD

Cette étape permet de définir un mot de passe pour le compte root mysql, supprimer l'accès anonyme, limiter l'accès à localhost, supprimer la base de données de test.

    $ mysql_secure_installation
 
## PHP 5.4.12
 
### Compilation et installation

    $ wget --content-disposition http://www.php.net/get/php-5.4.12.tar.bz2/from/be2.php.net/mirror
    $ bunzip2 -c php-5.4.12.tar.bz2 | tar xf - && cd php-5.4.12
    $ ./configure --prefix=/home/toto/php --with-apxs2=/home/toto/apache/bin/apxs --disable-cgi --with-mysql=/home/toto/mysql --with-mysqli=mysqlnd --enable-pdo --with-pdo-mysql=mysqlnd --with-libxml-dir=/home/toto/lib/libxml2 --with-openssl=/home/toto/lib/openssl --with-zlib=/home/toto/lib/zlib --with-pcre-regex=/home/toto/lib/pcre --with-sqlite3 --with-gd --with-png-dir=/home/toto/lib/png --with-jpeg-dir=/home/toto/lib/jpeg --with-ldap --with-icu-dir=/home/toto/lib/icu --with-curl=/home/toto/lib/curl --enable-soap --enable-sockets --enable-ftp --enable-bcmath --enable-intl --enable-mbstring --enable-zip
    $ make && make install
    $ echo "export PATH=/home/toto/php/bin:\$PATH" >> ~/.bashrc && source ~/.bashrc

### APC

L'extension APC (cache d'opcode) est installée via PECL.

    $ export CPATH=/home/toto/lib/pcre/include
    $ pecl install apc
    Build process completed successfully
    ...
    You should add "extension=apc.so" to php.ini

### Configuration

    $ cp php.ini-production /home/toto/php/lib/php.ini
    $ vim /home/toto/php/lib/php.ini
    extension=apc.so
    include_path = ".:/home/toto/php/lib/php"
    pdo_mysql.default_socket = /home/toto/var/mysql.sock
    mysql.default_socket = /home/toto/var/mysql.sock
    mysqli.default_socket = /home/toto/var/mysql.sock

### Test

    $ php -v
    PHP 5.4.12 (cli) (built: Feb 23 2013 11:26:13)
    Copyright (c) 1997-2013 The PHP Group
    Zend Engine v2.4.0, Copyright (c) 1998-2013 Zend Technologies

### Configuration Apache pour PHP

    $ vim /home/toto/apache/conf/httpd.conf
    ...
    LoadModule php5_module        modules/libphp5.so
    AddHandler application/x-httpd-php .php
    ...
    <IfModule dir_module>
        DirectoryIndex index.php index.html
    </IfModule>
    
    $ apachectl restart

## Enjoy

L'environnement ([phpinfo](./theme/pdf/amp.pdf)) a été testé compatible avec **Drupal 7.20** et **Wordpress 3.51**. Il ne reste plus qu'à peaufiner la configuration des trois briques.
