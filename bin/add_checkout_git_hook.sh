#!/usr/bin/env bash

command="./bin/workspace --share -w \`basename -s .git \\\`git config --get remote.origin.url\\\`\`-\`git rev-parse --abbrev-ref HEAD\` --no-browser"

if [ $# -ge 1 ]; then
    command="$command -o $1"
fi

echo $command > .git/hooks/post-checkout
