Title: Stack python depuis les sources sans les droits root 
Author: Alexandre Henriet
Slug: stack-python-depuis-les-sources-sans-les-droits-root 
Date: 2013-02-06 05:48

## Contexte

Besoin d'un environnement python à jour sans les privilèges root.

## Installation de python

Installation de python depuis les sources dans le répertoire personnel de l'utilisateur non-privilégié.

    ~$ wget http://www.python.org/ftp/python/2.7.3/Python-2.7.3.tgz
    ~$ tar -zxf Python-2.7.3.tgz
    ~$ cd Python-2.7.3
    ~/Python-2.7.3$ ./configure --prefix=/home/toto/python-2.7.3
    ...
    creating Makefile
    ~/Python-2.7.3$ make
    ~/Python-2.7.3$ make install
    ~$ ls /home/toto/python-2.7.3/
    bin  include  lib  share
    
    echo "export PATH=/home/toto/python-2.7.3/bin:$PATH" >> ~/.bashrc
    source ~/.bashrc
    ~$ which python
    /home/toto/python-2.7.3/bin/python
    ~$ python --version
    Python 2.7.3

## Installation de virtualenv

Création d'un environnement virtuel disposant de [distribute](http://pypi.python.org/pypi/distribute) et [pip](http://pypi.python.org/pypi/pip) dans **~/.python/**.

    ~$ wget https://raw.github.com/pypa/virtualenv/master/virtualenv.py
    ~$ python virtualenv.py ~/.python
    New python executable in /home/toto/.python/bin/python
    Installing setuptools............................done.
    Installing pip.....................done.
    ~$ ls ~/.python/
    bin  include  lib
    ~$ ls ~/.python/bin/
    activate      activate.fish     easy_install      pip      python   python2.7
    activate.csh  activate_this.py  easy_install-2.7  pip-2.7  python2
    
    ~$ sed -i "s/python-2.7.3\/bin/.python\/bin/" .bashrc
    ~$ tail -n1 ~/.bashrc
    export PATH=/home/toto/.python/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games
    ~$ source ~/.bashrc
    ~$ which python
    /home/toto/.python/bin/python
    ~$ python --version
    Python 2.7.3

## Enjoy

Exemple avec l'installation du framework web [django](https://www.djangoproject.com).

    ~$ pip install django
    Downloading/unpacking django
      Downloading Django-1.4.3.tar.gz (7.7MB): 7.7MB downloaded
      Running setup.py egg_info for package django
        
    Installing collected packages: django
      Running setup.py install for django
        changing mode of build/scripts-2.7/django-admin.py from 664 to 775
        
        changing mode of /home/toto/.python/bin/django-admin.py to 775
    Successfully installed django
    Cleaning up...
