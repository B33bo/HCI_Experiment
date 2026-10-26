@echo off
set /p msg=Commit message (or type cancel to cancel): 

if /i "%msg%"=="cancel" exit

git add .
git commit -m "%msg%"
git push

pause