@echo off
echo Starting seed script...
backend\venv\Scripts\python.exe backend\seed_ahwaan.py > seed_log.txt 2>&1
echo Done.
