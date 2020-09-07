#!/bin/bash

##$1 - environment git data directory, $2 - user, $3 - projectname

cd $1

mkdir $2

cd $2

mkdir $3

cd $3

git init --bare