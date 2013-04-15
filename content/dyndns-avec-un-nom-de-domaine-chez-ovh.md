Title: DynDNS avec un nom de domaine chez OVH
Author: Alexandre Henriet
Slug: dyndns-avec-un-nom-de-domaine-chez-OVH 
Date: 2013-04-15 18:00

## Contexte

Utiliser un nom de domaine avec une adresse IP dynamique.

## DynDNS

La connexion à Internet du particulier est aujourd'hui telle qu'il est tout à fait envisageable de faire tourner 
son propre serveur à la maison pour économiser des frais d'hébergement. Toutefois, les providers fournissant essentiellement 
des adresses IP dynamiques à leurs abonnés, il faut pour disposer d'un nom de domaine recourir aux **DynDNS**.

Le concept est relativement simple. Un client DynDNS installé sur le serveur contacte à intervalles réguliers ou lorsqu'un changement
d'IP est détecté le service qui gère le nom de domaine afin qu'il actualise au besoin l'adresse IP qui lui est associée.

## Services gratuits

Il existait jadis sur toile plusieurs fournisseurs de DynDNS gratuits. Ils possèdaient plusieurs noms de domaines dont les sous-domaines étaient librement enregistrables pour être utilisés comme DynDNS. Les plus connu étaient probablement **[Dyndns](http://www.dyndns.com)** et **[No-ip](http://www.noip.com)**. Ils ne semblent toutefois plus proposer aujourd'hui d'offre gratuite.

Le site **[http://freedns.afraid.org/](http://freedns.afraid.org/)** semble offrir ce type de service gratuitement, je n'ai cependant pas eu l'occasion de le tester.

## DynHOST OVH

Quiconque dispose d'un nom de domaine chez OVH peut bénéficier sans frais supplémentaires d'un ou plusieurs DynDNS à travers la fonctionnalité baptisée **DynHOST**. Celle-ci est accessible via **Domaine & DNS** / **Zone DNS** / **Type DynHOST** dans les options de configuration du domaine du **[Manager V3](https://www.ovh.com/managerv3/)**. Il suffit de spécifier le sous-domaine qui doit être utilisé comme DynDNS, l'IP initiale vers laquelle il doit pointer et de cocher "Voulez-vous créer un identifiant DynHOST" pour créer les identifiants à utiliser avec le client DynDNS. Il est ensuite possible d'utiliser n'importe quel client compatible avec le protocole **dyndns2** pour actualiser son nom de domaine dynamique.

## DDclient

Parmi les client DynDNS disponibles sous Linux, le plus connu est probablement **[DDclient](http://sourceforge.net/apps/trac/ddclient)**, disponible dans les paquets de la plupart des distributions. 

    $ apt-get install ddclient
    
    $ vim /etc/ddclient.conf
    protocol=dyndns2       # Protocole utilisé par OVH
    use=web, web=checkip.dyndns.com, web-skip='IP Address' # Une des méthodes disponibles pour déterminer l'IP
    server=www.ovh.com     # On remplace le serveur défini par celui d'OVH
    login=henriet.eu-mabox # Login créé pour le DynHOST
    password='***'         # Mot de passe créé pour le DynHOST
    ssl=yes
    daemon=300             # Délai entre chaque tentative d'actualisation
    mabox.henriet.eu       # Le DynHOST
    
    $ /etc/init.d/ddclient restart

    $ tail /var/log/syslog
    Apr 15 13:34:04 zangetsu ddclient[28241]: SUCCESS:  updating mabox.henriet.eu: good: IP address set to 91.178.253.***

    $ ping mabox.henriet.eu
    PING mabox.henriet.eu (91.178.253.***) 56(84) bytes of data.
    64 bytes from ***.253-178-91.adsl-dyn.isp.belgacom.be (91.178.253.***): icmp_seq=1 ttl=64 time=0.962 ms

## Autres clients DynDNS

Si DDclient ne répond pas à vos besoins, OVH propose sur sa page de présentation de DynHOST d'**[autres clients](http://guides.ovh.com/DynDns#link5)** susceptibles d'être utilisés pour actualiser votre DynDNS.

## Multi-domaines

Il est tout à fait possible de faire pointer des **CNAME** vers un DynHOST et de disposer ainsi de multiples domaines dynamiques
en actualisant un seul DynDNS.

## Pour aller plus loin

- [http://guides.ovh.com/DynDns](http://guides.ovh.com/DynDns)
- [http://sourceforge.net/apps/trac/ddclient/wiki/Usage](http://sourceforge.net/apps/trac/ddclient/wiki/Usage)
