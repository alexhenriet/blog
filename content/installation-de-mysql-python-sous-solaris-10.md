Title: Installation de MySQL-python sous Solaris 10 
Author: Alexandre Henriet
Slug: installation-de-mysql-python-sous-solaris-10 
Date: 2013-02-07 06:00

## Contexte

L'installation via pip du package MySQL-python requis pour utiliser MySQL avec django plante sous Solaris 10.

## Situation initiale

Comme MySQL-python n'est pas installé, importer **MySQLdb** déclenche une exception.

    >>> import MySQLdb
    Traceback (most recent call last):
      File "<stdin>", line 1, in <module>
    ImportError: No module named MySQLdb

## Tentative d'installation via pip

L'installation plante car la librairie MySQL requise ne se trouve pas à l'endroit escompté.

    ~$ pip install mysql-python
    Downloading/unpacking mysql-python
    ...
    ld: fatal: library -lmysqlclient_r: not found
    ld: fatal: File processing errors. No output written to build/lib.solaris-2.10-sun4v.32bit-2.7/_mysql.so
    collect2: ld returned 1 exit status
    error: command 'gcc' failed with exit status 1
    ...

## Customisation du build de MySQL-python

Adaptation du **site.cfg** de MySQL-python pour **désactiver l'utilisation de la librairie threadsafe** qui d'après la [FAQ MySQL-python](http://mysql-python.sourceforge.net/FAQ.html) n'est pas disponible sur toutes les installations et pour définir le chemin vers le binaire **mysql_config**.

    ~$ find / -name mysql_config 2>/dev/null
    /usr/local/mysql/bin/mysql_config

    ~$ vim path_to/build/mysql-python/site.cfg
    [options]
    ...
    threadsafe = False
    mysql_config = /usr/local/mysql/bin/mysql_config

## Installation OK mais erreur à l'import

Le package MySQL-python customisé s'installe désormais correctement mais une librairie MySQL manquante déclenche toujours une exception lors de l'import de MySQLdb.

    path_to/build/mysql-python$ python setup.py build
    ...
    path_to/build/mysql-python$ python setup.py install
    Installed path_to/lib/python2.7/site-packages/MySQL_python-1.2.4-py2.7-solaris-2.10-sun4v.32bit.egg
    Processing dependencies for MySQL-python==1.2.4
    Finished processing dependencies for MySQL-python==1.2.4

    >>> import MySQLdb
    Traceback (most recent call last):
      File "<stdin>", line 1, in <module>
        import MySQLdb
      File "path_to/lib/python2.7/site-packages/MySQL_python-1.2.4-py2.7-solaris-2.10-sun4v.32bit.egg/MySQLdb/__init__.py", line 19, in <module>
        import _mysql
    ImportError: ld.so.1: python: fatal: libmysqlclient.so.15: open failed: No such file or directory

## Modification du LD_LIBRARY_PATH et réinstallation

Le chemin vers **libmysqlclient.so.15** est ajouté à la variable d'environnement **LD_LIBRARY_PATH** et le package est réinstallé.

    ~$ find / -name libmysqlclient.so.15 2>/dev/null
    /usr/local/mysql/lib/mysql/libmysqlclient.so.15
    ~$ export LD_LIBRARY_PATH="/usr/local/mysql/lib/mysql"

    path_to/build/mysql-python$ pip uninstall mysql-python
    Uninstalling MySQL-python:
      path_to/lib/python2.7/site-packages/MySQL_python-1.2.4-py2.7-solaris-2.10-sun4v.32bit.egg
    Proceed (y/n)? y
      Successfully uninstalled MySQL-python
    path_to/build/mysql-python$ rm -rf build/*
    path_to/build/mysql-python$ python setup.py build
    path_to/build/mysql-python$ python setup.py install

    ~$ echo "export LD_LIBRARY_PATH="/usr/local/mysql/lib/mysql" >> ~/.bashrc

Cette méthode fonctionne mais requiert d'exporter **LD_LIBRARY_PATH** lors de chaque nouvelle session via le **~/.bashrc**. L'alternative qui suit permet d'éviter ça. 

## Alternative : Compilation avec LDFLAGS

Plutôt que de définir LD_LIBRARY_PATH à chaque fois, on ajoute le path de la librairie MySQL à la variable d'environnement **LDFLAGS** avant la compilation de MySQL-python. On prend soin de spécifier l'ensemble des dossiers de librairies du système qu'on peut obtenir via **crle**.

    ~$ crle   
    Configuration file [version 4]: /var/ld/ld.config  
      Default Library Path (ELF):   /lib:/usr/lib:/usr/sfw/lib
      Trusted Directories (ELF):    /lib/secure:/usr/lib/secure  (system default)
    
    ~$ export LDFLAGS="-L/usr/local/mysql/lib/mysql:/usr/local/lib:/lib:/usr/lib:/usr/sfw/lib:/lib/secure:/usr/lib/secure -R/usr/local/mysql/lib/mysql:/usr/local/lib:/lib:/usr/lib:/usr/sfw/lib:/lib/secure:/usr/lib/secure"
    
    path_to/build/mysql-python$ pip uninstall mysql-python
    Uninstalling MySQL-python:
      path_to/lib/python2.7/site-packages/MySQL_python-1.2.4-py2.7-solaris-2.10-sun4v.32bit.egg
    Proceed (y/n)? y
      Successfully uninstalled MySQL-python
    path_to/build/mysql-python$ rm -rf build/*
    path_to/build/mysql-python$ python setup.py build
    path_to/build/mysql-python$ python setup.py install

## Enjoy

L'import de MySQLdb ne déclenche plus d'erreur.

    >>> import MySQLdb
    >>>
