Title: Hello world avec Django 1.5 
Author: Alexandre Henriet
Slug: hello-world-avec-django-1.5
Date: 2013-03-01 18:00

## Contexte

Développement d'une application web MVC propulsée par Python et Django 1.5.

## Suppression Django < 1.5

Il est vivement conseillé de supprimer une éventuelle version antérieure avant d'installer Django 1.5.
Quelques pistes sous **Ubuntu 12.04.2 LTS**.

    $ sudo apt-get remove --purge python-django*
    $ sudo pip uninstall django
    $ sudo rm -rf /usr/local/lib/python2.7/dist-packages/Django-1.*
    $ sudo rm -rf /usr/local/lib/python2.7/dist-packages/django/

## Installation Django

Censé fonctionner via **pip** en forçant la version mais ce n'est actuellement pas le cas.

    $ wget --content-disposition https://www.djangoproject.com/download/1.5/tarball/
    $ tar zxf Django-1.5.tar.gz && cd Django-1.5
    $ sudo python setup.py install

Lorsque Django 1.5 est correctement installé.

    $ django-admin.py --version
    1.5   
    $ python
    >>> import django
    >>> django.get_version()
    '1.5'

## Création d'un projet

Création d'un projet **demo** qui contiendra l'application **Hello world**.

    $ django-admin.py startproject demo 
    $ cd demo/
    $ ls
    demo  manage.py

## Création d'une application

Création de l'application **hello** au sein du projet **demo**.

    $ python manage.py startapp hello
    $ ls
    demo  hello  manage.py

Activation de l'application dans le projet.

    $ vim demo/settings.py
    INSTALLED_APPS = (
        ...
        'hello',
    )

## Création du controleur

Création d'un controleur pour traiter la requête. A noter qu'un controlleur est appelé **vue** selon la terminologie Django ..

    $ vim hello/views.py 
    from django.http import HttpResponse
    from django.template import Context, loader

    def index(request, name):
        if not name:
            name = 'world'
        template = loader.get_template('hello/index.html')
        context = Context({
            'name': name,
        })
        return HttpResponse(template.render(context))

## Création de la vue

Création d'une vue pour afficher le résultat du controleur. On parle ici de **template** selon la terminologie Django.

    $ mkdir -p hello/templates/hello/
    $ vim hello/templates/hello/index.html
    Hello {{name}}

## Création de la route

Création de la route **/hello/$name** pour appeler le controleur. Voir documentation des [Expressions rationnelles en Python](http://docs.python.org/2/library/re.html) pour comprendre le pattern.

    $ vim hello/urls.py
    from django.conf.urls import patterns, url
    from hello import views

    urlpatterns = patterns('', 
        url(r'^(?P<name>\w+)?$', views.index, name='index')
    ) 

La configuration des routes de l'application est chargée dans celle des routes du projet.

    $ vim demo/urls.py
    from django.conf.urls import patterns, include, url

    urlpatterns = patterns('',
        url(r'^hello/', include('hello.urls')),
    )

## Exécution

Django dispose d'un serveur web embarqué utilisable pendant le développement.

    $ python manage.py runserver
    Validating models...
    0 errors found
    March 01, 2013 - 03:03:18
    Django version 1.5, using settings 'demo.settings'
    Development server is running at http://127.0.0.1:8000/
    Quit the server with CONTROL-C.

## Enjoy

L'application **Hello world** peut-être testée dans un navigateur web.

    $ curl http://127.0.0.1:8000/hello/
    Hello world
    $ curl http://127.0.0.1:8000/hello/alex
    Hello alex 
