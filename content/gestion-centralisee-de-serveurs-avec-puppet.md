Title: Gestion centralisée de serveurs avec Puppet
Author: Alexandre Henriet
Slug: gestion-centralisee-de-serveurs-avec-puppet
Date: 2013-04-30 18:00

## Contexte

Plus un parc serveurs s'agrandit, plus il devient difficile de gérer les hôtes manuellement via SSH.

## Puppet

Outil de **configuration management** open source écrit en ruby, Puppet fonctionne sur le modèle client-serveur.
Un agent déployé sur chacun des noeuds gérés se connecte de manière sécurisée au master centralisant les configurations afin d'y récupérer celle qui doit lui être appliquée. 

Les fichiers de configuration appelés **manifestes** sont rédigés dans un DSL ruby propre à Puppet. Ils décrivent l'**état final** dans lequel doit se trouver l'hôte et non comment y parvenir.

## Dépôts PuppetLabs

Pour disposer de versions à jour, plus stables, performantes et riches en fonctionnalités et 
surtout de **versions identiques** pour le master et les agents dans un parc potentiellement hétérogène, on utilise les **[dépôts de PuppetLabs](http://docs.puppetlabs.com/guides/puppetlabs_package_repositories.html)**, la société derrière Puppet, qui fournit des paquets propres aux distributions majeures.

### Centos

Pour Centos et autres RHEL-likes, on utilise **http://yum.puppetlabs.com**.

    $ wget http://yum.puppetlabs.com/el/6/products/i386/puppetlabs-release-6-7.noarch.rpm
    $ rpm -ivh puppetlabs-release-6-7.noarch.rpm
    attention: puppetlabs-release-6-7.noarch.rpm: Entête V4 RSA/SHA1 Signature, key ID 4bd6ec30: NOKEY
    Préparation...              ########################################### [100%]
       1:puppetlabs-release     ########################################### [100%]
    $ yum info puppet
    Loaded plugins: downloadonly, fastestmirror
    Loading mirror speeds from cached hostfile
     * base: be.mirror.eurid.eu
     * epel: be.mirror.eurid.eu
     * extras: be.mirror.eurid.eu
     * updates: be.mirror.eurid.eu
    Available Packages
    Name        : puppet
    Arch        : noarch
    Version     : 3.1.1
    Release     : 1.el6
    Size        : 926 k
    Repo        : puppetlabs-products

### Ubuntu

Pour Ubuntu et autres Debian-likes, on utilie **http://apt.puppetlabs.com**.

    $ wget http://apt.puppetlabs.com/puppetlabs-release-precise.deb
    $ dpkg -i puppetlabs-release-precise.deb 
    Sélection du paquet puppetlabs-release précédemment désélectionné.
    (Lecture de la base de données... 619124 fichiers et répertoires déjà installés.)
    Dépaquetage de puppetlabs-release (à partir de puppetlabs-release-precise.deb) ...
    Paramétrage de puppetlabs-release (1.0-7) ...
    $ apt-get update
    $ apt-cache show puppet|less
    Package: puppet
    Version: 3.1.1-1puppetlabs1
    Architecture: all
    Maintainer: Puppet Labs <info@puppetlabs.com>
    Installed-Size: 134

## Installation du master

Un paquet spécifique permet d'installer le master qui par défaut écoute sur le port TCP **8140**.

    $ apt-get install puppetmaster
    Les paquets supplémentaires suivants seront installés : 
      augeas-lenses facter hiera libaugeas-ruby1.8 libaugeas0 libjson-ruby libruby libshadow-ruby1.8 puppet-common puppetmaster-common
      ruby-json virt-what
    Paquets suggérés :
      augeas-doc augeas-tools libselinux-ruby1.8 ruby-selinux librrd-ruby1.8 librrd-ruby1.9 puppet-el vim-puppet stompserver libstomp-ruby1.8
      ruby-stomp rdoc libldap-ruby1.8 ruby-ldap puppetdb-terminus
    Les NOUVEAUX paquets suivants seront installés :
      augeas-lenses facter hiera libaugeas-ruby1.8 libaugeas0 libjson-ruby libruby libshadow-ruby1.8 puppet-common puppetmaster
      puppetmaster-common ruby-json virt-what
    0 mis à jour, 13 nouvellement installés, 0 à enlever et 0 non mis à jour.
    Il est nécessaire de prendre 0 o/1.438 ko dans les archives.
    Après cette opération, 5.904 ko d'espace disque supplémentaires seront utilisés.
    Souhaitez-vous continuer [O/n] ? o
    ...
    $ ls /etc/puppet/
    auth.conf  fileserver.conf  manifests  modules  plugins  puppet.conf  templates
    $ ps -ef |grep puppet
    puppet    7314     1  0 10:19 ?        00:00:00 /usr/bin/ruby1.8 /usr/bin/puppet master --masterport=8140
    $ puppet --version
    3.1.1

## Installation de l'agent

Le paquet **puppet** est utilisé pour installer l'agent sur les différents noeuds.

    $ yum install puppet
    ======================================================================================================================================
    Package                      Arch                     Version                              Repository                             Size
    ======================================================================================================================================
    Installing:
     puppet                      noarch                   3.1.1-1.el6                          puppetlabs-products                   926 k
    Installing for dependencies:
     augeas-libs                 i686                     0.9.0-4.el6                          base                                  315 k
     compat-readline5            i686                     5.2-17.1.el6                         base                                  128 k
     dmidecode                   i686                     1:2.11-2.el6                         base                                   70 k
     facter                      i386                     1:1.7.0-1.el6                        puppetlabs-products                    84 k
     hiera                       noarch                   1.2.1-1.el6                          puppetlabs-products                    21 k
     libselinux-ruby             i686                     2.0.94-5.3.el6                       base                                   97 k
     pciutils                    i686                     3.1.10-2.el6                         base                                   85 k
     ruby                        i686                     1.8.7.352-10.el6_4                   updates                               533 k
     ruby-augeas                 i686                     0.4.1-1.el6                          epel                                   21 k
     ruby-irb                    i686                     1.8.7.352-10.el6_4                   updates                               312 k
     ruby-libs                   i686                     1.8.7.352-10.el6_4                   updates                               1.6 M
     ruby-rdoc                   i686                     1.8.7.352-10.el6_4                   updates                               376 k
     ruby-shadow                 i686                     1.4.1-13.el6                         epel                                   11 k
     rubygem-json                i386                     1.5.5-1.el6                          puppetlabs-deps                       763 k
     rubygems                    noarch                   1.3.7-1.el6                          base                                  206 k
     virt-what                   i686                     1.11-1.2.el6                         base                                   24 k
    
    Transaction Summary
    ======================================================================================================================================
    Install      17 Package(s)
    
    Total download size: 5.5 M
    Installed size: 16 M
    Is this ok [y/N]: y
    ...
    $ ps -ef |grep puppet
    $ puppet --version
    3.1.1

## Configuration de l'agent

Par défaut l'agent utilise le hostname **puppet** défini au niveau du serveur DNS ou dans le fichier /etc/hosts 
pour trouver le master mais il est possible de définir un autre hôte via son **fqdn** dans la configuration de l'agent.

    $ vim /etc/puppet/puppet.conf
    [agent]
    server = 'zabimaru.home'

## Certificats SSL

Puppet utilise **[SSL](http://projects.puppetlabs.com/projects/1/wiki/certificates_and_security)** pour assurer la sécurité des échanges entre les agents et le master. Lors de sa première connexion au master, une demande de certificat est soumise par l'agent qui ne pourra se connecter réellement qu'une fois celle-ci signée.

On lance l'agent en mode standalone pour voir ce qui se passe.

    $ puppet agent --test
    Info: Creating a new SSL key for centos.home
    Info: Caching certificate for ca
    Info: Creating a new SSL certificate request for centos.home
    Info: Certificate Request fingerprint (SHA256): 3F:72:BC:B3:6D:90:A4:EA:8B:17:C0:23:92:A3:C9:A4:D7:3E:5B:53:D3:43:9D:FB:BE:04:EC:C2:74:A8:BB:B1
    Exiting; no certificate found and waitforcert is disabled

Côté master, on peut constater que plusieurs connexions ont eu lieu et qu'une requête de certificat est en attente.
Comme l'agent est reconnu, celle-ci peut être signée.

    $ cat /var/log/puppet/masterhttp.log
    [2013-04-29 19:25:16] 192.168.1.3 - - [29/Apr/2013:19:25:16 CEST] "GET /production/certificate/ca? HTTP/1.1" 200 855
    [2013-04-29 19:25:16] - -> /production/certificate/ca?
    [2013-04-29 19:25:26] 192.168.1.3 - - [29/Apr/2013:19:25:26 CEST] "GET /production/certificate/centos.home? HTTP/1.1" 404 48
    [2013-04-29 19:25:26] - -> /production/certificate/centos.home?
    [2013-04-29 19:25:36] 192.168.1.3 - - [29/Apr/2013:19:25:36 CEST] "GET /production/certificate_request/centos.home? HTTP/1.1" 404 56
    [2013-04-29 19:25:36] - -> /production/certificate_request/centos.home?
    [2013-04-29 19:25:46] 192.168.1.3 - - [29/Apr/2013:19:25:46 CEST] "PUT /production/certificate_request/centos.home HTTP/1.1" 200 4
    [2013-04-29 19:25:46] - -> /production/certificate_request/centos.home
    [2013-04-29 19:25:56] 192.168.1.3 - - [29/Apr/2013:19:25:56 CEST] "GET /production/certificate/centos.home? HTTP/1.1" 404 48
    [2013-04-29 19:25:56] - -> /production/certificate/centos.home?
    [2013-04-29 19:26:06] 192.168.1.3 - - [29/Apr/2013:19:26:06 CEST] "GET /production/certificate/centos.home? HTTP/1.1" 404 48
    [2013-04-29 19:26:06] - -> /production/certificate/centos.home?
    $ puppet cert list
      "centos.home" (SHA256) 3F:72:BC:B3:6D:90:A4:EA:8B:17:C0:23:92:A3:C9:A4:D7:3E:5B:53:D3:43:9D:FB:BE:04:EC:C2:74:A8:BB:B1
    $ puppet cert sign centos.home
      Notice: Signed certificate request for centos.home
      Notice: Removing file Puppet::SSL::CertificateRequest centos.home at '/var/lib/puppet/ssl/ca/requests/centos.home.pem'

Lorsqu'on exécute à nouveau l'agent, on constate qu'il se connecte désormais au master pour récupérer son **catalogue**
qui par défaut ne contient rien.

    $  puppet agent --test
    Info: Caching certificate for centos.home
    Info: Caching certificate_revocation_list for ca
    Info: Retrieving plugin
    Info: Caching catalog for centos.home
    Info: Applying configuration version '1367242196'
    Notice: Finished catalog run in 0.08 seconds

## Définition de noeuds

Les fichiers de configuration de Puppet sont appelés **manifestes** et ils ont l'extension **.pp**. Le seul fichier requis est **site.pp**. Il est possible de splitter la configuration dans plusieurs fichiers et de les intégrer via une directive **[import](http://docs.puppetlabs.com/puppet/3/reference/lang_import.html)**, toutefois il est désormais conseillé de préférer les **modules** qui sont chargés de manière automatique.

On définit dans le fichier **site.pp** une entrée **node** pour chaque hôte faisant tourner l'agent Puppet. Ces entrées sont utilisées pour assigner les modules ou resources à appliquer aux hôtes.

    $ vim /etc/puppet/manifests/site.pp
    node 'centos.home' {
        include 'nginx'
    }
    $ /etc/init.d/puppetmaster restart
     * Restarting puppet master

## Premier module

Pour faire très simple, un module définit une ou plusieurs **classes**, englobant elles-même une ou plusieurs **resources** (fichiers, packages) et est destiné à être appliqué à un ou plusieurs **noeuds**.

On crée le module **nginx** en respectant la **[structure des modules](http://docs.puppetlabs.com/puppet/3/reference/modules_fundamentals.html#module-layout)**. Celui-ci s'assure que le paquet nginx soit installé sur le système, que le service soit lancé et qu'une page de garde présentant la version de l'OS soit présente.

    $ cd /etc/puppet/modules/
    $ mkdir -p nginx/{manifests,files,templates}
    
Le fichier **init.pp** contient la classe portant le même nom que le module.
    
    $ vim nginx/manifests/init.pp
    class nginx {
        package { 'nginx':
          # le paquet doit être présent ou être installé
          ensure => installed,
        }
        file { 'default.conf':
          # chemin complet de destination
          path    => '/etc/nginx/conf.d/default.conf',
          # le fichier doit exister ou être créé
          ensure  => file,
          # implique que la resource de type paquet nommé 'nginx' (ci-dessus) ait été traitée au préalable.
          require => Package['nginx'],
          # correspond au fichier /etc/puppet/modules/nginx/files/default.conf sur le master.
          source  => "puppet:///modules/nginx/default.conf",
          owner  => 'root', 
          group  => 'root', 
          mode   => 0644,
        }
        file { 'var-www':
          path    => '/var/www',
          ensure  => directory,
          owner   => 'root',
          group   => 'root',
          mode    => 0755,
        }
        file { 'index.html':
          # implique que la resource de type fichier nommée 'var-www' (ci-dessus) ait été traitée au préalable.
          require => File['var-www'],
          path    => '/var/www/index.html',
          # interprête le template index.html.erb pour déterminer le contenu du fichier.
          content => template('nginx/index.html.erb'),
          ensure  => file,
          owner   => 'root',
          group   => 'root',
          mode    => 0644,
        }
        service { 'nginx':
          name      => 'nginx',
          # le service doit tourner
          ensure    => running,
          # le service doit être activé automatiquement au démarrage
          enable    => true,
          # le service doit être redémarré lorsque le fichier suivant est modifié
          subscribe => File['default.conf'],
        }
    }
    
Le fichier de configuration de nginx sera copié tel quel depuis le master.

    $ vim /etc/puppet/modules/nginx/files/default.conf
    server {
        listen 80;
        server_name  _;
        charset utf-8;
        location / {
            root   /var/www;
            index  index.html;
        }
    }

Le contenu de la page de garde est généré dynamiquement d'après un template au format **erb**, le moteur de templates utilisé par **Rails**. Les variables en provenance des manifestes et de facter lui sont accessibles.

    $ vim /etc/puppet/modules/nginx/templates/index.html.erb
    This is <%= fqdn %> running <%= operatingsystem + ' ' + operatingsystemrelease %>

## Facter

L'installation de Puppet entraine celle de **facter**, un outil qui permet d'obtenir moult informations
sur le système. Celles-ci peuvent être utilisées dans les manifestes et les templates.

    $ facter | less
    ...
    domain => home
    facterversion => 1.7.0
    filesystems => ext3,ext4
    fqdn => zabimaru.home
    hardwareisa => i686
    hardwaremodel => i686
    hostname => zabimaru
    id => root
    interfaces => eth0,lo,wlan0
    ipaddress => 127.0.1.1
    ipaddress_lo => 127.0.0.1
    ipaddress_wlan0 => 192.168.1.2
    is_virtual => false
    kernel => Linux
    kernelmajversion => 3.2
    kernelrelease => 3.2.0-40-generic-pae
    kernelversion => 3.2.0
    lsbdistcodename => precise
    lsbdistdescription => Ubuntu 12.04.2 LTS
    ...

## Exécution de l'agent

Lorsqu'il n'est pas exécuté en mode standalone, l'agent Puppet se transforme en démon et tourne en tâche de fond.
Il se connecte au master toutes les trentes minutes pour vérifier la présence d'un nouveau catalogue et l'applique
le cas échéant.

    $ puppet agent
    $ ps -ef |grep puppet
    root     18418     1 16 16:19 ?        00:00:00 /usr/bin/ruby /usr/bin/puppet agent
    root     18420 18418 16 16:19 ?        00:00:00 puppet agent: applying configurat
    $ /etc/init.d/puppet stop
    Stopping puppet agent:                                     [  OK  ]

## Enjoy

On exécute l'agent en mode standalone pour voir Puppet appliquer le module **nginx**.

    $ puppet agent --test
    Info: Retrieving plugin
    Info: Caching catalog for centos.home
    Info: Applying configuration version '1367339046'
    Notice: /Stage[main]/Nginx/Package[nginx]/ensure: created
    Notice: /File[default.conf]/content: 
    --- /etc/nginx/conf.d/default.conf	2013-02-22 07:51:58.000000000 +0100
    +++ /tmp/puppet-file20130430-18598-a6g107-0	2013-04-30 16:24:09.169163391 +0200
    @@ -1,53 +1,9 @@
    -#
    -# The default server
    -#
     server {
    -    listen       80 default_server;
    +    listen       80;
         server_name  _;
    -
    -    #charset koi8-r;
    -
    -    #access_log  logs/host.access.log  main;
    -
    +    charset utf-8;
         location / {
    -        root   /usr/share/nginx/html;
    -        index  index.html index.htm;
    +        root   /var/www;
    +        index  index.html;
         }
    -
    -    error_page  404              /404.html;
    -    location = /404.html {
    -        root   /usr/share/nginx/html;
    -    }
    -
    -    # redirect server error pages to the static page /50x.html
    -    #
    -    error_page   500 502 503 504  /50x.html;
    -    location = /50x.html {
    -        root   /usr/share/nginx/html;
    -    }
    -
    -    # proxy the PHP scripts to Apache listening on 127.0.0.1:80
    -    #
    -    #location ~ \.php$ {
    -    #    proxy_pass   http://127.0.0.1;
    -    #}
    -
    -    # pass the PHP scripts to FastCGI server listening on 127.0.0.1:9000
    -    #
    -    #location ~ \.php$ {
    -    #    root           html;
    -    #    fastcgi_pass   127.0.0.1:9000;
    -    #    fastcgi_index  index.php;
    -    #    fastcgi_param  SCRIPT_FILENAME  /scripts$fastcgi_script_name;
    -    #    include        fastcgi_params;
    -    #}
    -
    -    # deny access to .htaccess files, if Apache's document root
    -    # concurs with nginx's one
    -    #
    -    #location ~ /\.ht {
    -    #    deny  all;
    -    #}
     }
    -
    -

    Info: FileBucket adding {md5}7cf4437a31deefb65301e16b2010306b
    Info: /File[default.conf]: Filebucketed /etc/nginx/conf.d/default.conf to puppet with sum 7cf4437a31deefb65301e16b2010306b
    Notice: /File[default.conf]/content: content changed '{md5}7cf4437a31deefb65301e16b2010306b' to '{md5}222fb57e3cb62d181f93e488c12cae37'
    Info: /File[default.conf]: Scheduling refresh of Service[nginx]
    Notice: /File[var-www]/ensure: created
    Notice: /File[index.html]/ensure: defined content as '{md5}69814d1ec0baf391cceb0dc985e653c0'
    Notice: /Stage[main]/Nginx/Service[nginx]/ensure: ensure changed 'stopped' to 'running'
    Notice: /Stage[main]/Nginx/Service[nginx]: Triggered 'refresh' from 1 events
    Notice: Finished catalog run in 50.44 seconds

En l'absence de message d'erreur, il ne reste plus qu'à constater que nginx sert la page de garde.

    $ curl centos.home
    This is centos.home running CentOS 6.4


## Pour aller plus loin

- [http://docs.puppetlabs.com/learning/agent_master_basic.html](http://docs.puppetlabs.com/learning/agent_master_basic.html)
- [http://docs.puppetlabs.com/puppet/3/reference/lang_summary.html](http://docs.puppetlabs.com/puppet/3/reference/lang_summary.html)
- [http://docs.puppetlabs.com/puppet/3/reference/modules_fundamentals.html](http://docs.puppetlabs.com/puppet/3/reference/modules_fundamentals.html)
- [http://docs.puppetlabs.com/puppet/3/reference/lang_resources.html](http://docs.puppetlabs.com/puppet/3/reference/lang_resources.html)
- [http://docs.puppetlabs.com/puppet/3/reference/lang_datatypes.html](http://docs.puppetlabs.com/puppet/3/reference/lang_datatypes.html)
- [http://docs.puppetlabs.com/puppet/3/reference/lang_classes.html](http://docs.puppetlabs.com/puppet/3/reference/lang_classes.html)
- [http://docs.puppetlabs.com/puppet/3/reference/lang_node_definitions.html](http://docs.puppetlabs.com/puppet/3/reference/lang_node_definitions.html)
- [http://docs.puppetlabs.com/puppet/3/reference/lang_relationships.html](http://docs.puppetlabs.com/puppet/3/reference/lang_relationships.html)
- [http://docs.puppetlabs.com/guides/configuring.html](http://docs.puppetlabs.com/guides/configuring.html)
- [http://docs.puppetlabs.com/guides/templating.html](http://docs.puppetlabs.com/guides/templating.html)
- [http://docs.puppetlabs.com/guides/language_guide.html](http://docs.puppetlabs.com/guides/language_guide.html)
- [http://docs.puppetlabs.com/references/3.1.latest/type.html](http://docs.puppetlabs.com/references/3.1.latest/type.html)
- [http://bitcube.co.uk/content/puppet-errors-explained](http://bitcube.co.uk/content/puppet-errors-explained)

