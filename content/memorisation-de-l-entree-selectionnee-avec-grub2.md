Title: Mémorisation de l'entrée sélectionnée avec Grub2
Author: Alexandre Henriet
Slug: memorisation-de-l-entree-selectionnee-avec-grub2 
Date: 2013-02-16 20:00

## Contexte

Par défaut Grub2 est configuré pour démarrer la première entrée de la liste sous Ubuntu.

## Configuration de Grub2 

    ~$ sudo -s
    ~# vim /etc/default/grub
    ...
    GRUB_DEFAULT=saved
    GRUB_SAVEDEFAULT=true
    ...

## Mise à jour du chargeur de démarrage 

    ~# update-grub2 
    Création de grub.cfg…
    Image Linux trouvée : /boot/vmlinuz-3.5.0-23-generic
    Image mémoire initiale trouvée : /boot/initrd.img-3.5.0-23-generic
    Image Linux trouvée : /boot/vmlinuz-3.5.0-17-generic
    Image mémoire initiale trouvée : /boot/initrd.img-3.5.0-17-generic
    Found memtest86+ image: /boot/memtest86+.bin
    Windows 7 (loader) trouvé sur /dev/sda1
    fait

## Enjoy

Lors du prochain démarrage, Grub2 mémorisera votre sélection.
