Title: Setup automatique de Centos 6.4 et Puppet avec Kickstart
Author: Alexandre Henriet
Slug: setup-automatique-de-centos-6.4-et-puppet-avec-kickstart
Date: 2013-05-13 18:00

## Contexte

Installation et configuration automatisées de serveurs sous Centos 6.4.

## Pré-requis

Cet article s'inscrit dans la continuité de **[Amorçage réseau de Debian 7.0 et Centos 6.4 via PXE](http://blog.henriet.eu/amorcage-reseau-de-debian-7.0-et-centos-6.4-via-pxe.html)**. Il part du principe que le boot de l'installeur de Centos via PXE pour une installation interactive est fonctionnel. La configuration du Puppet Master ayant également fait l'objet d'un **[billet précédent](http://localhost:8000/gestion-centralisee-de-serveurs-avec-puppet.html)**, elle n'est pas décrite non plus.

## Installation Kickstart

Mise au point par Red Hat et disponible pour Centos, la méthode d'**[installation Kickstart](http://www.centos.org/docs/5/html/Installation_Guide-en-US/ch-kickstart2.html)** exploite un fichier texte de configuration contenant les réponses aux questions habituellement posées par Anaconda pendant l'installation du système de manière à rendre celle-ci automatique.

## Workflow du setup

Les étapes d'une installation via la méthode présentée dans cet article s'enchainent comme suit :

- Boot de l'installeur Centos via **PXE**. Un paramètre supplémentaire dans la configuration de PXELINUX indique le chemin vers le fichier kickstart **ks.cfg** mis à disposition **via HTTP**.
- La saisie du **hostname** du système, requis pour configurer l'agent Puppet, est demandée au début de l'installation depuis la section **%pre** du fichier kickstart.
- Le reste de l'installation est **entièrement automatique** et utilise un **arbre d'installation** créé grâce au CD minimal de Centos et mis à disposition **via HTTP**.
- Installé depuis le **dépôt Puppetlabs**, Puppet s'active après le reboot post-installation de la machine, envoyant une requête de certificat au Puppet Master qu'il ne reste plus qu'à signer.

## Installation tree 

Une installation Kickstart a besoin d'accéder à un **installation tree**, une copie du CD d'installation avec la **[même
structure de dossiers](https://access.redhat.com/site/documentation/en-US/Red_Hat_Enterprise_Linux/5/html/Installation_Guide/s1-steps-network-installs-s390.html)**. Il peut être mis à disposition via NFS, FTP ou HTTP dans le cadre d'une installation réseau.

On crée l'arbre dans **/var/www/centos/6.4/os/i386** sur base de l'**ISO minimale**.

    $ wget http://centos.cu.be/6.4/isos/i386/CentOS-6.4-i386-minimal.iso
    $ mount -o loop CentOS-6.4-i386-minimal.iso /mnt/disk/
    $ mkdir -p /var/www/centos/6.4/os/i386/
    $ cp -rf /mnt/disk/* /var/www/centos/6.4/os/i386/
    $ du -hs /var/www/centos/6.4/os/i386/
    301M    /var/www/centos/6.4/os/i386/

On le sert **via HTTP** grâce à **Nginx**.

    $ vim /etc/nginx/conf.d/default.conf 
    server { 
      ...
      location / {
        root      /var/www;
        autoindex on;
        ...
    $ /etc/init.d/nginx restart
    Arrêt de nginx :                                           [  OK  ]
    Démarrage de nginx :                                       [  OK  ]

## Fichier ks.cfg

Le fichier de configuration Kickstart **ks.cfg** est un fichier texte divisé en 4 sections ordonnées :

* La section **Commandes** contient les différentes **[options de configuration](http://www.centos.org/docs/5/html/Installation_Guide-en-US/s1-kickstart2-options.html)**. Quand une option requise est manquante, Anaconda affiche l'écran correspondant pendant l'installation.
* La section **%packages** permet de fournir la liste des paquets devant être installés par **yum**. 
* La section **%pre** permet d'exécuter des commandes préalablement à l'installation.
* La section **%post** permet d'exécuter des commandes au terme de l'installation.

Il peut être créé via l'outil GUI **[Kickstart Configurator](http://www.centos.org/docs/5/html/Installation_Guide-en-US/ch-redhat-config-kickstart.html)** ou entièrement à la main en s'inspirant par exemple du fichier **/root/anaconda-ks.cfg** généré automatiquement par l'installation précédente. 

On le rend accessible via le même serveur HTTP que l'installation tree.
 
    $ vim /var/www/ks.cfg
    install
    text
    # Installation tree accessible via HTTP
    url --url=http://192.168.1.100/centos/6.4/os/i386/
    # Configuration de dépôts de paquets supplémentaires
    repo --name=full --baseurl=http://centos.cu.be/6.4/os/i386/
    repo --name=updates --baseurl=http://centos.cu.be/6.4/updates/i386/
    repo --name=epel --baseurl=http://download.fedoraproject.org/pub/epel/6/i386/
    repo --name=puppetlabs --baseurl=http://yum.puppetlabs.com/el/6/products/i386/
    lang fr_FR.UTF-8
    keyboard be-latin1
    # La configuration réseau générée dans la section %pre est inclue ici
    %include /tmp/network.cfg
    # Le mot de passe root crypté provient de l'installation précédente
    rootpw  --iscrypted $6$TI2rIlstoiFwUURe$nsXWX3p4WTSQyIC7Ir/lFgKz.ASQClCKmwmanEqJ0m1p4mPNccCqIsm.drSR0r7h0HFX7vG6m44b4C3ZgBX.z1
    firewall --service=ssh
    authconfig --enableshadow --passalgo=sha512
    selinux --enforcing
    timezone --utc Europe/Paris
    # Option requise pour éviter un popup en cas de disque non partitionné
    zerombr yes
    bootloader --location=mbr --driveorder=sda --append="crashkernel=auto rhgb quiet"
    clearpart --drives=sda --initlabel --all
    part /boot --fstype=ext4 --size=500
    part pv.008002 --grow --size=1
    volgroup vg_centos --pesize=4096 pv.008002
    logvol / --fstype=ext4 --name=lv_root --vgname=vg_centos --grow --size=1024 --maxsize=51200
    logvol swap --name=lv_swap --vgname=vg_centos --grow --size=4064 --maxsize=4064
    reboot
    %packages --nobase
      epel-release
      puppetlabs-release
      vim
      wget
      curl
      bzip2
      zip
      unzip
      ntpdate
      rsync
      which
      tree
      vixie-cron
      crontabs
      htop
      puppet
    %end
    # Par défaut %post est chrooté dans /mnt/sysimage. Pour accéder aux fichiers créés dans %pre, 
    # il est nécessaire de sortir du chroot avec --nochroot
    %post --nochroot --log=/mnt/sysimage/root/post_nochroot_install.log
      PUPPETMASTER="qbox"
      PUPPETMASTERIP="192.168.1.100"
      # Récupération du hostname de %pre
      NAME=`/mnt/sysimage/bin/cat /tmp/hostname.txt`
      # Ajout de l'host du puppetmaster dans la conf de puppet
      /mnt/sysimage/bin/echo "server=${PUPPETMASTER}" >> /mnt/sysimage/etc/puppet/puppet.conf  
      # Ajout de l'host du noeud au fichier hosts
      /mnt/sysimage/bin/sed -i "s/127.0.0.1/127.0.0.1 ${NAME}/" /mnt/sysimage/etc/hosts
      #/mnt/sysimage/bin/echo "127.0.0.1 ${NAME}" >> /mnt/sysimage/etc/hosts
      # Ajout de l'host du puppetmaster au fichier hosts
      /mnt/sysimage/bin/echo "${PUPPETMASTERIP} ${PUPPETMASTER}" >> /mnt/sysimage/etc/hosts
    %end
    %post --log=/root/post_install.log
      # Ajustement de l'heure système
      /usr/sbin/ntpdate ntp.belnet.be
      # Mise à jour des paquets
      /usr/bin/yum update -y >> /root/post_update.log
      # Activation de Puppet au boot
      /sbin/chkconfig puppet on
    %end
    # Une saisie clavier est provoquée pour obtenir l'hostname du système
    %pre
      chvt 6
      exec </dev/tty6 >/dev/tty6 2>/dev/tty6
      # Lecture Hostname au clavier
      read -p "Hostname : " NAME /dev/tty6
      # Ecriture network.cfg pour inclusion
      echo "network --onboot yes --device eth0 --bootproto dhcp --hostname ${NAME} --noipv6" > /tmp/network.cfg
      # Ecriture hostname.txt pour %post
      echo "${NAME}" > /tmp/hostname.txt
      chvt 1
    %end

## Hostname automatique 

On utilise la section **%pre** pour provoquer une saisie clavier du hostname, ce qui implique une interaction
de la part de l'administrateur. On pourrait envisager de générer automatiquement un hostname unique pour
chaque host. Quelques pistes à explorer pour des IDs uniques :

    $ dmidecode | grep UUID
    UUID: A42935F1-29E1-DE11-865B-A3D25800801A
    $ ifconfig eth0
    eth0      Link encap:Ethernet  HWaddr 00:13:54:B2:33:B2

## Configuration PXELINUX

On ajoute l'option **ks=url** au **append** de l'entrée Centos 6.4 du fichier **pxelinux.cfg/default**.

    LABEL Centos
        MENU LABEL Centos 6.4
        kernel centos/6.4/i386/vmlinuz
        append ks=http://192.168.1.100/ks.cfg initrd=centos/6.4/i386/initrd.img ramdisk_size=1000000

## Enjoy

Au terme d'une installation ne requérant que la saisie du hostname, le serveur reboot et l'agent Puppet démarré
automatiquement prend le relai pour la configuration.

    $ puppet cert list
      "optimus" (SHA256) 57:A0:DF:45:3F:7A:23:2E:22:AE:7A:D5:08:34:97:D7:96:64:C4:D0:46:BD:BA:0D:41:BA:08:DA:D3:D5:78:37
    $ puppet cert sign optimus
    Notice: Signed certificate request for optimus
    Notice: Removing file Puppet::SSL::CertificateRequest optimus at '/var/lib/puppet/ssl/ca/requests/optimus.pem'
 
## Pour aller plus loin 
 
- [http://www.centos.org/docs/5/html/Installation_Guide-en-US/ch-kickstart2.html](http://www.centos.org/docs/5/html/Installation_Guide-en-US/ch-kickstart2.html)
- [http://wiki.centos.org/HowTos/CreateLocalMirror](http://wiki.centos.org/HowTos/CreateLocalMirror)
- [http://wiki.centos.org/TipsAndTricks/KickStart](http://wiki.centos.org/TipsAndTricks/KickStart)
- [http://monzell.com/post/15547967527/automatically-set-the-hostname-during-kickstart](http://monzell.com/post/15547967527/automatically-set-the-hostname-during-kickstart) 
