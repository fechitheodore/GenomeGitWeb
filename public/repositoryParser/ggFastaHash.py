#!/usr/bin/env python

import hashlib
import pickle
import sys

content=[]
#Open the new assembly and loop through the lines
new_assembly=sys.argv[1]
with open(new_assembly,"r") as new_assembly_file:
	for line in new_assembly_file:
		#Append the line to the content list
		line=line.rstrip()
		content.append(line)
#Close the file
new_assembly_file.close()
#Obtain the hash
assembly_hash=str(hashlib.sha1("".join(content).encode("utf-8")).hexdigest())
#Reinititate the content list
content=[]
print(assembly_hash)