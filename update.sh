#!/usr/bin/sh
# ref: https://stackoverflow.com/a/5017265/11302760
# source: https://link.wxhboy.cn/avam

now_date=$(date +%Y%m%d%H%M%S)
new_branch="$(whoami)/$now_date"
current_branch="$(git rev-parse --abbrev-ref HEAD)"
message="update at $(date +%F' '%T)"

git add -A

echo -n -e "commit message?"
read inputMessage
if [ -n "$inputMessage" ]; then
    message="$inputMessage"
fi

git commit -nm $message
git checkout --orphan $new_branch

git add -A
export GIT_COMMITTER_DATE="Sat Dec 20 1997 05:20:11 (CST) (UTC+8)"
git commit -nm "add my porfile" --date "$GIT_COMMITTER_DATE"
unset GIT_COMMITTER_DATE
git push origin $new_branch:main --force

if [ -n "$(git config remote.archive.url)" ]; then
  git push archive $current_branch:main
  git tag -a "$now_date-tag" -m "$(date +%F' '%T)"
  git push archive "$now_date-tag"
  git checkout $current_branch
  git branch -D $new_branch
fi

echo "update success"