@echo off
echo Starting coordinator seed...
backend\venv\Scripts\python.exe backend\seed_ahwaan_coordinators.py > seed_coords_log.txt 2>&1
echo Done.
