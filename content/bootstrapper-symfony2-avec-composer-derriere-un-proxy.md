Title: Bootstrapper Symfony2 avec Composer derrière un proxy
Author: Alexandre Henriet
Slug: bootstrapper-symfony2-avec-composer-derriere-un-proxy
Date: 2013-04-27 18:00

## Contexte
  
Dans certaines entreprises, l'accès à Internet est bridé par un pare-feu qui impose l'utilisation d'un proxy pour quitter le LAN. Voici comment amorcer un projet **[Symfony2](http://symfony.com)** avec **[Composer](http://getcomposer.org)** à travers un proxy HTTP **authentifiant** avec uniquement les **ports distants 80** et **443** autorisés.
  
## PHP

Depuis la version **5.4**, un serveur Web de développement est intégré à PHP-cli. Avec une version antérieure, il est nécessaire de configurer un environnement complet avec un serveur web comme **Apache HTTPd** ou **Nginx**.
  
    $ php -v
    PHP 5.4.14-1~precise+1 (cli) (built: Apr 11 2013 14:30:34) 
    Copyright (c) 1997-2013 The PHP Group
    Zend Engine v2.4.0, Copyright (c) 1998-2013 Zend Technologies
  
## Installation de Composer
  
La méthode priviligée pour installer Symfony2 passe désormais par **Composer**, le gestionnaire de dépendances de PHP, comparable à bundler pour Ruby.

### Tentatives infructueuses
  
Derrière le firewall, la commande d'installation proposée dans la documentation ne passe pas. Les noms de domaines ne sont pas résolus et le traffic réseau est filtré.

    $ curl -sS https://getcomposer.org/installer| php
    curl: (6) Couldn't resolve host 'getcomposer.org'

En passant à **curl** les paramètres du proxy, l'installeur de composer est bien téléchargé mais c'est PHP qui se mange le mur au moment de l'exécuter.
  
    $ curl -sS --proxy proxy_host:proxy_port --proxy-user proxy_login:proxy_password https://getcomposer.org/installer|php
    #!/usr/bin/env php
    All settings correct for using Composer
    Downloading...
    Download failed: file_get_contents(): php_network_getaddresses: getaddrinfo failed: Name or service not known
    file_get_contents(https://getcomposer.org/composer.phar): failed to open stream: php_network_getaddresses: getaddrinfo failed: Name or service not known
    Downloading...
    Download failed: file_get_contents(): php_network_getaddresses: getaddrinfo failed: Name or service not known
    file_get_contents(https://getcomposer.org/composer.phar): failed to open stream: php_network_getaddresses: getaddrinfo failed: Name or service not known
    Downloading...
    Download failed: file_get_contents(): php_network_getaddresses: getaddrinfo failed: Name or service not known
    file_get_contents(https://getcomposer.org/composer.phar): failed to open stream: php_network_getaddresses: getaddrinfo failed: Name or service not known
    The download failed repeatedly, aborting.

### Solution

Pour que PHP puisse également passer à travers le proxy, on utilise les variables d'environnement **http_proxy** et **https_proxy**. Comme curl ne les supportes pas et on aime pas se répéter deux fois, on utilise **wget** à la place.

    $ export http_proxy="http://proxy_login:proxy_pass@proxy_host:proxy_port"
    $ export https_proxy=$http_proxy
    $ wget --no-check-certificate -q -O- https://getcomposer.org/installer | php
     #!/usr/bin/env php
     All settings correct for using Composer
     Downloading...
     Composer successfully installed to: /home/alex/www/composer.phar
     Use it: php composer.phar
  
## Installation de Symfony2

Pour installer une distribution de Symfony2, on utilise l'option **create-project** du **composer.phar** généré par la commande précédente.

### Tentatives infructueuses

Par défaut Composer tente de se connecter à Github sur le port **1080** alors que le proxy n'autorise que les ports HTTP standards **80** et **443**.
  
    $ php composer.phar create-project symfony/framework-standard-edition /home/alex/www/demo 2.1.x-dev
    Installing symfony/framework-standard-edition (2.1.x-dev 31cd2476d90e4bc8b54622b1b91f59779a6eed42)
      - Installing symfony/framework-standard-edition (2.1.x-dev 31cd247)
        Cloning 31cd2476d90e4bc8b54622b1b91f59779a6eed42

    [RuntimeException]
    Failed to clone http://github.com/symfony/symfony-standard.git via git, https and http protocols, aborting.

    - git://github.com/symfony/symfony-standard.git
      fatal: unable to connect to github.com:
      github.com[0: 207.97.227.239]: errno=Le réseau n'est pas accessible
    
    - https://github.com/symfony/symfony-standard.git
      error: Failed connect to github.com:1080; Connection refused while accessing https://github.com/symfony/symfony-standard.git/info/refs
      fatal: HTTP request failed
    
    - http://github.com/symfony/symfony-standard.git
      error: Failed connect to github.com:1080; Connection refused while accessing http://github.com/symfony/symfony-standard.git/info/refs
      fatal: HTTP request failed

L'option **diagnose** révèle un problème corrigé en définissant une autre variable d'environnement, toutefois cela ne résout nullement le problème précédent.

    $ php composer.phar diagnose
    Checking platform settings: OK
    Checking http connectivity: OK
    Checking HTTP proxy: OK
    Checking HTTPS proxy support for request_fulluri: FAIL
    It seems there is a problem with your proxy server, try setting the "HTTP_PROXY_REQUEST_FULLURI" environment variable to "false"
    Checking composer version: OK
    $ export HTTP_PROXY_REQUEST_FULLURI=false
    $ php composer.phar diagnose
    Checking platform settings: OK
    Checking http connectivity: OK
    Checking HTTP proxy: OK
    Checking HTTPS proxy support for request_fulluri: OK
    Checking composer version: OK

### Solution

En passant l'option **--prefer-dist** à Composer, les dépendances sont correctement téléchargées via HTTP sous forme d'archives
zip qui sont en prime cachées dans **$HOME/.composer/cache/files**.

    $ php composer.phar create-project --prefer-dist symfony/framework-standard-edition /home/alex/www/demo 2.1.x-dev
    Installing symfony/framework-standard-edition (2.1.x-dev 31cd2476d90e4bc8b54622b1b91f59779a6eed42)
      - Installing symfony/framework-standard-edition (2.1.x-dev 31cd247)
        Downloading: 100%         

    Created project in /home/alex/www/demo
    Loading composer repositories with package information

      - Installing twig/twig (v1.12.2)
        Downloading: 100%         

      - Installing doctrine/common (2.3.0)
        Downloading: 100%         

      - Installing symfony/symfony (v2.1.9)
        Downloading: 100%         

      - Installing jdorn/sql-formatter (v1.2.0)
        Downloading: 100%         

      - Installing doctrine/dbal (2.3.3)
        Downloading: 100%
        ...

## Enjoy

Symfony2 est installé et prêt à être utilisé. Une commande de la console Symfony permet de lancer le serveur web intégré
à PHP 5.4 de sorte à rendre l'application accessible depuis un navigateur.

    $ php app/console server:run localhost:20000
    Server running on localhost:20000


