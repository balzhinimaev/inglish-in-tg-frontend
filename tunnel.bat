@echo off
echo Starting SSH tunnel...
ssh -R 8005:localhost:8004 ^
    -o ServerAliveInterval=60 ^
    -o ServerAliveCountMax=3 ^
    user@englishintg.ru