Title: Booster les performances de Django avec Memcached
Author: Alexandre Henriet
Slug: bootster-les-performances-de-django-avec-memcached
Date: 2013-04-10 18:00

## Contexte

Améliorer les performances d'une application Django hébergée sur un système de fichiers lent.

## Memcached

**[Memcached](http://memcached.org/)** est un serveur de cache de type entrepôt clé-valeur travaillant exclusivement en mémoire **RAM**. Il offre des performances très élevées mais pas de persistence des données, contrairement à **[Redis](http://redis.io/)** avec qui il est comparable. Sa capacité à fonctionner en **cluster** constitue une de ses grandes forces. Il est notamment utilisé par Facebook, Youtube et Twitter.


## Installation Memcached

On utilise le gestionnaire de paquets de la distribution, ici **Debian Squeeze 6.0.7.** Le serveur est démarré et opérationnel
immédiatement après l'installation.

    $ sudo apt-get install memcached # 1.4.5-1
    $ ps -ef |grep memcached
    nobody   16238     1  0 14:03 pts/1    00:00:00 /usr/bin/memcached -m 64 -p 11211 -u nobody -l 127.0.0.1

## Configuration Memcached

Les paramètres par défaut sont acceptables pour commencer. Le démon écoute le port TCP **11211** sur l'IP locale et **64 méga-octets** de RAM lui sont alloués pour stocker son cache. On peut modifier ces valeurs via le fichier **memcached.conf** moyennant un redémarrage du démon.

    $ sudo vim /etc/memcached.conf
    ...
    -m 64
    -l 127.0.0.1
    -u memcache
    ...
    $ sudo /etc/init.d/memcached restart

## Test de Memcached via telnet

Memcached peut écouter sur un **socket unix** ou un **socket TCP** comme c'est le cas par défaut. Son protocole simple permet de le tester facilement via **telnet**.

    $ telnet localhost 11211
    Connected to localhost.
    Escape character is '^]'.
    set mykey 0 0 8 # Définition de la clé mykey (drapeau expiration longueur)
    my value        # Stockage de la valeur 
    STORED          # Confirmation du stockage
    get mykey       # Demande de la valeur associée à mykey
    VALUE mykey 0 8 # Obtention des méta-data
    my value        # Obtention de la valeur
    END
    quit
    Connection closed by foreign host.

## Installation du binding python

Plusieurs bindings python sont disponibles sur **PyPI**. On installe **[python-memcached](https://pypi.python.org/pypi/python-memcached/1.31)** qui est référencé dans la documentation de Django.

    $ sudo pip install python-memcached
    Downloading/unpacking python-memcached
      Downloading python-memcached-1.48.tar.gz
      Running setup.py egg_info for package python-memcached
    Installing collected packages: python-memcached
      Running setup.py install for python-memcached
    Successfully installed python-memcached
    Cleaning up...

## Backend de cache Django

Memcached fait partie des différents backends de cache supportés par défaut. On les configure 
via le paramètre **CACHES** du **settings.py**.

    $ vim settings.py
    ...
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.memcached.MemcachedCache',
            'LOCATION': '127.0.0.1:11211',
        }
    }

## Per-site cache

La première manière d'utiliser Memcached avec Django consiste à cacher tout le site au moyen
de deux **middlewares** disponibles par défaut. L'output produit par chaque requête GET avec un code 200 
est caché en **RAM** pour une durée unique définie dans la configuration. Hyper-facile à mettre en oeuvre,
cette technique n'est toutefois par très flexible ..

    $ vim settings.py
    MIDDLEWARE_CLASSES = (
        'django.middleware.cache.UpdateCacheMiddleware',     # doit être le premier middleware
        ...
        'django.middleware.cache.FetchFromCacheMiddleware',  # doit être le dernier middleware
    )
    CACHE_MIDDLEWARE_ALIAS = 'default'       # Backend de cache à utiliser
    CACHE_MIDDLEWARE_SECONDS = 3600          # Lifetime du cache en secondes
    CACHE_MIDDLEWARE_KEY_PREFIX = 'pasteque' # Préfixe pour éviter les collisions de clés

Un **expire header** à destination du navigateur et correspondant à la durée de vie du cache est ajouté à la réponse HTTP par Django.

    Cache-Control:max-age=3600
    Date:Thu, 10 Apr 2013 18:20:02 GMT
    Expires:Thu, 10 Apr 2013 19:20:02 GMT
    Last-Modified:Thu, 10 Apr 2013 18:20:02 GMT
    Server:WSGIServer/0.1 Python/2.7.3

## Per-view cache

Une seconde manière d'utiliser Memcached avec Django consiste à configurer le cache par vue, soit en utilisant des **decorators**
dans le **views.py**, soit de manière beaucoup moins intrusive, au niveau de la configuration des URLs dans le **urls.py**.

    urlpatterns = patterns('',
        url(r'^$', cache_page(604800)(views.index), name='index'), # Vue cachée pour une semaine
        url(r'^paste/(?P<slug>[A-z0-9]+)/(?P<renderer>[a-z]+)?$', views.show, name='paste'),
        url(r'^history$', views.history, name='history'),
        url(r'^static/(?P<path>.*)', 'django.views.static.serve', {'document_root': settings.STATIC_ROOT}),
    )

## Test de la configuration de Django

Il est facile de valider que Django fait bien appel à Memcached lors d'une requête en se substituant à ce dernier
avec **netcat** pour écouter sur le port 11211.

    $ sudo /etc/init.d/memcached stop
    Stopping memcached: memcached.
    $ sudo nc -lp 11211
    $ netstat -an|grep 11211
    tcp        0      0 0.0.0.0:11211           0.0.0.0:*               LISTEN
    $ ./manage.py runserver paste.henriet.eu:16000
    Django version 1.5.1, using settings 'webtools.settings'
    Development server is running at http://paste.henriet.eu:16000/
    Quit the server with CONTROL-C.

Il suffit de naviguer sur une page cachée pour constater que Django fait bien appel à Memcached.

    $ sudo nc -lp 11211
    get :1:views.decorators.cache.cache_header..6666cd76f96956469e7be39d750cc7d9.fr-FR.CEST

## Statistiques

La commande **stats** permet d'obtenir quelques statistiques de Memcached.

    telnet localhost 11211
    Connected to localhost.
    stats
    STAT pid 16380
    STAT uptime 364
    STAT time 1365597845
    STAT version 1.4.5
    STAT pointer_size 64
    STAT rusage_user 0.060990
    STAT rusage_system 0.169974
    STAT curr_connections 5
    STAT total_connections 145
    STAT connection_structures 8
    STAT cmd_get 676
    STAT cmd_set 57
    STAT cmd_flush 0
    STAT get_hits 560
    STAT get_misses 116
    STAT delete_misses 0
    STAT delete_hits 0
    STAT incr_misses 0
    STAT incr_hits 0
    STAT decr_misses 0
    STAT decr_hits 0
    STAT cas_misses 0
    STAT cas_hits 0
    STAT cas_badval 0
    STAT auth_cmds 0
    STAT auth_errors 0
    STAT bytes_read 105284
    STAT bytes_written 75845
    STAT limit_maxbytes 67108864
    STAT accepting_conns 1
    STAT listen_disabled_num 0
    STAT threads 4
    STAT conn_yields 0
    STAT bytes 57431
    STAT curr_items 17
    STAT total_items 57
    STAT evictions 0
    STAT reclaimed 18
    END

## Pour aller plus loin

* [http://memcached.org/](http://memcached.org/)
* [https://docs.djangoproject.com/en/dev/topics/cache/](https://docs.djangoproject.com/en/dev/topics/cache/)
* [http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.9](http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.9)





