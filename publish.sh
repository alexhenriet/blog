#!/usr/bin/env bash

# Config
OUTPUT=/home/alex/www/blog/output
ARCHIVE=/tmp/blog.tgz

# Script
DIR=`pwd`
cd $OUTPUT
rm -rf archives.html categories.html tags.html
tar -czf $ARCHIVE *
echo -n 'user: ' && read USER
scp $ARCHIVE $USER@vks:/home/$USER/www/blog/
ssh $USER@vks "cd /home/$USER/www/blog && tar -zxf blog.tgz && rm blog.tgz"
cd $DIR
