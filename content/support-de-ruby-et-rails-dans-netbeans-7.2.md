Title: Support de Ruby et Rails dans Netbeans 7.2
Author: Alexandre Henriet
Slug: support-de-ruby-et-rails-dans-netbeans-7.2
Date: 2013-02-09 14:00

## Contexte

Ruby et Rails ne sont officiellement plus supportés depuis la version 7.0 de l'IDE. 
 
## Installation de Netbeans 7.2

Installation d'une version disponible sur le site, par exemple celle qui intègre le support PHP.

    ~$ wget http://download.netbeans.org/netbeans/7.2.1/final/bundles/netbeans-7.2.1-ml-php-linux.sh
    ~$ chmod +x netbeans-7.2.1-ml-php-linux.sh
    ~$ ./netbeans-7.2.1-ml-php-linux.sh
    ~$ echo "export PATH=\"~/path_to_netbeans-7.2.1/bin:\$PATH\"" >> ~/.bashrc && . ~/.bashrc

Plus de détails sur l'installation de Netbeans sont disponibles [ici](http://netbeans.org/community/releases/72/install.html).

## Support Ruby et Rails

Le plugin maintenu par la communauté est disponible via l'ajout d'une nouvelle source.

    ~$ netbeans

    > Menu Tools > Plugins > Settings > Add
    Name : Ruby
    URL : https://blogs.oracle.com/geertjan/resource/nb-72-community-ruby.xml

    > Menu Tools > Plugins > Available Plugins
    Cocher "Ruby and Rails" puis cliquer sur "Install"
    Suivre la procédure jusqu'au redémarrage de Netbeans

Plus de détails sur le support Ruby et Rails sous Netbeans 7.2 sont disponibles [ici](https://blogs.oracle.com/geertjan/entry/ruby_in_netbeans_ide_7). Une solution pour **Netbeans 7.1** était disponible [là](http://blog.enebo.com/2011/02/installing-ruby-support-in-netbeans-70.html).

## Enjoy

Création d'un projet Ruby ou Rails.
    
    > Menu File > New project > Ruby

