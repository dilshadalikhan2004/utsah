@echo off
echo Installing requirements...
backend\venv\Scripts\pip.exe install -r backend\requirements.txt > install_log.txt 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Install failed. >> install_log.txt
    exit /b %ERRORLEVEL%
)
echo Running seed script...
backend\venv\Scripts\python.exe backend\seed_ahwaan.py >> install_log.txt 2>&1
echo Done.
