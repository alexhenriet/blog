Title: Déploiement de Symfony 3 avec PHP 7 et NGINX sur Debian 8 Jessie
Author: Alexandre Henriet
Slug: deploiement-de-symfony-3-avec-php-7-et-nginx-sur-debian-8.md
Date: 2015-12-16 06:00

## Contexte

Déploiement de la dernière version du framework de développement web Symfony 3 avec PHP 7 et NGINX sur Debian 8 Jessie. La procédure ci-dessous est incomplète et ne doit pas être utilisée telle quelle pour déployer en production.

    $ uname -a
    Linux 18b4326484b0 3.16.0-4-amd64 #1 SMP Debian 3.16.7-ckt11-1+deb8u6 (2015-11-09) x86_64 GNU/Linux
    $ cat /etc/issue
    Debian GNU/Linux 8 \n \l

## Configuration du dépôt Dotdeb

On commence par ajouter le dépôt Dotdeb à notre liste de repositories, c'est lui qui fournit la plupart des paquets à installer.

    $ wget https://www.dotdeb.org/dotdeb.gpg
    $ sudo apt-key add dotdeb.gpg
    OK
    $ sudo vim /etc/apt/sources.list.d/dotdeb.list
    deb http://packages.dotdeb.org jessie all
    deb-src http://packages.dotdeb.org jessie all
    $ sudo apt-get update

## Installation de Redis

On installe le datastore clé-valeur Redis pour stocker les **sessions PHP** de manière à réduire les écritures disque.

    $ sudo apt-get install redis-server
    $ sudo vim /etc/redis/redis.conf
    port 0 # on désactive l'écoute TCP pour des raisons de sécurité
    unixsocket /var/run/redis/redis.sock # on active le socket Unix
    unixsocketperm 777
    # logfile /var/log/redis/redis-server.log # on désactive le log fichier
    syslog-enabled yes # on active le log syslog
    syslog-ident redis
    requirepass monPasswordSecurePourRedis # on définit un mot de passe pour Redis
    rename-command CONFIG "" # on désactive la commande CONFIG

On lance Redis.

    $ sudo /etc/init.d/redis-server start
    Starting redis-server: redis-server.
    $ sudo ps -ef |grep redis
    redis     6195     1  0 07:20 ?        00:00:00 /usr/bin/redis-server 127.0.0.1:0          
    root      6203     1  0 07:20 ?        00:00:00 grep redis

On valide que la configuration est fonctionnelle.

    $ redis-cli 
    Could not connect to Redis at 127.0.0.1:6379: Connection refused
    not connected> quit
    $ redis-cli -s /var/run/redis/redis.sock
    redis /var/run/redis/redis.sock>
    redis /var/run/redis/redis.sock> CONFIG
    (error) ERR unknown command 'CONFIG'    
    redis /var/run/redis/redis.sock> PING
    (error) NOAUTH Authentication required.
    redis /var/run/redis/redis.sock> AUTH monPasswordSecurePourRedis
    OK
    redis /var/run/redis/redis.sock> PING
    PONG

## Installation de NGINX et PHP 7

On installe les paquets de PHP7 et NGINX.

    $ sudo apt-get install nginx php7.0-fpm php7.0-mysql php7.0-gd php7.0-json php7.0-curl php7.0-opcache
    0 upgraded, 99 newly installed, 0 to remove and 0 not upgraded.
    Need to get 32.5 MB of archives.
    After this operation, 132 MB of additional disk space will be used.
    Do you want to continue? [Y/n] y

On s'assure que PHP est bien installé.

    $ php -v
    PHP 7.0.0-5~dotdeb+8.1 (cli) NTS 
    Copyright (c) 1997-2015 The PHP Group
    Zend Engine v3.0.0, Copyright (c) 1998-2015 Zend Technologies
        with Zend OPcache v7.0.6-dev, Copyright (c) 1999-2015, by Zend Technologies

## Installation de l'extension phpredis

Dotdeb ne fournit pas l'équivalent du paquet **php5-redis** pour PHP 7, il faut donc installer l'extension phpredis à la main.

    $ sudo apt-get install php7.0-dev unzip make checkinstall
    $ wget https://github.com/phpredis/phpredis/archive/php7.zip
    $ unzip php7.zip
    $ cd phpredis-php7/
    $ phpize
    $ ./configure
    $ make
    $ sudo checkinstall -D -y --install=no --pkgname=php7.0-redis-custom --pkgversion=0.1
    $ sudo dpkg -i php7.0-redis-custom_0.1-1_amd64.deb
    $ find /usr/lib/php/ -name *.so|grep redis
    /usr/lib/php/20151012/redis.so

On crée le fichier de configuration de phpredis et on l'active pour les différents SAPI.

    $ sudo vim /etc/php/mods-available/redis.ini
    extension=redis.so
    $ cd /etc/php/7.0/fpm/conf.d
    $ sudo ln -s /etc/php/mods-available/redis.ini 20-redis.ini

## Configuration de PHP
    
On modifie ici la configuration du **SAPI fpm**, il ne faut pas oublier de configurer le **cli**.

    $ sudo vim /etc/php/7.0/fpm/php.ini
    ; On active le cache d'opcode intégré qui remplace APC.
    opcache.enable=1
    ; On s'assure de ne pas en dire trop sur notre environnement.
    display_errors = Off
    expose_php = Off
    ; On journalise vers syslog
    log_errors = On
    error_log = syslog
    ; On spécifie une timezone par défaut
    date.timezone = Europe/Brussels
    ; On définit Redis comme gestionnaire de sessions
    session.save_handler = redis
    session.save_path = "unix:///var/run/redis/redis.sock?auth=monPasswordSecurePourRedis"

## Configuration de PHP-FPM

On configure un pool pour l'utilisateur **alex** dans le home duquel sera créé le projet Symfony.

    $ cd /etc/php/7.0/fpm/pool.d/
    $ mv www.conf alex.conf
    $ vim alex.conf
    [alex] # On renomme le pool [www] 
    listen = /run/php/php7.0-fpm-alex.sock # On change le nom du socket unix par défaut
    user = alex # On remplace le user et le group des workers
    group = alex
    listen.owner = www-data # On conserve le listen owner
    listen.group = www-data

On s'assure que la syntaxe de notre fichier de configuration est valide et on lance PHP-FPM.

    $ /usr/lib/php/php7.0-fpm-checkconf
    $ sudo /etc/init.d/php7.0-fpm start
    $ ps -ef |grep php-fpm
    root      9637     1  0 12:19 ?        00:00:00 php-fpm: master process (/etc/php/7.0/fpm/php-fpm.conf)                    
    alex      9638  9637  0 12:19 ?        00:00:00 php-fpm: pool alex                                                         
    alex      9639  9637  0 12:19 ?        00:00:00 php-fpm: pool alex                                                         
    root      9641     1  0 12:19 ?        00:00:00 grep php-fpm

## Configuration de NGINX

Les fichiers de Symfony seront déployés dans **/home/alex/www/symfony**.

    $ cd /etc/nginx/site-available/
    $ sudo mv default alex-symfony
    $ sudo vim alex-symfony
    server {
        listen 80 default_server;
        listen [::]:80 default_server ipv6only=on;
        server_name _;
        root /home/alex/www/symfony/web;
        location / {
            try_files $uri /app.php$is_args$args;
        }
        location ~ ^/(app|app_dev|config)\.php(/|$) {
            fastcgi_pass unix:/var/run/php/php7.0-fpm-alex.sock;
            fastcgi_split_path_info ^(.+\.php)(/.*)$;
            include fastcgi_params;
            fastcgi_param  SCRIPT_FILENAME  $realpath_root$fastcgi_script_name;
            fastcgi_param DOCUMENT_ROOT $realpath_root;
        }
        error_log syslog;
        access_log syslog;
        location ~* \.(js|css|png|jpg|jpeg|gif|ico)$ {
            expires max;
            log_not_found off;
        }
    }
    $ cd /etc/nginx/sites-enabled
    $ sudo ln -s ../sites-available/alex-symfony

On lance NGINX.

    $ sudo /etc/init.d/nginx start
    $ ps -ef |grep nginx
    root      6067     1  0 12:52 ?        00:00:00 nginx: master process /usr/sbin/nginx
    www-data  6068  6067  0 12:52 ?        00:00:00 nginx: worker process
    root      6070     1  0 12:52 ?        00:00:00 grep nginx

## Test NGINX+PHP+Redis

On crée dans **/home/alex/www/symfony/web** un fichier **app.php** qui affiche la configuration de PHP lorsqu'on browse le serveur sur le port 80.

    $ mkdir -p /home/alex/www/symfony/web
    $ cd /home/alex/www/symfony/web
    $ vim app.php
    <?php
    phpinfo();

On modifie ensuite le fichier **app.php** pour stocker une valeur en session et on s'assure que Redis reçoit quelque-chose.

    $ vim app.php
    <?php
    session_start();
    $_SESSION['love'] = 'weasel';

Après avoir rechargé la page, on s'assure de la présence d'une entrée dans Redis.

    $ redis-cli -s /var/run/redis/redis.sock 
    redis /var/run/redis/redis.sock> AUTH monPasswordSecurePourRedis
    OK
    redis /var/run/redis/redis.sock> KEYS *
    1) "PHPREDIS_SESSION:o8pt5mugenilcpfcapnmpet5j1"

## Installation de Symfony 3

On installe Symfony via le nouvel installer officiel.

    $ sudo curl -LsS http://symfony.com/installer -o /usr/local/bin/symfony
    $ sudo chmod a+x /usr/local/bin/symfony
    $ cd /home/alex/www/ && rm -rf symfony/
    $ symfony new symfony
    $ ls symfony/
    README.md  app  bin  composer.json  composer.lock  phpunit.xml.dist  src  tests  var  vendor  web

On navigue sur l'URI **/app_dev.php** du serveur pour obtenir la page d'accueil du framework.

    Welcome to Symfony 3.0.0
    Your application is ready to start working on it at: /home/alex/www/symfony/

## Pour aller plus loin
 
  * [How to Set Up a Redis Server as a Session Handler for PHP on Ubuntu 14.04](https://www.digitalocean.com/community/tutorials/how-to-set-up-a-redis-server-as-a-session-handler-for-php-on-ubuntu-14-04)  
  * [Bonnes pratiques de déploiement PHP en 2015 (Youtube)](https://www.youtube.com/watch?v=8O-IeLRgsCI)
  * [Redis documentation](http://redis.io/commands)
  * [Symfony documentation](http://symfony.com/doc/current/index.html)
  * [PHP-FPM documentation](http://php-fpm.org/)
  * [Nginx documentation](http://nginx.org/en/docs/)
