Title: Authentification LDAP avec Symfony 2.1 et FOSUserBundle
Author: Alexandre Henriet
Slug: authentification-ldap-avec-symfony-2.1-et-fosuserbundle
Date: 2013-05-08 18:00

## Contexte

Mise en oeuvre d'une authentification Active Directory pour une application **Symfony 2.1.x** avec **FOSUserBundle** et **FR3DLdapBundle**.

## Description du setup

L'authentification s'effectue sur l'**Active Directory** de l'entreprise. Une authentification fructueuse entraine 
l'insertion de l'utilisateur dans la base de données avec ses informations copiées depuis l'annuaire. Les rôles LDAP sont ignorés, l'utilisateur reçoit le rôle **ROLE_USER** par défaut.

## FOSUserBundle et FR3DLdapBundle

Le bundle open source **[FOSUser](https://github.com/FriendsOfSymfony/FOSUserBundle)** fournit à une application Symfony l'ensemble des
fonctionnalités nécessaires à une gestion d'utilisateurs en base de données, de l'enregistrement au recouvrement de mots de passe oubliés. Le bundle **[FR3DLdap](https://github.com/Maks3w/FR3DLdapBundle)** ajoute la dimension LDAP à FOSUserBundle.

## Pré-requis

L'article part du principe que la distribution standard de **[Symfony 2.1.x](http://symfony.com/download)** 
est correctement installée et qu'une base de données MySQL nommée **ldap_project** a été créée.

    mysql> create database ldap_project character set utf8;
    mysql> grant all privileges on ldap_project.* to 'db_user'@'localhost' identified by 'db_p4ss';
    Query OK, 0 rows affected (0.00 sec)

## Configuration base de données

On indique à Symfony comment accéder à la base de données via le **parameters.yml**.

    $ vim app/config/parameters.yml
    parameters:
        database_driver:   pdo_mysql
        database_host:     127.0.0.1
        database_port:     3306
        database_name:     ldap_project
        database_user:     db_user
        database_password: db_p4ss

On valide que la base de données est bien configurée via la console Symfony.

    $ php app/console doctrine:schema:validate
    [Mapping]  OK - The mapping files are correct.
    [Database] OK - The database schema is in sync with the mapping files.


## Installation bundles

On utilise **Composer** pour installer FOSUserBundle et FR3DLdapBundle.

    $ vim composer.json
    {
        "require": {
            ...
            "friendsofsymfony/user-bundle": "*",
            "fr3d/ldap-bundle": "1.6.*"
        }
    }
    $ php composer.phar update --prefer-source
    Loading composer repositories with package information
    Updating dependencies (including require-dev)
      - Installing fr3d/ldap-bundle (1.6.0)
        Cloning v1.6.0

      - Installing friendsofsymfony/user-bundle (v1.3.1)
        Cloning v1.3.1

    Writing lock file
    Generating autoload files
    Clearing the cache for the dev environment with debug true

## Création entité User

L'entité **User** est créée dans un bundle au choix, ici dans **Setsuna/PrivateBundle**.
La classe doit étendre la classe **User** fournie par FOSUserBundle et implémenter l'interface **LdapuserInterface** de FR3DLdapBundle.
Une propriété est créée pour chaque information en provenance de l'AD à dupliquer dans la base de données.

    $ php app/console generate:bundle --namespace=Setsuna/PrivateBundle --dir=src --format=yml --structure=yes --no-interaction
    $ mkdir src/Setsuna/PrivateBundle/Entity 
    $ vim src/Setsuna/PrivateBundle/Entity/User.php
    <?php
    namespace Setsuna\PrivateBundle\Entity;
    use FOS\UserBundle\Entity\User as BaseUser;
    use FR3D\LdapBundle\Model\LdapUserInterface as LdapUserInterface;
    use Doctrine\ORM\Mapping as ORM;

    /**
     * @ORM\Entity
     * @ORM\Table(name="user")
     */
    class User extends BaseUser implements LdapUserInterface
    {
        /**
         * @ORM\Id
         * @ORM\Column(type="integer")
         * @ORM\GeneratedValue(strategy="AUTO")
         */
        protected $id;
        /**
         * @ORM\Column(type="string")
         */
        protected $dn;
        /**
         * @ORM\Column(type="string")
         */
        protected $name;
        /**
         * @ORM\Column(type="string")
         */
        protected $language;
        
        public function __construct()
        {
           parent::__construct();
           if (empty($this->roles)) {
             $this->roles[] = 'ROLE_USER';
           }
        }
        public function setDn($dn) {
            $this->dn = $dn;
        }
        public function getDn() {
            return $this->dn;
        }
        public function setName($name) {
            $this->name = $name;
        }
        public function setLanguage($language) {
            $this->language = $language;
        }
    }

## Configuration sécurité

Le composant sécurité de Symfony est configuré pour utiliser FOSUserBundle et FR3DLdap via le fichier **security.yml**.

    $ cd app/config/
    $ vim app/config/security.yml
    security:
        encoders:
            Setsuna\PrivateBundle\Entity\User: sha512
        role_hierarchy:
            ROLE_ADMIN:       ROLE_USER
            ROLE_SUPER_ADMIN: [ROLE_USER, ROLE_ADMIN, ROLE_ALLOWED_TO_SWITCH]
        providers:
            chain_provider:
                providers: [fos_userbundle, fr3d_ldapbundle]
            fr3d_ldapbundle:
                id: fr3d_ldap.security.user.provider
            fos_userbundle:
                id: fos_user.user_manager
        firewalls:
            dev:
                pattern:  ^/(_(profiler|wdt)|css|images|js)/
                security: false
            main:
                pattern: ^/
                fr3d_ldap: ~
                form_login:
                    provider: fos_userbundle
                    csrf_provider: form.csrf_provider
                    always_use_default_target_path: true
                    default_target_path: /profile
                logout: true
                anonymous: true
        access_control:
            - { path: ^/login$, role: IS_AUTHENTICATED_ANONYMOUSLY }
    
## Configuration FOSUserBundle

On configure FOSUser dans le **config.yml** conformément aux choix précédents.

    $ vim app/config/config.yml
    fos_user:
        db_driver: orm
        firewall_name: main
        user_class: Setsuna\PrivateBundle\Entity\User

## Configuration FR3DLdapBundle

On configure FR3DLdap dans le **config.yml**. En plus de fournir les paramètres d'accès à l'Active Directory, on réalise le mapping entre les champs de l'annuaire et les méthodes de l'entité User.

    $ vim app/config/config.yml
    fr3d_ldap:
        client:
           host:     active.directory.mycompany.be
           port:     389
           version:  3
           username: 'DOMAIN\Bind_user'
           password: 'Bind_password'
           useSsl:   false
        user:
            baseDn: OU=Unit placeholder,DC=domain,DC=mycompany,DC=be
            filter: (&(ObjectClass=Person))
            attributes:
               - { ldap_attr: samaccountname,  user_method: setUsername } # champ login
               - { ldap_attr: sn, user_method: setName }
               - { ldap_attr: preferredlanguage, user_method: setLanguage }
               - { ldap_attr: mail, user_method: setEmail } # setter dans BaseUser

## Activation bundles

On active FOSUserBundle et FR3DLdapBundle dans le kernel de l'application.

    $ vim app/AppKernel.php
    $bundles = array(
        ...
        new FOS\UserBundle\FOSUserBundle(),
        new FR3D\LdapBundle\FR3DLdapBundle(),
    );

## Synchronisation DB

On synchronise la base de données de manière à créer la table de l'entité User.

    $ php app/console doctrine:schema:update --force
    Updating database schema...
    Database schema updated successfully! "1" queries were execute
    mysql> describe user;
    +-----------------------+--------------+------+-----+---------+----------------+
    | Field                 | Type         | Null | Key | Default | Extra          |
    +-----------------------+--------------+------+-----+---------+----------------+
    | id                    | int(11)      | NO   | PRI | NULL    | auto_increment |
    | username              | varchar(255) | NO   |     | NULL    |                |
    | username_canonical    | varchar(255) | NO   | UNI | NULL    |                |
    | email                 | varchar(255) | NO   |     | NULL    |                |
    | email_canonical       | varchar(255) | NO   | UNI | NULL    |                |
    | enabled               | tinyint(1)   | NO   |     | NULL    |                |
    | salt                  | varchar(255) | NO   |     | NULL    |                |
    | password              | varchar(255) | NO   |     | NULL    |                |
    | last_login            | datetime     | YES  |     | NULL    |                |
    | locked                | tinyint(1)   | NO   |     | NULL    |                |
    | expired               | tinyint(1)   | NO   |     | NULL    |                |
    | expires_at            | datetime     | YES  |     | NULL    |                |
    | confirmation_token    | varchar(255) | YES  |     | NULL    |                |
    | password_requested_at | datetime     | YES  |     | NULL    |                |
    | roles                 | longtext     | NO   |     | NULL    |                |
    | credentials_expired   | tinyint(1)   | NO   |     | NULL    |                |
    | credentials_expire_at | datetime     | YES  |     | NULL    |                |
    | dn                    | varchar(255) | NO   |     | NULL    |                |
    | name                  | varchar(255) | NO   |     | NULL    |                |
    | language              | varchar(255) | NO   |     | NULL    |                |
    +-----------------------+--------------+------+-----+---------+----------------+


## Configuration routes

On ajoute les routes de FOSUserBundle dans le **routing.yml**.

    $ vim app/config/routing.yml
    fos_user_security:
        resource: "@FOSUserBundle/Resources/config/routing/security.xml"
    fos_user_profile:
        resource: "@FOSUserBundle/Resources/config/routing/profile.xml"
        prefix: /profile

## Validation du setup

Lorsqu'on accède à l'URL **/login**, le formulaire de connexion de FOSUserBundle s'affiche. Une authentification fructueuse redirige le browser vers **/profile** qui affiche le username et l'email de l'utilisateur connecté.

    profile.show.username: toto
    profile.show.email: toto@mycompany.be

On peut ensuite vérifier dans la base de données que les différents champs ont bien été remplis avec les informations de l'annuaire.

    mysql> select username, email, name, roles from user;
    +----------+--------------------------------+---------+----------------------------+
    | username | email                          | name    | roles                      |
    +----------+--------------------------------+---------+----------------------------+
    | toto     | toto@mycompany.be              | Henriet | a:1:{i:0;s:9:"ROLE_USER";} |
    +----------+--------------------------------+---------+----------------------------+

## Gestion rôles

On utilise les commandes **fos:user:promote** et **fos:user:demote** de la console Symfony pour ajouter et supprimer
des rôles aux utilisateurs stockés dans la base de données.

    $ php app/console fos:user:promote toto
    Please choose a role:ROLE_ADMIN
    Role "ROLE_ADMIN" has been added to user "toto".

## Pour aller plus loin

- [https://github.com/FriendsOfSymfony/FOSUserBundle/blob/master/Resources/doc/index.md](https://github.com/FriendsOfSymfony/FOSUserBundle/blob/master/Resources/doc/index.md#next-steps)
- [https://github.com/Maks3w/FR3DLdapBundle/blob/1.6.x/Resources/doc/index.md](https://github.com/Maks3w/FR3DLdapBundle/blob/1.6.x/Resources/doc/index.md)
- [http://symfony.com/doc/current/book/security.html](http://symfony.com/doc/current/book/security.html)
- [http://symfony.com/doc/current/cookbook/security/custom_provider.html](http://symfony.com/doc/current/cookbook/security/custom_provider.html)
- [http://symfony.com/doc/current/cookbook/security/custom_authentication_provider.html](http://symfony.com/doc/current/cookbook/security/custom_authentication_provider.html)


