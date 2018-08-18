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
    return urllib.parse.quote_plus(url)

JINJA_FILTERS = {
    'quoteplus': quoteplus_filter,
}

FEED_ALL_ATOM = None
CATEGORY_FEED_ATOM = None
TRANSLATION_FEED_ATOM = None
AUTHOR_FEED_ATOM = None
AUTHOR_FEED_RSS = None
