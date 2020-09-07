#!/bin/bash

cd $1

## $1 stands for user/project
## $2 stands for git commit hash
## $3 is the location of the ggFastaHash.py
git archive --format tar --prefix=$2/.gnmgit/ $2 | (cd $1 && tar -xf -)


cd $1/$2/

unset commitContent
while IFS=$"\n" read -r; do
	commitContent+=("$REPLY")
done < .gnmgit/RepoMap.txt
[[ $REPLY ]] && commitContent+=("$REPLY")

result=""

for line in "${commitContent[@]}"
do
	#echo $line
	fileName=$(echo $line | awk '{split($0,a," ")};{print a[1]}')
	dataset=$(echo $line | awk '{split($0,a," ")};{print a[2]}')
	genomegit get $fileName > /dev/null 2>&1
	##ggFastaHash.py mirrors genomeGit file hashing, sha1sum doesn't produce same result
	hashValue=$(python $3/ggFastaHash.py $fileName)
	result=$result"{\"name\":\""$fileName"\", \"dataset\":\""$dataset"\", \"fileHash\":\""$hashValue"\", \"commitHash\":\""$2"\"},"
done

result="${result%?}"
echo "["$result"]"

