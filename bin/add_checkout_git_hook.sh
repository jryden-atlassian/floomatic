#!/usr/bin/env bash
root_folder=$(git rev-parse --show-toplevel)
command="$(npm bin)/floobits-workspace --share -w \`basename -s .git \\\`git config --get remote.origin.url\\\`\`-\`git rev-parse --abbrev-ref HEAD\` --no-browser"

if [[ $# -ge 1 ]]; then
    command="$command -o $1"
fi

mkdir -p ${root_folder}/.git/hooks/ && touch ${root_folder}/.git/hooks/post-checkout

chmod +x ${root_folder}/.git/hooks/post-checkout
echo ${command} > ${root_folder}/.git/hooks/post-checkout
