Title: Le b.a.-ba de MySQL et PostgreSQL
Author: Alexandre Henriet
Slug: le-b.a-ba-de-mysql-et-postgresql
Date: 2013-04-09 18:00

## Contexte

Présentation du minimum minimorum à connaître pour mettre en oeuvre et exploiter basiquement une base de données avec les SGBD open source **MySQL** et **PostgreSQL**.

## Cas d'étude : Pasteque

En plus de faire la correspondance entre les opérations essentielles en MySQL et PostgreSQL, ce document décrit la création et la configuration dans les deux SGBD d'une base de données pour le pastebin-like open source **[Pasteque](https://github.com/setsuna-/pasteque)**. 

Pour l'exemple, le serveur DB a comme adresse **192.168.1.5**, le serveur web **192.168.1.4** et l'accès à la base de données s'effectue avec l'utilisateur **pasteque**. 

## Documentation

### MySQL

**[http://dev.mysql.com/doc/](http://dev.mysql.com/doc/)**

### PostgreSQL

**[http://www.postgresql.org/docs/](http://www.postgresql.org/docs/)**

## Installation du SGBD

Le système d'exploitation **Debian Squeeze 6.0.7** est utilisé.

### MySQL

L'installation du serveur MySQL entraine celle du client en tant que dépendance.

    $ sudo apt-get install mysql-server # (5.1.66)
    $ ps -ef |grep mysql
    root      1978     1  0 09:15 ?        00:00:00 /bin/sh /usr/bin/mysqld_safe
    mysql     2089  1978  0 09:15 ?        00:00:01 /usr/sbin/mysqld --basedir=/usr --datadir=/var/lib/mysql --user=mysql --pid-file=/var/run/mysqld/mysqld.pid --socket=/var/run/mysqld/mysqld.sock --port=3306
    root      2090  1978  0 09:15 ?        00:00:00 logger -t mysqld -p daemon.error

### PostgreSQL

Le meta-package postgresql comprend le client et le serveur PostgreSQL.

    $ sudo apt-get install postgresql # (8.4)
    $ ps -ef |grep postgres
    postgres  3730     1  3 09:22 ?        00:00:01 /usr/lib/postgresql/8.4/bin/postgres -D /var/lib/postgresql/8.4/main -c config_file=/etc/postgresql/8.4/main/postgresql.conf
    postgres  3732  3730  0 09:22 ?        00:00:00 postgres: writer process
    postgres  3733  3730  0 09:22 ?        00:00:00 postgres: wal writer process
    postgres  3734  3730  0 09:22 ?        00:00:00 postgres: autovacuum launcher process
    postgres  3735  3730  0 09:22 ?        00:00:00 postgres: stats collector process

## Configuration

Par défaut, les deux SGBD n'écoutent que sur l'IP locale en attente de nouvelles connexions. Pour que Pasteque puisse accéder à la base de données depuis le serveur web, il est nécessaire de les configurer pour écouter également sur l'IP réseau du serveur.

    $ ifconfig eth0
    eth0      Link encap:Ethernet  HWaddr xx:xx:xx:xx:xx
              inet adr:192.168.1.5  Bcast:192.168.1.5.255  Masque:255.255.255.0
              ...
### MySQL

Le paramètre **bind-address** de la section mysqld permet de forcer l'écoute sur une IP donnée. Il suffit de le commenter pour écouter sur toutes les interfaces réseau. Par défaut, le démon MySQL écoute sur le port TCP **3306**.

    $ sudo vim /etc/mysql/my.cnf
    [mysqld]
    port         = 3306
    # bind-address = 192.168.1.5

Pour appliquer la nouvelle configuration, le SGBD est redémarré.

    $ sudo /etc/init.d/mysql restart
    Stopping MySQL database server: mysqld.
    Starting MySQL database server: mysqld.
    Checking for corrupt, not cleanly closed and upgrade needing tables..

On peut s'assurer que le SGBD est bien à l'écoute sur toutes les interfaces réseau.

    $ netstat -an|grep 3306
    tcp        0      0 0.0.0.0:3306       0.0.0.0:*               LISTEN

### PostgreSQL

Le paramètre **listen_addresses** permet de forcer l'écoute sur une ou plusieurs IP séparées par des virgules, tandis que **'*'** correspond à toutes les interfaces réseau. Par défaut, le démon PostgreSQL écoute sur le port TCP **5432**.

    $ sudo vim /etc/postgresql/8.4/main/postgresql.conf
    listen_addresses = '*'
    port = 5432

Pour appliquer la nouvelle configuration, le SGBD est redémarré.

    $ sudo /etc/init.d/postgresql restart
    Restarting PostgreSQL 8.4 database server: main.

On peut s'assurer que le SGBD est bien à l'écoute sur toutes les interfaces réseau.

    $ netstat -an|grep 5432
    tcp        0      0 0.0.0.0:5432            0.0.0.0:*               LISTEN
    tcp6       0      0 :::5432                 :::*                    LISTEN

**NB**: PostgreSQL dispose également d'un fichier **pg_hba.conf** utilisé pour configurer les accès et la sécurité (voir plus bas).





## Création d'une base de données

On se connecte au SGBD à l'aide du client command-line pour créer une DB **pasteque**.

### MySQL

Le compte **root** MySQL qui dispose des privilèges super-administrateur est utilisé.

    $ mysql -u root -p
    Enter password: 
    Welcome to the MySQL monitor.  Commands end with ; or \g.
    ...
    mysql> CREATE DATABASE pasteque;
    Query OK, 1 row affected (0.00 sec)
    
    mysql> show databases;
    +--------------------+
    | Database           |
    +--------------------+
    | information_schema |
    | mysql              |
    | pasteque           |
    +--------------------+
    3 rows in set (0.00 sec)
    
    mysql> QUIT
    Bye

### PostgreSQL

On switch vers l'utilisateur système **postgres** créé automatiquement lors de l'installation du SGBD et
on se connecte à l'aide du client **psql** en tant que super-administrateur.

    $ sudo su postgres
    $ psql
    psql (8.4.17)
    Saisissez « help » pour l'aide.
    postgres=# CREATE DATABASE pasteque;
    CREATE DATABASE

    postgres=# \l
                                    Liste des bases de données
        Nom    | Propriétaire | Encodage |     Tri     | Type caract. |    Droits d'accès     
    -----------+--------------+----------+-------------+--------------+-----------------------
     pasteque  | postgres     | UTF8     | fr_BE.UTF-8 | fr_BE.UTF-8  | 
     postgres  | postgres     | UTF8     | fr_BE.UTF-8 | fr_BE.UTF-8  | 
     template0 | postgres     | UTF8     | fr_BE.UTF-8 | fr_BE.UTF-8  | =c/postgres
                                                                      : postgres=CTc/postgres
     template1 | postgres     | UTF8     | fr_BE.UTF-8 | fr_BE.UTF-8  | =c/postgres
                                                                      : postgres=CTc/postgres
    (4 lignes)

    postgres=# \q

## Création d'un utilisateur

On crée l'utilisateur **pasteque** avec pour mot de passe '**p4st3qu3.'** et on lui donne accès
à la base de données **pasteque** lorsqu'il se connecte depuis le serveur web **192.168.1.4**.

### MySQL

On utilise l'utilisateur **root** MySQL pour se connecter.

    $ mysql -u root -p
    Enter password: 
    Welcome to the MySQL monitor.  Commands end with ; or \g.
    ...
    mysql> GRANT ALL PRIVILEGES ON pasteque.* TO 'pasteque'@'192.168.1.4' IDENTIFIED BY 'p4st3qu3.';
    Query OK, 0 rows affected (0.01 sec)

On peut vérifier depuis le serveur web que l'accès est fonctionnel.

    $ mysql -h 192.168.1.5 -P 3306 -u pasteque -p
    Enter password: 
    Welcome to the MySQL monitor.  Commands end with ; or \g.
    ...
    mysql> show databases;
    +--------------------+
    | Database           |
    +--------------------+
    | information_schema |
    | pasteque           |
    +--------------------+
    2 rows in set (0.00 sec)

### PostgreSQL

On utilise l'utilisateur système **postgres** pour se connecter.

    $ psql
    psql (9.1.8)
    Type "help" for help.
    ...
    postgres=# CREATE USER pasteque WITH PASSWORD 'p4st3qu3.';
    CREATE ROLE
    
    postgres=# \q

On crée ensuite une entrée pour le serveur web à la fin du fichier **pg_hba.conf** qui gère la sécurité et les accès et
on recharge la configuration pour prendre en compte la modification.

    $ sudo vim /etc/postgresql/8.4/main/pg_hba.conf
    host    pasteque    pasteque    192.168.1.4/32        password
    
    $ sudo /etc/init.d/postgresql reload
    Reloading PostgreSQL 8.4 database server: main.

On peut vérifier depuis le serveur web que l'accès est fonctionnel.

    $ psql -h 192.168.1.5 -p 5432 -U pasteque -W
    Password for user pasteque: 
    ...
    pasteque=>
    
## Création des tables avec Django

La création des tables de Pasteque est réalisée par l'outil d'administration de Django sur base des modèles
présents dans l'application et du driver DB configuré dans le **settings.py**. 

### MySQL

On choisit le driver MySQL et on indique le bon port.

    $ vim /opt/app/webtools/webtools/settings.py
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': 'pasteque',
            'USER': 'pasteque',
            'PASSWORD': 'p4st3qu3.',
            'HOST': '192.168.1.5',
            'PORT': '3306',
        }
    }

On synchronise la DB pour créer les tables.

    $ ./manage.py syncdb
    Creating tables ...
    Creating table paste_language
    Creating table paste_paste
    Installing custom SQL ...
    Installing indexes ...
    Installed 0 object(s) from 0 fixture(s)

On vérifie que tout s'est bien passé.

    $ mysql -h 192.168.1.5 -u pasteque -p pasteque
    mysql> show tables;
    +--------------------+
    | Tables_in_pasteque |
    +--------------------+
    | paste_language     |
    | paste_paste        |
    +--------------------+
    2 rows in set (0.00 sec)
    mysql> describe paste_language;
    +-------+--------------+------+-----+---------+----------------+
    | Field | Type         | Null | Key | Default | Extra          |
    +-------+--------------+------+-----+---------+----------------+
    | id    | int(11)      | NO   | PRI | NULL    | auto_increment |
    | name  | varchar(200) | NO   | UNI | NULL    |                |
    | slug  | varchar(200) | NO   | UNI | NULL    |                |
    +-------+--------------+------+-----+---------+----------------+
    3 rows in set (0.00 sec)

### PostgreSQL

On choisit le driver PostgreSQL et on indique le bon port.

    $ vim /opt/app/webtools/webtools/settings.py
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql_psycopg2',
            'NAME': 'pasteque',
            'USER': 'pasteque',
            'PASSWORD': 'p4st3qu3.',
            'HOST': '192.168.1.5',
            'PORT': '5432',
        }
    }

On synchronise la DB pour créer les tables.

    $ ./manage.py syncdb
    Creating tables ...
    Creating table paste_language
    Creating table paste_paste
    Installing custom SQL ...
    Installing indexes ...
    Installed 0 object(s) from 0 fixture(s)

On vérifie que tout s'est bien passé.

    $ psql -h 192.168.1.5 -U pasteque -W
    pasteque=> \dt
                 List of relations
     Schema |      Name      | Type  |  Owner
    --------+----------------+-------+----------
     public | paste_language | table | pasteque
     public | paste_paste    | table | pasteque
    (2 rows)
    pasteque=> \d paste_language
                                     Table "public.paste_language"
     Column |          Type          |                          Modifiers
    --------+------------------------+-------------------------------------------------------------
     id     | integer                | not null default nextval('paste_language_id_seq'::regclass)
     name   | character varying(200) | not null
     slug   | character varying(200) | not null
    Indexes:
        "paste_language_pkey" PRIMARY KEY, btree (id)
        "paste_language_name_key" UNIQUE, btree (name)
        "paste_language_slug_key" UNIQUE, btree (slug)
        "paste_language_name_like" btree (name varchar_pattern_ops)
        "paste_language_slug_like" btree (slug varchar_pattern_ops)
    Referenced by:
        TABLE "paste_paste" CONSTRAINT "paste_paste_language_id_fkey" FOREIGN KEY (language_id) REFERENCES paste_language(id) DEFERRABLE INITIALLY DEFERRED

## Exécution d'un fichier SQL

Un fichier SQL contenant les données de base de l'application est livré avec Pasteque. Une fois les tables créées, il peut être exécuté pour terminer l'installation de la DB.

### MySQL 

    $ mysql -h 192.168.1.5 -u pasteque -p pasteque
    ...
    mysql> source /opt/app/webtools/share/language-dml.sql
    mysql> select count(*) from paste_language;
    +----------+
    | count(*) |
    +----------+
    |       18 |
    +----------+
    1 row in set (0.00 sec)

### PostgreSQL

    $ psql -h 192.168.1.5 -p 5432 -U pasteque -W
    ...
    pasteque=> \i /opt/app/webtools/share/language-dml.sql
    pasteque=> select count(*) from paste_language;
     count 
    -------
        18
    (1 row)

## Utilisation en PHP

On s'assure qu'au moins un driver pour le SGBD est chargé dans le php.ini. Si **PDO** est disponible,
il s'agit certainement de la meilleure option car il dispose de plus de fonctionnalités et fournit une API commune pour interroger les différents les SGBD.

### MySQL

    $ php -m|grep mysql
    mysql
    mysqli
    pdo_mysql
    
    $ vim /tmp/demo-mysql.php
    <?php
    try {
        $db = new PDO("mysql:host=192.168.1.5;dbname=pasteque", 'pasteque', 'p4st3qu3.');
        $stmt = $db->prepare('SELECT p.name, p.slug FROM paste_language p WHERE p.slug=:slug');
        $stmt->execute(array(':slug'=>'bash'));
        print_r($stmt->fetchAll());
    } catch(Exception $err) {
        print $err->getMessage() . PHP_EOL;
    }
    
    $ php /tmp/demo-mysql.php 
    Array
    (
        [0] => Array
            (
                [name] => Bash (shell)
                [0] => Bash (shell)
                [slug] => bash
                [1] => bash
            )

    )

### PostgreSQL

    $ php -m |grep pg
    pdo_pgsql
    pgsql
    
    $ vim /tmp/demo-postgresql.php
    <?php
    try {
        $db = new PDO("pgsql:host=192.168.1.5;dbname=pasteque", 'pasteque', 'p4st3qu3.');
        $stmt = $db->prepare('SELECT p.name, p.slug FROM paste_language p WHERE p.slug=:slug');
        $stmt->execute(array(':slug'=>'bash'));
        print_r($stmt->fetchAll());
    } catch(Exception $err) {
        print $err->getMessage() . PHP_EOL;
    }
    
    $ php /tmp/demo-postgresql.php 
    Array
    (
        [0] => Array
            (
                [name] => Bash (shell)
                [0] => Bash (shell)
                [slug] => bash
                [1] => bash
            )

    )
    
## Utilisation en Python

Plusieurs drivers sont disponibles sur **PyPI** et installables via **pip**.

### MySQL

    $ vim /tmp/demo-mysql.py
    import MySQLdb
    try:
        con = MySQLdb.connect(host='192.168.1.5', db='pasteque', user='pasteque', passwd='p4st3qu3.')
        cur = con.cursor()
        cur.execute('SELECT p.name, p.slug FROM paste_language p WHERE p.slug = %s', 'bash')
        print cur.fetchall()
    except Exception, err:
        print err
    
    $ python /tmp/demo-mysql.py 
    (('Bash (shell)', 'bash'),)

### PostgreSQL

    $ vim /tmp/demo-postgresql.py
    import psycopg2
    try:
        con = psycopg2.connect(host='192.168.1.5', database='pasteque', user='pasteque', password='p4st3qu3.')
        cursor=con.cursor()
        cursor.execute('SELECT p.name, p.slug FROM paste_language p WHERE p.slug = %(slug)s', {'slug':'bash'})
        print cursor.fetchall()
    except Exception, err:
        print err
    
    $ python /tmp/demo-postgresql.py 
    [('Bash (shell)', 'bash')]


## Utilisation en Ruby

Plusieurs drivers sont disponibles sur **RubyGems** et installables via **gem**.

### MySQL

    $ vim /tmp/demo-mysql.rb
    require 'mysql2'
    begin
        con = Mysql2::Client.new(:host => '192.168.1.5', :database => 'pasteque', :username => 'pasteque', :password => 'p4st3qu3.')
        results = con.query("SELECT p.name, p.slug FROM paste_language p WHERE p.slug = '%s'" % con.escape('bash'))
        results.each do |result|
            puts result
        end
    rescue Exception => e
        puts e
    end
    
    $ ruby /tmp/demo-mysql.rb
    {"name"=>"Bash (shell)", "slug"=>"bash"}

### PostgreSQL

    $ vim /tmp/demo-postgresql.rb
    require 'pg'
    begin
        con = PG.connect(:host => '192.168.1.5', :dbname => 'pasteque', :user => 'pasteque', :password => 'p4st3qu3.')
        con.prepare('query', 'SELECT p.name, p.slug FROM paste_language p WHERE p.slug = $1')
        results = con.exec_prepared('query', ['bash'])
        results.each do |result|
            puts result
        end
    rescue Exception => e
        puts e
    end
    
    $ ruby /tmp/demo-pgsql.rb 
    {"name"=>"Bash (shell)", "slug"=>"bash"}

## Sauvegarder une base de données

Il est essentiel de sauvegarder régulièrement le contenu d'une base de données en prévision
d'une éventuelle restauration. Les deux SGBD fournissent un outil command-line comparable qui 
permet de prendre des **dumps** au format SQL d'une ou plusieurs bases.

### MySQL

Pour MySQL, l'outil s'appelle **mysqldump**. On sauvegarde le dump dans un fichier texte en redirigeant
sa sortie standard.

    $ mysqldump -h 192.168.1.5 -u pasteque -p pasteque > /tmp/dump-pasteque.mysql

### PostgreSQL

Pour PostgreSQL, l'outil s'appelle **pg_dump**. On sauvegarde le dump de la même manière.

    $ pg_dump -h 192.168.1.5 -U pasteque -W > /tmp/dump-pasteque.pgsql

## Restaurer une base de données

Pour restaurer une base de données, il suffit de ré-exécuter son **dump**.

### MySQL

En admettant que la base de données ait été vidée par erreur ..

    $ mysql -h 192.168.1.5 -u pasteque -p pasteque < /tmp/dump-pasteque.mysql

### PostgreSQL

En admettant la même maladresse ..

    $ psql -h 192.168.1.5 -U pasteque -W < /tmp/dump-pasteque.pgsql

## Clients lourds avec GUI

Pour ceux que la ligne de commande rebutte, il existe moult clients graphiques permettant d'interroger et/ou administrer les deux SGBD.

### MySQL

Parmi les outils disponibles, on trouve les fameux MySQL GUI Tools : **MySQL Query Browser** et **MySQL Administrator**,
le premier étant orienté utilisateurs, le second administrateurs. Ces outils assez anciens ne sont malheureusement plus compatibles avec les dernières versions de MySQL. On les trouve encore dans les paquets Ubuntu mais ils ne sont plus téléchargeables sur
le site. Ils ont été remplacés par le tout-en-un et un peu plus gourmand en ressources **[MySQL Workbench](http://dev.mysql.com/downloads/tools/workbench/)** qui intègre en prime un formidable outil de modélisation de bases de données.

### PostgreSQL

Parmi les outils disponibles, on trouve **[pgAdmin III](http://www.pgadmin.org/download/)** qui combine les fonctionnalités utilisateurs et administrateurs.

## Clients web

Les deux SGBD disposent chacun d'un client web écrit en PHP et riche en fonctionnalités.

### MySQL

**[http://www.phpmyadmin.net](http://www.phpmyadmin.net/)**

### PostgreSQL

**[http://phppgadmin.sourceforge.net](http://phppgadmin.sourceforge.net/)**
