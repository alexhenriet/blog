Title: Un serveur Linux maison avec Centos 6.4
Author: Alexandre Henriet
Slug: un-serveur-linux-maison-avec-centos-6-4
Date: 2013-04-18 18:00

## Contexte

Transformation d'une vieille EeeBox Asus en serveur pour soulager un VPS OVH à l'agonie.


## Préparation de la clé USB d'installation

L'EeeBox ne disposant pas de lecteur optique, l'installation est réalisée au moyen d'une **clé USB** rendue
bootable avec **[Unetbootin](http://unetbootin.sourceforge.net)** et l'image CD de Centos.

On se procure l'**ISO minimale** via un mirroir de téléchargement. Contrairement à l'ISO netinstall, celle-ci
permet une installation entièrement **offline**.

    $ wget http://centos.cu.be/6.4/isos/i386/CentOS-6.4-i386-minimal.iso
    $ ls -lh CentOS-6.4-i386-minimal.iso 
    -rw-rw-r-- 1 setsuna setsuna 301M avr 14 08:30 CentOS-6.4-i386-minimal.iso

On utilise **Unetbootin** pour transformer une clé USB préalablement formatée en **fat32** en clé d'installation 
bootable grâce à l'option **DiskImage** et l'ISO téléchargée. 

L'astuce pour pouvoir réaliser une installation **offline** consiste à copier l'ISO complète, telle quelle, à la racine 
de la clé après avoir rendue cette dernière bootable.


## Installation de Centos 6.4

Au démarrage de l'EeeBox, on appuie sur la touche **F8** du clavier de manière à pouvoir choisir sur quel périphérique 
booter et on sélectionne la clé USB.

On installe Centos 6.4 normalement en fonction de ses préférences ou en acceptant simplement les propositions par défaut. 
Lors de la sélection du medium contenant les fichiers de l'installation, on opte pour **Hard disk** et on choisit le point de montage correspondant à la clé.

Une fois l'installation terminée, la clé est retirée et l'EeeBox redémarrée.


## Utilisateur non-privilégié

On crée un utilisateur standard pour l'usage quotidien.

    $ adduser setsuna -G wheel   # On ajoute l'utilisateur au groupe wheel
    $ passwd setsuna             # On définit un mot de passe pour l'utilisateur
    Changement de mot de passe pour l'utilisateur setsuna.
    Nouveau mot de passe : 
    Retapez le nouveau mot de passe :
    passwd : mise à jour réussie de tous les jetons d'authentification.

## Gestion fine des privilèges administrateur

On utilise **sudo** pour attribuer à l'utilisateur le minimum de privilèges requis. Chaque fois
qu'il est nécessaire de devenir **root**, on pense à modifier le fichier **sudoers** de sorte à pouvoir 
gérer à terme la machine presque exclusivement via sudo.

    $ visudo 
    Cmnd_Alias YUM = /usr/bin/yum update, /usr/bin/yum install * # Création d'une liste de commandes
    Cmnd_Alias DANGER = /sbin/reboot
    %wheel  ALL= NOPASSWD: YUM # Assignation de la liste de commandes aux membres du groupe système wheel (pas de mot de passe requis)
    %wheel  ALL= DANGER # Assignation aux membres du groupe système wheel (mot de passe requis)

## Connectivité réseau

L'interface réseau a besoin d'être activée dans la configuration. On en profite pour lui attribuer une adresse IP
statique plutôt que de se fier au DHCP.

    $ vi /etc/sysconfig/network-scripts/ifcfg-eth0
    ONBOOT=yes
    BOOTPROTO=static
    NETWORK=192.168.1.0
    NETMASK=255.255.255.0
    IPADDR=192.168.1.100
    GATEWAY=192.168.1.1
    $ /etc/init.d/network restart
    Activation de l'interface eth0 :
    Définition des informations IP pour eth9. fait. [ OK ]

## Configuration SSH

On limite l'accès SSH à l'utilisateur standard.

    $ vi /etc/ssh/sshd_config
    AllowUsers setsuna
    PermitRootLogin no  # Redondant, mais dans un souci de cohérence ..
    $ /etc/init.d/sshd restart

Idéalement, on autorise uniquement l'**[authentification par clés](http://doc.fedora-fr.org/wiki/SSH_:_Authentification_par_cl%C3%A9#L.27authentification_par_cl.C3.A9)**.

    $ mkdir /home/setsuna/.ssh
    $ chmod 700 /home/setsuna/.ssh/
    $ cat id_rsa.pub >> /home/setsuna/.ssh/authorized_keys
    $ chmod 600 /home/setsuna/.ssh/authorized_keys 
    $ chown -R setsuna: /home/setsuna/.ssh/
    $ vi /etc/ssh/sshd_config
    PasswordAuthentication no

L'option suivante peut être désactivée pour résoudre un problème de délai anormalement long lors des connexions.

    $ vi /etc/ssh/sshd_config
    GSSAPIAuthentication no


## Port 443 pour SSH avec SELinux

Pour faire écouter le serveur SSH sur le port **443** sous Centos, il est nécessaire de configurer **SELinux** 
qui par défaut interdit l'opération, ce port étant associé au protocol HTTPS.

    $ vi /etc/ssh/sshd_config
    port 22
    port 443
    $ /etc/init.d/sshd restart
    $ cat /var/log/secure
    Apr 16 22:20:31 qbox sshd[1742]: error: Bind to port 443 on 0.0.0.0 failed: Permission denied.
    Apr 16 22:20:31 qbox sshd[1742]: error: Bind to port 443 on :: failed: Permission denied.

On utilise pour ce faire l'outil **semanage** qui n'est pas disponible par défaut.

    $ yum provides /usr/sbin/semanage
    policycoreutils-python-2.0.83-19.30.el6.i686 : SELinux policy core python utilities
    Repo        : base
    Matched from:
    Filename    : /usr/sbin/semanage
    $ yum install policycoreutils-python
    $ semanage port -m -t ssh_port_t -p tcp 443
    $ port -l | grep ssh
    ssh_port_t                     tcp      443, 22


## Proxy authentifiant pour le traffic sortant

On configure un serveur proxy **Squid** pour autoriser le traffic sortant moyennant authentification. Des credentials spécifiques
sont créés dans un fichier users avec **htpasswd** pour ne pas avoir à encoder de mot de passe système en clair dans des fichiers de configuration.

    $ yum install httpd-tools
    $ htpasswd -c /etc/squid/users yum
    New password: 
    Re-type new password: 
    Adding password for user yum
    $ chown squid: /etc/squid/users
    $ chmod 400 /etc/squid/users

On configure **Squid** pour utiliser l'helper d'authentification **ncsa_auth**.

    $ yum install squid
    $ vim /etc/squid/squid.conf
    auth_param basic program /usr/lib/squid/ncsa_auth /etc/squid/users
    auth_param basic children 5
    auth_param basic realm Squid proxy-caching web server
    auth_param basic credentialsttl 2 hours
    auth_param basic casesensitive off
    acl authentified proxy_auth REQUIRED
    http_access deny !authentified
    http_access allow localnet
    http_access allow localhost
    http_access deny all
    visible_hostname mabox
    http_port 127.0.0.1:3128 # On écoute uniquement sur l'IP locale
    $ /etc/init.d/squid restart
    $ chkconfig squid on
    $ netstat -an |grep 3128
    tcp        0      0 127.0.0.1:3128              0.0.0.0:*                   LISTEN

On teste que le proxy fonctionne.

    $ export http_proxy="http://yum:yump4ss.@127.0.0.1:3128"
    $ wget www.google.fr
    2013-04-18 19:33:26 (106 MB/s) - «index.html» sauvegardé [10947]
    
## Pare-feu basique

On accepte le traffic entrant uniquement pour les services autorisés et le traffic sortant uniquement
via le proxy HTTP authentifiant ou vers des hôtes bien spécifiques.

    $ vi firewall.sh
    # Filter policies par défaut
    iptables -P INPUT ACCEPT  # Securité en cas de flush malencontreux
    iptables -P OUTPUT ACCEPT # Idem
    iptables -P FORWARD DROP
    # Filter Rules
    iptables -F # On nettoie tout
    iptables -A INPUT -i lo -j ACCEPT # On ne touche pas à l'interface locale 
    iptables -A INPUT -p icmp --icmp-type 8 -j ACCEPT # On autorise les pings
    iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT # On autorise les réponses entrantes
    iptables -A INPUT -m state --state NEW -m tcp -p tcp --dport  22 -j ACCEPT # On autorise quelques ports
    iptables -A INPUT -m state --state NEW -m tcp -p tcp --dport  80 -j ACCEPT #
    iptables -A INPUT -m state --state NEW -m tcp -p tcp --dport 443 -j ACCEPT #
    iptables -A INPUT -j DROP # On drop le reste
    iptables -A OUTPUT -o lo -j ACCEPT # On ne touche pas à l'interface locale
    iptables -A OUTPUT -p udp --dport  53 -m owner --uid-owner squid -j ACCEPT # On laisse à SQUID bosser
    iptables -A OUTPUT -p tcp --dport  21 -m owner --uid-owner squid -j ACCEPT
    iptables -A OUTPUT -p tcp --dport  80 -m owner --uid-owner squid -j ACCEPT
    iptables -A OUTPUT -p tcp --dport 443 -m owner --uid-owner squid -j ACCEPT
    iptables -A OUTPUT -p udp --dport  53 -m owner --uid-owner ddclient -j ACCEPT # Ainsi que DDCLIENT
    iptables -A OUTPUT -p tcp --dport  80 -d checkip.dyndns.com -m owner --uid-owner ddclient -j ACCEPT
    iptables -A OUTPUT -p tcp --dport 443 -d www.ovh.com -m owner --uid-owner ddclient -j ACCEPT
    iptables -A OUTPUT -p udp --dport 123 -d 194.50.97.34 -j ACCEPT
    iptables -A OUTPUT -p udp --dport 123 -d 195.13.23.5 -j ACCEPT
    iptables -A OUTPUT -p tcp --dport 587 -d 173.194.67.108 -j ACCEPT
    iptables -A OUTPUT -m state --state ESTABLISHED,RELATED -j ACCEPT # On autorise les réponses sortantes
    iptables -A OUTPUT -j DROP # On drop le reste
    $ chmod +x firewall.sh
    $ ./firewall.sh
    $ /etc/init.d/iptables save
    iptables : Sauvegarde des règles du pare-feu dans /etc/sysconfig/iptables : [ OK ]


## Mise à jour des packages

On utilise **yum** pour mettre à jour les paquets installés après avoir configuré le proxy.

    $ vim /etc/yum.conf
    [main]
    proxy=http://127.0.0.1:3128/
    proxy_username=yum
    proxy_password=yump4ss.
    $ yum update
    Transaction Summary
    ================================================================================
    Install       1 Package(s)
    Upgrade      13 Package(s)
    Total download size: 48 M
    Is this ok [y/N]: y
    ...
    Complete!

## Dépôt EPEL

On ajoute le dépôt de paquets EPEL (Extra Packages for Enterprise Linux).

    $ yum install wget
    $ wget http://dl.fedoraproject.org/pub/epel/6/i386/epel-release-6-8.noarch.rpm
    $ rpm -ivh epel-release-6-8.noarch.rpm
    $ ls /etc/yum.repos.d/
    CentOS-Base.repo       CentOS-Media.repo  epel.repo
    CentOS-Debuginfo.repo  CentOS-Vault.repo  epel-testing.repo
    $ yum install ddclient htop # etc.


## Synchronisation heure système

On configure le service **ntp** pour que le système reste à l'heure juste.

    $ yum install ntp
    $ vi /etc/ntp.conf
    server 194.50.97.34
    server 195.13.23.5
    $ /etc/init.d/ntpdate start
    ntpdate: Synchronizing with time server: [  OK  ]
    $ chkconfig ntpdate on

## Prévention des intrusions

On installe **fail2ban** pour se prémunir des attaques par force brute sur le serveur SSH. Après trois tentatives de connexion infructueuses, les assaillants sont blacklistés au niveau du firewall.

    $ yum install fail2ban
    $ vi /etc/fail2ban/jail.conf
    [ssh-iptables]
    enabled  = true
    filter   = sshd
    action   = iptables[name=SSH, port=ssh, protocol=tcp]
               sendmail-whois[name=SSH, dest=root, sender=fail2ban@example.com]
    logpath  = /var/log/secure
    maxretry = 3
    $ /etc/init.d/fail2ban restart
    $ chkconfig fail2ban on

Pour débloquer un hôte spécifique avant l'échéance du ban.

    $ iptables -L -v
    Chain fail2ban-SSH (1 references)
     pkts bytes target     prot opt in     out     source               destination
        3   180 DROP       all  --  any    any     vks102**.ip-37-59-1**.eu  anywhere
    $ iptables -D fail2ban-SSH -s vks102**.ip-37-59-1**.eu -j DROP

## Forward des emails via GMail

On installe **sSMTP** pour relayer les emails du serveur via GMail, utile pour l'alerting.

    $ yum install ssmtp mailx
    $ vi /etc/ssmtp/ssmtp.conf
    root=postmaster
    mailhub=173.194.67.108:587
    UseSTARTTLS=YES
    AuthUser=gmail_login
    AuthPass=gmail_password
    FromLineOverride=YES

## Notifications des mises à jour

On installe et configure **yum-cron** pour envoyer un rapport par email lorsque
des mises à jour de paquets sont disponibles.

    $ yum install yum-cron
    $ vi /etc/sysconfig/yum-cron
    # Don't install, just check (valid: yes|no)
    CHECK_ONLY=yes
    # Don't install, just check and download (valid: yes|no)
    # Implies CHECK_ONLY=yes (gotta check first to see what to download)
    DOWNLOAD_ONLY=no
    MAILTO=alex.henriet@gmail.com
    $ /etc/init.d/yum-cron start
    Activation de la mise à jour nocturne par yum :            [  OK  ]
    $ chkconfig yum-cron on

## Pour aller plus loin

- [http://wiki.centos.org/Manuals/ReleaseNotes/CentOS6.4](http://wiki.centos.org/Manuals/ReleaseNotes/CentOS6.4)
- [http://www.centos.org/docs](http://www.centos.org/docs)
- [https://access.redhat.com/site/documentation/en-US/Red_Hat_Enterprise_Linux/6/html/Deployment_Guide](https://access.redhat.com/site/documentation/en-US/Red_Hat_Enterprise_Linux/6/html/Deployment_Guide)
- [http://www.sudo.ws/sudo/man/1.8.6/sudoers.man.html](http://www.sudo.ws/sudo/man/1.8.6/sudoers.man.html)
- [http://rackerhacker.com/2010/04/12/best-practices-iptables](http://rackerhacker.com/2010/04/12/best-practices-iptables)
- [http://www.thegeekstuff.com/2011/06/iptables-rules-examples](http://www.thegeekstuff.com/2011/06/iptables-rules-examples)


