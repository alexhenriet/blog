#!/usr/bin/env python
# -*- coding: utf-8 -*- #

import urllib

AUTHOR = u'Alexandre Henriet'
SITENAME = u'blog.henriet.eu' 
SITEURL = ''
TIMEZONE = 'Europe/Paris'
DEFAULT_LANG = u'fr'
DEFAULT_PAGINATION = 0 
THEME = 'themes/blog'

def quoteplus_filter(url):
    return urllib.quote_plus(url)

JINJA_FILTERS = {
    'quoteplus': quoteplus_filter,
}
