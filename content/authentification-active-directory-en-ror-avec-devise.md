Title: Authentification Active Directory en ROR avec Devise
Author: Alexandre Henriet
Slug: authentification-active-directory-en-ror-avec-devise
Date: 2013-03-20 20:30

## Contexte

Mise en oeuvre d'une authentification **Active Directory** pour une application **Ruby on Rails** avec **Devise** et **Devise LDAP
Authenticatable**.

## Description du setup

Une entrée en DB par utilisateur ayant accès, l'authentification s'effectue sur l'Active Directory.

## Application helloworld

Création d'une application **Hello world** pour les besoins de la démonstration.

    $ rails new helloworld
    $ cd helloworld
    $ vim Gemfile
      gem 'therubyracer', :platforms => :ruby
      gem 'thin'
    $ bundle install
    Your bundle is complete! Use `bundle show [gemname]` to see where a bundled gem is installed.
    $ rails g controller home index
    $ rm public/index.html
    $ vim config/routes.rb
    root :to => "home#index"
    $ vim app/views/home/index.html.erb
    <h1>Hello world</h1>
    $ rails s
    >> Listening on 0.0.0.0:3000, CTRL+C to stop
    $ curl http://localhost:3000 | grep "<h1>"
    <h1>Hello world !</h1>


## Installation des gems requises

Ajout des gems Devise et Devise LDAP Authenticatable au Gemfile et mise à jour du bundle.

    $ vim Gemfile
    gem 'devise'
    gem 'devise_ldap_authenticatable'
    $ bundle install
    Your bundle is complete! Use `bundle show [gemname]` to see where a bundled gem is installed.

## Création du modèle User

Génération de la classe User initiale et de la table associée en DB.

    $ rails g model user login:string email:string name:string role:string
    $ rake db:migrate
    ==  CreateUsers: migrating ====================================================
    -- create_table(:users)
       -> 0.0016s
    ==  CreateUsers: migrated (0.0017s) ===========================================

## Configuration de Devise

Devise est installé et configuré en tenant compte du fait qu'on n'utilisera pas la base de données comme backend d'authentification.

    $ rails g devise:install
    $ vim config/environments/development.rb
    config.action_mailer.default_url_options = { :host => 'localhost:3000' }
    $ vim app/views/layouts/application.html.erb
    <body>
    <p class="notice"><%= notice %></p>
    <p class="alert"><%= alert %></p>
    <%= yield %>
    $ rails g devise user

On ne conserve pour ainsi dire **rien** de la migration générée par Devise sinon une **unique key** qu'on applique sur le **login** au lieu de l'email.

    $ vim db/migrate/20130320203007_add_devise_to_users.rb
    class AddDeviseToUsers < ActiveRecord::Migration
      def self.up
        change_table(:users) do |t|
          add_index :users, :login, :unique => true
        end
      end
      def self.down
        # By default, we don't want to make any assumption about how to roll back a migration when your
        # model already existed. Please edit below which fields you would like to remove in this migration.
        raise ActiveRecord::IrreversibleMigration
      end
    end
    $ rake db:migrate
    ==  AddDeviseToUsers: migrating ===============================================
    -- change_table(:users)
    -- add_index(:users, :login, {:unique=>true})
       -> 0.0013s
       -> 0.0254s
    ==  AddDeviseToUsers: migrated (0.0254s) ======================================

## Sécurisation du contrôleur

L'authentification est déclenchée au niveau du contrôleur via un **before_filter**.

    $ vim app/controllers/home_controller.rb
    class HomeController < ApplicationController
      before_filter :authenticate_user!
      def index
      end
    end

## Configuration de Devise LDAP Authenticatable

Installation et configuration pour le modèle User de Device LDAP Authenticatable qui permet à Devise d'utiliser Active Directory
comme backend d'authentification.

    $ rails g devise_ldap_authenticatable:install --user-model=user --update-model=true
    $ vim config/initializers/devise.rb
    Devise.setup do |config|
      config.ldap_logger = true
      config.ldap_create_user = false
      config.ldap_update_password = false
      config.ldap_use_admin_to_bind = true
      config.ldap_auth_username_builder = Proc.new() {|attribute, login, ldap| 'DOMAIN\\' + login }
      config.authentication_keys = [ :login ]
      config.case_insensitive_keys = [ :login ]
      config.strip_whitespace_keys = [ :login ]
    $ vim config/ldap
    development:
      host: ldap_hostname
      port: ldap_port
      attribute: sAMAccountName
      base: OU=Unit placeholder,DC=domain,DC=company,DC=be
      admin_user: DOMAIN\ldap_bind_login
      admin_password: ldap_bind_password
      ssl: false
      # <<: *AUTHORIZATIONS


## Customisation du formulaire de login

Les vues de Devise sont générées dans l'application de manière à pouvoir être customisées.

    $ rails g devise:views
    $ vim app/views/devise/sessions/new.html.erb
    <h2>Sign in</h2>
    <%= form_for(resource, :as => resource_name, :url => session_path(resource_name)) do |f| %>
      <div><%= f.label :login %><br />
      <%= f.text_field :login %></div>


## Customisation du modèle User

Seule la fonctionnalité **ldap_authenticatable** est conservée. Les champs en trop sont supprimés. Des méthodes sont créées
pour donner une valeur provenant de l'AD à certains attributs de l'objet User lors de sa sauvegarde.

    $ vim app/model/user.rb
    class User < ActiveRecord::Base
      devise :ldap_authenticatable
      before_save :get_ldap_name, :get_ldap_email
      attr_accessible :email, :login, :name, :role
      def get_ldap_name
        self.name = Devise::LdapAdapter.get_ldap_param(self.login, 'ldap_name_field')
      end
      def get_ldap_email
        self.email = Devise::LdapAdapter.get_ldap_param(self.login, 'ldap_email_field')
      end
    end

## Création du User

Il ne reste plus qu'à créer le user ayant accès via la **console rails**. Le user reçoit automatiquement de l'Active Directory une valeur pour le nom et l'email.

    irb(main):001:0> me = User.new(:login => 'toto', :role => 'admin')
    => #<User id: nil, login: "toto", name: nil, email: nil, role: "admin", created_at: nil, updated_at: nil>
    irb(main):002:0> me.save
    (0.2ms)  begin transaction
      SQL (30.6ms)  INSERT INTO "users" ("created_at", "email", "login", "name", "role", "updated_at") VALUES (?, ?, ?, ?, ?, ?)  [["created_at", Wed, 20 Mar 2013 20:30:29 UTC +00:00], ["email", "alexandre.henriet@company.be"], ["login", "toto"], ["name", "Henriet Alexandre"], ["role", "admin"], ["updated_at", Wed, 20 Mar 2013 20:30:29 UTC +00:00]]
    (218.1ms)  commit transaction
    => true

## Enjoy

Il est désormais possible de se loguer via le formulaire présenté par l'application.

    Started POST "/users/sign_in" for 127.0.0.1 at 2013-03-20 20:30:41 +0100
    Processing by Devise::SessionsController#create as HTML
      Parameters: {"utf8"=>"✓", "authenticity_token"=>"V6Bb8C0M6TUT+arxQUM0l2S0jeXkRtQYkT/17llKh0Y=", "user"=>{"login"=>"toto", "password"=>"[FILTERED]"}, "commit"=>"Sign in"}
      User Load (0.2ms)  SELECT "users".* FROM "users" WHERE "users"."login" = 'toto' LIMIT 1
      LDAP: LDAP dn lookup: sAMAccountName=toto
      LDAP: LDAP search for login: sAMAccountName=toto
      LDAP: Authorizing user CN=toto,OU=Office name,OU=Unit placeholder,DC=DOMAIN,DC=company,DC=be
      LDAP: LDAP dn lookup: sAMAccountName=toto
      LDAP: LDAP search for login: sAMAccountName=toto
    Redirected to http://localhost:3000/
    Completed 302 Found in 137ms (ActiveRecord: 0.0ms)


## Pour aller plus loin:

* [https://github.com/plataformatec/devise](https://github.com/plataformatec/devise)
* [https://github.com/cschiewek/devise_ldap_authenticatable](https://github.com/cschiewek/devise_ldap_authenticatable)
* [https://github.com/ryanb/cancan](https://github.com/ryanb/cancan)
