#!/bin/bash

# Script to commit files one by one
echo "Starting to commit files one by one..."

# Get all files excluding .git and node_modules
files=$(find . -type f -not -path './.git/*' -not -path './node_modules/*' -not -path './client/node_modules/*' -not -path './backend/node_modules/*')

# Counter for commits
commit_count=1

# Process each file
for file in $files; do
    echo "Commit $commit_count: Adding $file"
    
    # Add the file
    git add "$file"
    
    # Commit with descriptive message
    git commit -m "Add $file"
    
    # Increment counter
    ((commit_count++))
    
    echo "Committed: $file"
done

echo "Total commits made: $((commit_count-1))"
echo "All files have been committed successfully!"
