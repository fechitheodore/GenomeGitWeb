#!/bin/bash

projectfolder=$1
if [ -d "$projectfolder" ]; then
    cd $1
    gitres=$(git rev-parse HEAD)
    if [ "$gitres" != "HEAD" ]; then
        git log --pretty=format:%H%x09%ai%x09%f
    fi
fi