Title: Installation de la gem mysql2 sous Solaris 10 
Author: Alexandre Henriet
Slug: installation-de-la-gem-mysql2-sous-solaris-10 
Date: 2013-07-01 06:00

## Contexte

L'installation de la **gem mysql2** permettant d'utiliser **MySQL** depuis **Ruby** plante sous Solaris 10.

    $ ruby -v
    ruby 1.9.3p429 (2013-05-15 revision 40747) [sparc-solaris2.10]

## Situation initiale

L'erreur suivante à l'exécution est révélatrice de l'**absence de la gem** mysql2 sur le système.

    /home/alex/ruby/ruby-1.9.3/lib/ruby/1.9.1/rubygems/custom_require.rb:36:in `require': cannot load such file -- mysql2 (LoadError)
      from /home/alex/ruby/ruby-1.9.3/lib/ruby/1.9.1/rubygems/custom_require.rb:36:in `require'
      from ./mysql.rb:3:in `<main>'

## Client MySQL threadsafe

La gem mysql2 est un binding autour de la libmysql en version threadsafe. Non disponible sur le système cible et à défaut
de privilèges root, le client MySQL est compilé depuis les sources avec un user non privilégié. La version **[5.1.68](http://downloads.mysql.com/archives.php?p=mysql-5.1)** est à priori la dernière version compilable **sans CMake**.

    $ wget http://downloads.mysql.com/archives/mysql-5.1/mysql-5.1.68.tar.gz
    $ tar xf mysql-5.1.68.tar.gz
    $ ./configure --prefix=/home/alex/ruby/mysql --with-pthread --with-pic --without-server --without-docs --without-man
    $ make && make install

## Tentative d'installation de la gem

La libmysql n'étant pas installée dans un path standard, on passe le chemin vers le **mysql_config** en paramètre 
à **gem install**, toutefois l'étape d'édition des liens plante.

    $ gem install mysql2 -- --with-mysql-config=/home/alex/ruby/mysql/bin/mysql_config
    Fetching: mysql2-0.3.11.gem (100%)
    Building native extensions.  This could take a while...
    ERROR:  Error installing mysql2:
            ERROR: Failed to build gem native extension.
    
            /home/alex/ruby/ruby-1.9.3/bin/ruby extconf.rb --with-mysql-config=/home/alex/ruby/mysql/bin/mysql_config
    checking for rb_thread_blocking_region()... yes
    checking for rb_wait_for_single_fd()... yes
    checking for mysql.h... yes
    checking for errmsg.h... yes
    checking for mysqld_error.h... yes
    creating Makefile
    
    make
    compiling client.c
    In file included from ./mysql2_ext.h:39,
                     from client.c:1:
    ./client.h:42:7: warning: no newline at end of file
    compiling mysql2_ext.c
    In file included from ./mysql2_ext.h:39,
                     from mysql2_ext.c:1:
    ./client.h:42:7: warning: no newline at end of file
    compiling result.c
    In file included from ./mysql2_ext.h:39,
                     from result.c:1:
    ./client.h:42:7: warning: no newline at end of file
    linking shared-object mysql2/mysql2.so
    ld: elf error: file /home/alex/ruby/opt/lib: elf_begin: I/O error: region read: Is a directory
    ld: fatal: File processing errors. No output written to mysql2.so
    collect2: ld returned 1 exit status
    make: *** [mysql2.so] Error 1
    
    Gem files will remain installed in /home/alex/ruby/ruby-1.9.3/lib/ruby/gems/1.9.1/gems/mysql2-0.3.11 for inspection.
    Results logged to /home/alex/ruby/ruby-1.9.3/lib/ruby/gems/1.9.1/gems/mysql2-0.3.11/ext/mysql2/gem_make.out

## Modification extconf.rb

Pour que la compilation du module **mysql2.so** s'effectue sans erreur, il est nécessaire de modifier dans le **extconf.rb** 
de la gem la ligne qui définit les **$LDFLAGS**. On remplace la valeur par le path du dossier contenant **libmysqlclient_r.so.16**.

    $ cd /home/alex/ruby/ruby-1.9.3/lib/ruby/gems/1.9.1/gems/mysql2-0.3.11/ext/mysql2
    $ vim extconf.rb
    if hard_mysql_path = $libs[%r{-L(/[^ ]+)}, 1]
      $LDFLAGS << "-L/home/alex/ruby/mysql/lib/mysql -R/home/alex/ruby/mysql/lib/mysql -Wl"
    end

## Test compilation

Avant de réempaqueter la gem, on s'assure que le module compile désormais sans erreur.

    $ ruby extconf.rb --with-mysql-config=/home/alex/ruby/mysql/bin/mysql_config
    checking for rb_thread_blocking_region()... yes
    checking for rb_wait_for_single_fd()... yes
    checking for mysql.h... yes
    checking for errmsg.h... yes
    checking for mysqld_error.h... yes
    creating Makefile
    $ make
    $ ldd mysql2.so
      libmysqlclient_r.so.16 => /home/alex/ruby/mysql/lib/mysql/libmysqlclient_r.so.16
    $ rm mysql2.so

## Réempaquetage de la gem mysql2

Afin de pouvoir la déployer proprement, la gem mysql2 modifiée est réempaquetée. 
Le dossier de la gem n'étant pas un dépôt git cloné, on remplace les **git ls-files** du fichier **gemspec**
par un simple **find** qui retourne l'ensemble des fichiers des dossiers passés en paramètres.

    $ cd /home/alex/ruby/ruby-1.9.3/lib/ruby/gems/1.9.1/gems/mysql2-0.3.11
    $ vim mysql2.gemspec
    Gem::Specification.new do |s|
      ...
      s.files = `find .`.split("\n")
      ...
      s.test_files = `find spec examples`.split("\n")
      ...
    end
    $ gem build mysql2.gemspec
    WARNING:  no description specified
      Successfully built RubyGem
      Name: mysql2
      Version: 0.3.11
      File: mysql2-0.3.11.gem

## Installation de la gem mysql2 custom

Pour installer le fichier **mysql2-0.3.11.gem**, on le passe en paramètre à **gem install**.

    $ gem install mysql2-0.3.11.gem
    Building native extensions.  This could take a while...
    Successfully installed mysql2-0.3.11
    1 gem installed
    $ cd /home/alex/ruby/ruby-1.9.3/
    $ find . -name mysql*
    ./lib/ruby/gems/1.9.1/gems/mysql2-0.3.11
    ./lib/ruby/gems/1.9.1/gems/mysql2-0.3.11/lib/mysql2
    ./lib/ruby/gems/1.9.1/gems/mysql2-0.3.11/lib/mysql2/mysql2.so
    ./lib/ruby/gems/1.9.1/gems/mysql2-0.3.11/lib/mysql2.rb
    ./lib/ruby/gems/1.9.1/gems/mysql2-0.3.11/spec/mysql2
    ./lib/ruby/gems/1.9.1/gems/mysql2-0.3.11/mysql2.gemspec
    ./lib/ruby/gems/1.9.1/gems/mysql2-0.3.11/ext/mysql2
    ./lib/ruby/gems/1.9.1/gems/mysql2-0.3.11/ext/mysql2/mysql2.so
    ./lib/ruby/gems/1.9.1/gems/mysql2-0.3.11/ext/mysql2/mysql2_ext.c
    ./lib/ruby/gems/1.9.1/gems/mysql2-0.3.11/ext/mysql2/mysql2_ext.h
    ./lib/ruby/gems/1.9.1/gems/mysql2-0.3.11/ext/mysql2/mysql2_ext.o
    ./lib/ruby/gems/1.9.1/specifications/mysql2-0.3.11.gemspec
    ./lib/ruby/gems/1.9.1/cache/mysql2-0.3.11.gem
    $ gem list mysql
    *** LOCAL GEMS ***
    mysql2 (0.3.11)

## Enjoy

Si tout s'est bien passé, il est désormais possible de charger mysql2 depuis un script ou irb.

    $ irb
    irb(main):001:0> require 'mysql2'
    => true

## Erreurs rencontrées

### Librairie MySQL threadsafe manquante

    ld: library not found for -lmysqlclient_r

Le fichier **libmysqlclient_r.so.16** est manquant. Certains commentaires proposent de créer un lien symbolique
vers la version non threadsafe **libmysqlclient.so.16** si il est présent. Dans l'article une libmysql threadsafe
est entièrement compilée à défaut des privilèges root pour tester la solution.

### Uninitialized constant Mysql2::Error

    irb(main):001:0> require 'mysql2'
    NameError: uninitialized constant Mysql2::Error
      from /home/alex/ruby/ruby-1.9.3/lib/ruby/site_ruby/1.9.1/rubygems/core_ext/kernel_require.rb:45:in `require'
      from /home/alex/ruby/ruby-1.9.3/lib/ruby/site_ruby/1.9.1/rubygems/core_ext/kernel_require.rb:45:in `require'
      from (irb):1
      from /home/alex/ruby/ruby-1.9.3/bin/irb:12:in `<main>'

Le **mysql.so** est accessible par Ruby par contre les fichiers **.rb** censés l'accompagner ne sont pas présents
à ses côtés dans le folder **lib**, voir point sur le réempaquetage de la gem.

    ├── mysql2
    │   ├── client.rb
    │   ├── em.rb
    │   ├── error.rb
    │   ├── mysql2.so
    │   ├── result.rb
    │   └── version.rb
    └── mysql2.rb

### Conflit entre librairies

    irb(main):001:0> require 'mysql2'
    RuntimeError: Incorrect MySQL client library version! This gem was compiled for 5.0.67 but the client library is 5.1.68.
      from /home/alex/ruby/ruby-1.9.3/lib/ruby/1.9.1/rubygems/custom_require.rb:36:in `require'
      from /home/alex/ruby/ruby-1.9.3/lib/ruby/1.9.1/rubygems/custom_require.rb:36:in `require'
      from /home/alex/ruby/ruby-1.9.3/lib/ruby/site_ruby/1.9.1/sparc-solaris2.10/mysql2.rb:9:in `<top (required)>'
      from /home/alex/ruby/ruby-1.9.3/lib/ruby/1.9.1/rubygems/custom_require.rb:36:in `require'
      from /home/alex/ruby/ruby-1.9.3/lib/ruby/1.9.1/rubygems/custom_require.rb:36:in `require'
      from (irb):1
      from /home/alex/ruby/ruby-1.9.3/bin/irb:12:in `<main>'

Plusieurs librairies MySQL sont présentes sur le système et un **--with-mysql-config** a été oublié ou les **LDFLAGS**
ont été mal définis.

## Pour aller plus loin

- [https://github.com/brianmario/mysql2](https://github.com/brianmario/mysql2)
- [http://timelessrepo.com/making-ruby-gems](http://timelessrepo.com/making-ruby-gems)
- [http://www.eyrie.org/~eagle/notes/rpath.html](http://www.eyrie.org/~eagle/notes/rpath.html)


