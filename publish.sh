#!/usr/bin/env bash

# Config
OUTPUT=/home/alex/www/blog/output
ARCHIVE=/tmp/blog.tar.bz2

# Script
DIR=`pwd`
cd $OUTPUT
rm -rf archives.html categories.html tags.html
tar -cjf $ARCHIVE *
echo -n 'user: ' && read USER
scp $ARCHIVE $USER@ks2-proxy:/home/$USER/www/blog.henriet.eu/
ssh $USER@ks2-proxy "cd /home/$USER/www/blog.henriet.eu/ && tar -jxf blog.tar.bz2 && rm blog.tar.bz2"
cd $DIR
