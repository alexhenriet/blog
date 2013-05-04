Title: Dépôt Composer avec Satis pour déploiements offline
Author: Alexandre Henriet
Slug: depot-composer-avec-satis-pour-deploiements-offline
Date: 2013-05-04 20:30

## Contexte

Quand le serveur hôte n'a pas accès à Internet, Composer ne peut pas atteindre Packagist, Github et autres pour 
télécharger les dépendances de l'application.


## Composer, Packagist et Satis

**[Composer](http://getcomposer.org)** est à PHP ce que Bundler est à Ruby, un outil de **gestion de dépendances**.
Il permet à chaque projet de disposer de ses propres versions de librairies sans impacter les autres.
Celles-ci sont référencées dans un fichier **composer.json** situé à la racine du projet et téléchargées par Composer lors du déploiement.

Par défaut, Composer utilise **[Packagist](https://packagist.org)** pour localiser et rapatrier les librairies.
Il s'agit d'un dépôt en-ligne destiné à centraliser l'ensemble des packages PHP installables via Composer.

**[Satis](https://github.com/composer/satis)** permet de créer des dépôts Composer, par exemple
pour servir des librairies privées.


## Cas d'utilisation

Cet article montre comment **Satis** peut être utilisé pour créer un dépôt Composer hébergeant sous forme d'archives une copie des dépendances de sorte qu'il soit possible de déployer sans Internet.
Le dépôt de cet exemple met à disposition les **vendors** dont dépend **Symfony 2.2**.

**Important**: La machine hébergeant Satis doit avoir accès à Internet pour archiver les librairies et le client git doit être installé.


## Installation de Satis

On utilise Composer pour installer Satis dans **/opt/satis**.

    $ wget http://getcomposer.org/composer.phar
    $ php composer.phar create-project --prefer-source composer/satis --stability=dev /opt/satis
    Installing composer/satis (dev-master 8da9420be2988a00b7311ca5cf5a64bb2604a9ee)
      - Installing composer/satis (dev-master master)
        Cloning master

    Created project in /opt/satis
    Loading composer repositories with package information
    Installing dependencies from lock file
      - Installing symfony/process (dev-master 46b24c5)
        Cloning 46b24c5905096914d467b769027e36433c7b5421

      - Installing symfony/finder (v2.2.1)
        Cloning v2.2.1

      - Installing symfony/console (dev-master adbc260)
        Cloning adbc260c08000aaa75c5f0db8347a29c21d16692

      - Installing seld/jsonlint (1.1.1)
        Cloning 1.1.1

      - Installing justinrainbow/json-schema (1.1.0)
        Cloning v1.1.0
    ...
    Do you want to remove the existing VCS (.git, .svn..) history? [Y,n]? y
    $ ls /opt/satis/
    bin  composer.json  composer.lock  LICENSE  phpunit.xml.dist  README.md  src  tests  vendor  views


## Configuration de Satis

Satis est configuré via un fichier au format json nommé arbitrairement **satis.json**. 

* **repositories** permet d'indiquer quels dépôts utiliser comme sources de paquets.
* **archive** permet d'activer et configurer le téléchargement et l'archivage local des dépendances.
* **require** permet de spécifier quelles librairies le dépôt doit contenir et dans quelles versions. Le contenu de celui-ci est directement copié du **composer.json** de **[Symfony 2.2.1](http://symfony.com/download?v=Symfony_Standard_2.2.1.tgz)**.

Une option **require-dependencies** permet de télécharger automatiquement les dépendances des dépendances lors de la création du dépôt par Satis. A moins de vouloir archiver un tas de paquets superflus pendant des heures, je la déconseille au profit d'une définition explicite des paquets.

    $ vim /opt/satis/satis.json
    {
        "name": "MyCompany",
        "homepage": "http://composer.mycompany.lan",
        "repositories": [
            { "type": "composer", "url": "http://packagist.org" }
        ],
        "archive": {
            "directory": "dist",
            "format": "zip",
            "skip-dev": true
        },
        "require-dependencies": false,
        "require": {
            "symfony/symfony": "2.2.*",
            "doctrine/orm": "~2.2,>=2.2.3",
            "doctrine/doctrine-bundle": "1.2.*",
            "twig/extensions": "1.0.*",
            "symfony/assetic-bundle": "2.1.*",
            "symfony/swiftmailer-bundle": "2.2.*",
            "symfony/monolog-bundle": "2.2.*",
            "sensio/distribution-bundle": "2.2.*",
            "sensio/framework-extra-bundle": "2.2.*",
            "sensio/generator-bundle": "2.2.*",
            "jms/security-extra-bundle": "1.4.*",
            "jms/di-extra-bundle": "1.3.*"
        }
    }

## Création et mise à jour du dépôt

Une seule et même commande est utilisée pour créer et mettre à jour le dépot dans **/var/opt/satis**.
    
    $ php /opt/satis/bin/satis build /opt/satis/satis.json /var/opt/satis
    Scanning packages
    Creating local downloads in '/var/opt/satis/dist'
    Dumping 'doctrine/doctrine-bundle-1.2.0.0'.
    Dumping 'doctrine/doctrine-bundle-1.2.0.0-beta1'.
    Skipping 'doctrine/doctrine-bundle-9999999-dev' (is dev)
    Dumping 'doctrine/orm-2.2.3.0'.
    Skipping 'doctrine/orm-2.2.9999999.9999999-dev' (is dev)
    Dumping 'doctrine/orm-2.3.0.0'.
    Dumping 'doctrine/orm-2.3.0.0-RC1'.
    Dumping 'doctrine/orm-2.3.0.0-RC2'.
    Dumping 'doctrine/orm-2.3.0.0-RC3'.
    Dumping 'doctrine/orm-2.3.0.0-RC4'.
    Dumping 'doctrine/orm-2.3.0.0-beta1'.
    Dumping 'doctrine/orm-2.3.1.0'.
    Dumping 'doctrine/orm-2.3.2.0'.
    Dumping 'doctrine/orm-2.3.3.0'.
    Skipping 'doctrine/orm-2.3.9999999.9999999-dev' (is dev)
    Dumping 'doctrine/orm-2.4.0.0-beta1'.
    Skipping 'doctrine/orm-9999999-dev' (is dev)
    Dumping 'jms/di-extra-bundle-1.3.0.0'.
    Dumping 'jms/di-extra-bundle-1.3.0.0-alpha'.
    Skipping 'jms/di-extra-bundle-9999999-dev' (is dev)
    Dumping 'jms/security-extra-bundle-1.4.0.0'.
    Dumping 'jms/security-extra-bundle-1.4.0.0-alpha'.
    Skipping 'jms/security-extra-bundle-9999999-dev' (is dev)
    Dumping 'sensio/distribution-bundle-2.2.0.0'.
    Dumping 'sensio/distribution-bundle-2.2.0.0-RC1'.
    Dumping 'sensio/distribution-bundle-2.2.0.0-RC2'.
    Dumping 'sensio/distribution-bundle-2.2.0.0-RC3'.
    Dumping 'sensio/distribution-bundle-2.2.0.0-beta1'.
    Dumping 'sensio/distribution-bundle-2.2.0.0-beta2'.
    Dumping 'sensio/distribution-bundle-2.2.1.0'.
    Skipping 'sensio/distribution-bundle-2.2.9999999.9999999-dev' (is dev)
    Dumping 'sensio/framework-extra-bundle-2.2.0.0'.
    Dumping 'sensio/framework-extra-bundle-2.2.0.0-RC1'.
    Dumping 'sensio/framework-extra-bundle-2.2.0.0-RC2'.
    Dumping 'sensio/framework-extra-bundle-2.2.0.0-RC3'.
    Dumping 'sensio/framework-extra-bundle-2.2.0.0-beta1'.
    Dumping 'sensio/framework-extra-bundle-2.2.0.0-beta2'.
    Dumping 'sensio/framework-extra-bundle-2.2.1.0'.
    Skipping 'sensio/framework-extra-bundle-2.2.9999999.9999999-dev' (is dev)
    Dumping 'sensio/generator-bundle-2.2.0.0'.
    Dumping 'sensio/generator-bundle-2.2.0.0-RC1'.
    Dumping 'sensio/generator-bundle-2.2.0.0-RC2'.
    Dumping 'sensio/generator-bundle-2.2.0.0-RC3'.
    Dumping 'sensio/generator-bundle-2.2.0.0-beta1'.
    Dumping 'sensio/generator-bundle-2.2.0.0-beta2'.
    Dumping 'sensio/generator-bundle-2.2.1.0'.
    Skipping 'sensio/generator-bundle-2.2.9999999.9999999-dev' (is dev)
    Skipping 'sensio/generator-bundle-9999999-dev' (is dev)
    Dumping 'symfony/assetic-bundle-2.1.0.0'.
    Dumping 'symfony/assetic-bundle-2.1.0.0-RC2'.
    Dumping 'symfony/assetic-bundle-2.1.1.0'.
    Dumping 'symfony/assetic-bundle-2.1.1.0-beta1'.
    Dumping 'symfony/assetic-bundle-2.1.2.0'.
    Skipping 'symfony/assetic-bundle-9999999-dev' (is dev)
    Dumping 'symfony/monolog-bundle-2.2.0.0'.
    Dumping 'symfony/monolog-bundle-2.2.0.0-RC2'.
    Dumping 'symfony/monolog-bundle-2.2.0.0-beta1'.
    Dumping 'symfony/monolog-bundle-2.2.0.0-beta2'.
    Skipping 'symfony/monolog-bundle-9999999-dev' (is dev)
    Dumping 'symfony/swiftmailer-bundle-2.2.0.0'.
    Dumping 'symfony/swiftmailer-bundle-2.2.0.0-beta1'.
    Dumping 'symfony/swiftmailer-bundle-2.2.0.0-beta2'.
    Dumping 'symfony/swiftmailer-bundle-2.2.1.0'.
    Skipping 'symfony/swiftmailer-bundle-9999999-dev' (is dev)
    Dumping 'symfony/symfony-2.2.0.0'.
    Dumping 'symfony/symfony-2.2.0.0-RC1'.
    Dumping 'symfony/symfony-2.2.0.0-RC2'.
    Dumping 'symfony/symfony-2.2.0.0-RC3'.
    Dumping 'symfony/symfony-2.2.0.0-beta1'.
    Dumping 'symfony/symfony-2.2.0.0-beta2'.
    Dumping 'symfony/symfony-2.2.1.0'.
    Skipping 'symfony/symfony-2.2.9999999.9999999-dev' (is dev)
    Dumping 'twig/extensions-1.0.0.0'.
    Dumping 'twig/extensions-1.0.0.0-alpha'.
    Skipping 'twig/extensions-9999999-dev' (is dev)
    Writing packages.json
    Writing web view
    $ ls /var/opt/satis
    dist  index.html  packages.json
    $ du -hs /var/opt/satis/dist
    142M	/var/opt/satis/dist/
    $ ls -l /var/opt/satis/dist | wc -l
    61
      
## Mise à disposition via HTTP

On rend le dépôt accessible via HTTP en utilisant son dossier comme **DOC_ROOT**.

    $ vim /etc/nginx/conf.d/default.conf
    location / {
        root   /var/opt/satis;
        index  index.html;
    }
    $ /etc/init.d/nginx restart
    Arrêt de nginx :                                           [  OK  ]
    Démarrage de nginx :                                       [  OK  ]
    $ curl -s http://composer.mycompany.lan/index.html | grep "<h1>"
                <h1>MyCompany Composer Repository</h1>

## Déploiement Symfony2

Pour déployer les **vendors** depuis le dépôt Satis, on ajoute celui-ci au **composer.json** du projet
et on désactive Packagist qui n'est de toute façon pas accessible.

    $ cd Symfony/
    $ vim composer.json
    "repositories": [
      {
        "type": "composer",
        "url": "http://composer.mycompany.lan"
      },
      {
        "packagist": false
      }
    ],

On lance ensuite Composer mais il échoue car certains paquets sont manquants sur le dépôt, 
les dépendances des dépendances n'ayant pas été installées.

    $ php composer.phar install --optimize-autoloader
    Loading composer repositories with package information
    Installing dependencies
    Your requirements could not be resolved to an installable set of packages.

      Problem 1
        - symfony/symfony v2.2.1 requires doctrine/common >=2.2,<3.0 -> no matching package found.
        - symfony/symfony v2.2.0-BETA2 requires doctrine/common >2.2,<2.4-dev -> no matching package found.
        - symfony/symfony v2.2.0-BETA1 requires doctrine/common >2.2,<2.4-dev -> no matching package found.
        - symfony/symfony v2.2.0-RC3 requires doctrine/common >=2.2,<3.0 -> no matching package found.
        - symfony/symfony v2.2.0-RC2 requires doctrine/common >=2.2,<3.0 -> no matching package found.
        - symfony/symfony v2.2.0-RC1 requires doctrine/common >=2.2,<3.0 -> no matching package found.
        - symfony/symfony v2.2.0 requires doctrine/common >=2.2,<3.0 -> no matching package found.
        - Installation request for symfony/symfony 2.2.* -> satisfiable by symfony/symfony[v2.2.0, v2.2.0-RC1, v2.2.0-RC2, v2.2.0-RC3, v2.2.0-BETA1, v2.2.0-BETA2, v2.2.1].

    Potential causes:
     - A typo in the package name
     - The package is not available in a stable-enough version according to your minimum-stability setting
       see <https://groups.google.com/d/topic/composer-dev/_g3ASeIFlrc/discussion> for more details.

    Read <http://getcomposer.org/doc/articles/troubleshooting.md> for further common problems.

L'option **require-dependencies** de Satis ne fonctionnant pas de manière optimale, on rajoute
les librairies manquantes une par une dans le satis.conf en mettant chaque fois à jour le dépôt.

    $ vim /opt/satis/satis.json
    ...
    "doctrine/common": ">=2.2,<3.0",
    "psr/log": ">=1.0,<2.0",
    "twig/twig": ">=1.11.0,<2.0",
    "doctrine/dbal": "2.3.*",
    "jdorn/sql-formatter": ">=1.1,<2.0",
    "kriswallsmith/assetic": "1.1.*",
    "swiftmailer/swiftmailer": ">=4.2.0,<4.4-dev",
    "monolog/monolog": ">=1.3,<2.0",
    "jms/aop-bundle": ">=1.0.0,<1.2-dev",
    "jms/metadata": "1.*",
    "jms/parser-lib": "1.*",
    "jms/cg": "1.0.0",
    "phpoption/phpoption": ">=0.9,<2.0-dev"
    $ php /opt/satis/bin/satis build /opt/satis/satis.json /var/opt/satis

## Enjoy

Une fois les paquets manquants ajoutés au dépôt, les vendors de Symfony2 peuvent être installés
depuis celui-ci sans accès Internet.

    $ rm -rf /root/.composer/cache/
    $ php composer.phar install
    Loading composer repositories with package information
    Installing dependencies from lock file
    Warning: The lock file is not up to date with the latest changes in composer.json. You may be getting outdated dependencies. Run update to update them.
      - Installing doctrine/lexer (v1.0)
        Downloading: 100%         
      - Installing doctrine/annotations (v1.1)
        Downloading: 100%         
      - Installing doctrine/cache (v1.0)
        Downloading: 100%         
      ...
      - Installing twig/extensions (v1.0.0)
        Downloading: 100%         

    kriswallsmith/assetic suggests installing leafo/lessphp (Assetic provides the integration with the lessphp LESS compiler)
    kriswallsmith/assetic suggests installing leafo/scssphp (Assetic provides the integration with the scssphp SCSS compiler)
    kriswallsmith/assetic suggests installing leafo/scssphp-compass (Assetic provides the integration with the SCSS compass plugin)
    kriswallsmith/assetic suggests installing ptachoire/cssembed (Assetic provides the integration with phpcssembed to embed data uris)
    monolog/monolog suggests installing doctrine/couchdb (Allow sending log messages to a CouchDB server)
    monolog/monolog suggests installing ext-amqp (Allow sending log messages to an AMQP server (1.0+ required))
    monolog/monolog suggests installing ext-mongo (Allow sending log messages to a MongoDB server)
    monolog/monolog suggests installing mlehner/gelf-php (Allow sending log messages to a GrayLog2 server)
    monolog/monolog suggests installing raven/raven (Allow sending log messages to a Sentry server)
    Generating autoload files
    Clearing the cache for the dev environment with debug true
    Installing assets using the hard copy option
    Installing assets for Symfony\Bundle\FrameworkBundle into web/bundles/framework
    Installing assets for Acme\DemoBundle into web/bundles/acmedemo
    Installing assets for Sensio\Bundle\DistributionBundle into web/bundles/sensiodistribution
    
## Pour aller plus loin

- [http://getcomposer.org/doc/articles/handling-private-packages-with-satis.md](http://getcomposer.org/doc/articles/handling-private-packages-with-satis.md)
