Title: Protect your Symfony 5 login form with fail2ban and iptables 
Author: Alexandre Henriet
Slug: protect-your-symfony-5-login-form-with-fail2ban-and-iptables 
Date: 2021-05-04 18:00
Lang: en

## Context

Mitigate brute force attacks on a Symfony 5 application login form by blocking
attacker's IP address at Linux firewall level after 3 unsuccessful attempts.

## Description

First, we'll add both a Monolog channel and handler to the Symfony application
to create a dedicated log file to store unsuccessful login attempts IP addresses.

Secondly, we'll create an Event Listener bound to the security.authentication.failure
Symfony event that will use the new Monolog service to generate log entries.

Thirdly, we'll create a fail2ban filter able to parse the custom log file to extract the IP addresses.

Finally, we'll setup a fail2ban jail using the log file, the filter to parse it, the number of authorized attempts and the ban duration.

## Environment and versions used

### Linux server

    $ hostnamectl
      Operating System: Debian GNU/Linux 9 (stretch)
                Kernel: Linux 4.9.120-xxxx-std-ipv6-64
          Architecture: x86-64

### Fail2ban

    $ fail2ban-server --version
    Fail2Ban v0.9.6

### Symfony framework

    $ php bin/console about
    -------------------- -------------------------------------------
      Symfony
    -------------------- -------------------------------------------
      Version              5.2.7

## Dedicated log file to store IP addresses

In this first part, we create a new **f2b** Monolog service, writing to a custom **f2b.log** file. It requires to add both a channel and a handler to Symfony's Monolog configuration.

We create the configuration file **config/packages/monolog.yaml** because we want our new channel and handler to exist in each APP_ENV.

Creating a new channel is as simple as naming it. For the handler, you'll have to provide a type, a log file path, channels to log and a log level.

    monolog:
      channels: ['f2b']
      handlers:
        f2b:
          type: stream
          path: "%kernel.logs_dir%/f2b.log"
          level: info
          channels: ["f2b"]

That's it ! You can check in Symfony's console that your new Monolog service is available.

    $ php bin\console debug:autowiring |grep f2b
    Psr\Log\LoggerInterface $f2bLogger (monolog.logger.f2b)

## Listening to authentication failure events

In this second part, we create an Event Listener service bound to the **security.authentication.failure** event. When Symfony will dispatch those, the configured method will treat them and log IP addresses. We create the file **src/EventListener/AuthenticationFailureListener.php** containing the following class :

    <?php
    namespace App\EventListener;
    use Psr\Log\LoggerInterface;
    use Symfony\Component\Security\Core\Event\AuthenticationFailureEvent;

    class AuthenticationFailureListener
    {
        private $logger;
        public function __construct(LoggerInterface $logger) {
            $this->logger = $logger;
        }
        public function onAuthenticationFailure(AuthenticationFailureEvent $event) {
            // $credentials = $event->getAuthenticationToken()->getCredentials();
            $this->logger->info($_SERVER['REMOTE_ADDR']);
        }
    }

All we care about in the log is the client IP address. 
Be careful if you log raw submitted data like login or email, malicious inputs could eventually prevent proper parsing by the fail2ban filter. 

We create a service definition to turn the class into an Event Listener, specifying the concerned event and the handler method, and we pass it the right Monolog service instance. Edit **config/services.yaml** to add : 

    App\EventListener\AuthenticationFailureListener:
      tags:
        - { name: kernel.event_listener, event: security.authentication.failure, method: onAuthenticationFailure }
      arguments:
        - '@monolog.logger.f2b'

That's over for Symfony part, let's try if it works as expected.

## Populating the custom log

If you followed the previous steps, login attempts using erroneous credentials should now populate a **f2b.log** log file located in the application var/log/ folder with HTTP clients IP addresses.

    $ cat var\log\f2b.log
    [2021-05-04T17:36:35.496525+00:00] f2b.INFO: 192.168.1.100 [] []

Time to jump to fail2ban's configuration.

## Fail2ban filter to parse the custom log file

A fail2ban filter contains a regular expression matching the log file line's format.
The placeholder **<HOST\>** must be used where the IP should appear. 

On Debian, I create **/etc/fail2ban/filter.d/symfony-app.conf** with the following content :

    [Definition]
    failregex = ^.* f2b.INFO: <HOST> \[\] \[\]$

The **fail2ban-filter** command can be used to test a filter against a log file.

    $ fail2ban-regex /path/to/var/log/f2b.log /etc/fail2ban/filter.d/symfony-app.conf  

    Running tests
    =============
    Use   failregex filter file : symfony-app, basedir: /etc/fail2ban
    Use         log file : /path/to/var/log/f2b.log
    Use         encoding : UTF-8
    Results
    =======
    Failregex: 2 total
    |-  #) [# of hits] regular expression
    |   1) [2] ^.* f2b.INFO: <HOST> \[\] \[\]$
    `-
    Ignoreregex: 0 total
    Date template hits:
    |- [# of hits] date format
    |  [2] Year-Month-Day[T ]24hour:Minute:Second(?:\.Microseconds)?(?:Zone offset)?
    `-
    Lines: 2 lines, 0 ignored, 2 matched, 0 missed
    [processed in 0.00 sec]

Each line of the log file is matched like it should. Notice that fail2ban is smart enough to find and parse Monolog's timestamps. A log file must have recognized timestamps in order to be used with fail2ban.

## The fail2ban jail

The jail defines the log file to monitor, the filter to use to parse it, the number of tolerated failed attempts and ban time.

On Debian, I edit **/etc/fail2ban/jail.d/defaults-debian.conf** to add :

    [symfony-app]
    enabled = true
    filter = symfony-app
    action = iptables-multiport[name=symfony, port="http,https"]
    logpath = /path/to/var/log/f2b.log
    bantime = 3600
    maxretry = 3
    findtime = 60

The filter is the one created at previous step and the log file is the one generated by Symfony. The action denies access to port 80 and 443 to the IP in iptables for a duration of **bantime** seconds if **maxretry** log entries are found in **findtime** seconds.

Fail2ban is restarted so the changes take effect :

    $ sudo systemctl restart fail2ban

The newly configured jail should appear in the jail list displayed with :

    $ sudo fail2ban-client status
    Status
    |- Number of jail:      50
    `- Jail list:   ..., ..., symfony-app, ...

## Test the new brute force attacks mitigation system

**Before doing this test, ensure that you won't lose complete access to your server !!**

After 3 unsuccessful login attempts, the Symfony application should not be responding anymore, meaning that fail2ban successfully added your IP to the ban list.

You can see the current ban list using the **fail2ban-client** command :

    $ sudo fail2ban-client status symfony-app
    Status for the jail: symfony-app
    |- Filter
    |  |- Currently failed: 0
    |  |- Total failed:     3
    |  `- File list:        /path/to/var/log/f2b.log
    `- Actions
      |- Currently banned: 1
      |- Total banned:     1
      `- Banned IP list:   192.168.1.100

Behind the scene, fail2ban blocked the IP in Linux's firewall : 

    $ sudo iptables -L -n
    Chain INPUT (policy ACCEPT)
    target     prot opt source               destination
    f2b-symfony  tcp  --  0.0.0.0/0            0.0.0.0/0            multiport dports 80,443
    ...
    Chain f2b-symfony (1 references)
    target     prot opt source               destination
    DROP       all  --  192.168.1.100        0.0.0.0/0
    RETURN     all  --  0.0.0.0/0            0.0.0.0/0

You can unban an IP using : 

    $ sudo fail2ban-client set symfony-app unbanip 192.168.1.100
    192.168.1.100

## Go further

- [https://www.fail2ban.org/wiki/index.php/MANUAL_0_8](https://www.fail2ban.org/wiki/index.php/MANUAL_0_8)
- [https://www.netfilter.org/documentation/](https://www.netfilter.org/documentation/)
- [https://symfony.com/doc/current/components/security/authentication.html#authentication-events](https://symfony.com/doc/current/components/security/authentication.html#authentication-events)
- [https://symfony.com/doc/current/event_dispatcher.html#creating-an-event-listener](https://symfony.com/doc/current/event_dispatcher.html#creating-an-event-listener)
- [https://symfony.com/doc/current/reference/events.html](https://symfony.com/doc/current/reference/events.html)
- [https://symfony.com/doc/current/logging.html#handlers-writing-logs-to-different-locations](https://symfony.com/doc/current/logging.html#handlers-writing-logs-to-different-locations)
- [https://symfony.com/blog/new-in-symfony-5-2-login-throttling](https://symfony.com/blog/new-in-symfony-5-2-login-throttling)
