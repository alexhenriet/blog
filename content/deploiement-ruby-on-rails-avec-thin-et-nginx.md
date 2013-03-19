Title: Déploiement Ruby on Rails avec Thin et Nginx 
Author: Alexandre Henriet
Slug: deploiement-ruby-on-rails-avec-thin-et-nginx
Date: 2013-03-19 18:00

## Contexte

Solution alternative au couple Apache/Phusion Passenger pour les déploiements ROR.

## Installation des dépendances

Les librairies nécessaires sont installées via l'outil de packaging de la distribution.

    $ apt-get install libssl-dev libreadline6-dev libmysqlclient-dev libsqlite3-dev libldap2-dev libyaml-dev libpcre3-dev git

## Optimisations GCC

Plus d'informations sur la page [http://en.gentoo-wiki.com/wiki/Safe_Cflags](http://en.gentoo-wiki.com/wiki/Safe_Cflags).

    $ export CFLAGS="-march=native -O2 -fomit-frame-pointer -pipe" && export CXXFLAGS="-march=native -O2 -fomit-frame-pointer -pipe"

## Installation de Ruby

Compilation depuis les sources de la dernière version de la branche 1.9.3.

    $ wget http://ftp.ruby-lang.org/pub/ruby/1.9/ruby-1.9.3-p392.tar.gz
    $ tar -zxf ruby-1.9.3-p392.tar.gz && cd ruby-1.9.3-p392
    $ ./configure --prefix=/opt/app/ruby-1.9.3-p392 --disable-install-doc
    $ make && make install
    $ echo "export PATH=/opt/app/ruby-1.9.3-p392/bin:$PATH" >> /etc/bash.bashrc && . /etc/bash.bashrc
    $ ruby -v
    ruby 1.9.3p392 (2013-02-22 revision 39386) [x86_64-linux]

## Installation des Gems

Mise à jour de RubyGems et installation des gems utilisées par l'application.

    $ gem update --system
    $ gem update
    $ gem install bundler
    $ cd /var/www/app && bundle install


## Configuration de Thin en mode démon

Le serveur web Ruby **[Thin](http://code.macournoyer.com/thin/)** est configuré pour démarrer au boot et servir le projet ROR.

    $ thin install
    >> Installing thin service at /etc/init.d/thin ...

    $ thin config -C /etc/thin/app -c /var/www/app --servers 3 -e production
    >> Wrote configuration to /etc/thin/app
 
    $ /etc/init.d/thin start
    [start] /etc/thin/app ...
    Starting server on 0.0.0.0:3000 ... 
    Starting server on 0.0.0.0:3001 ... 
    Starting server on 0.0.0.0:3002 ...
    
    $ /usr/sbin/update-rc.d -f thin defaults

## Installation Nginx

Compilation de la dernière version stable de Nginx depuis les sources.

    $ wget http://nginx.org/download/nginx-1.2.7.tar.gz
    $ tar -zxvf nginx-1.2.7.tar.gz && cd nginx-1.2.7
    $ ./configure --prefix=/opt/app/nginx --with-openssl=/usr/lib
    $ make && make install

Des **InitScripts** pour Nginx peuvent être téléchargé sur [http://wiki.nginx.org/InitScripts](http://wiki.nginx.org/InitScripts).

## Configuration de Nginx

Nginx est configuré pour faire office de **reverse proxy** pour Thin.

    $ vim /opt/app/nginx/conf/nginx.conf
    upstream app {
      server 127.0.0.1:3000;
      server 127.0.0.1:3001;
      server 127.0.0.1:3002;
    }
    server {
        listen       80;
        server_name  _;
        access_log /var/www/app/log/nginx_acces.log;
        error_log /var/www/app/log/nginx_error.log;
        root /var/www/app;
        index index.html;
        location / {
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header Host $http_host;
          proxy_redirect off;
          try_files /system/maintenance.html $uri $uri/index.html $uri.html @ruby;
        }
       location @ruby {
         proxy_pass http://app;
       }
    }

    $ /etc/init.d/nginx start
    Starting nginx: nginx.

## Enjoy

Les requêtes vers Nginx sont forwardées vers les instances Thin qui servent le projet ROR.
