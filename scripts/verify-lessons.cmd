@echo off
setlocal
if defined VSDEVCMD goto :initialize
set "_cpp_vsdevcmd=%ProgramFiles%\Microsoft Visual Studio\18\Community\Common7\Tools\VsDevCmd.bat"
if exist "%_cpp_vsdevcmd%" goto :initialize
set "_cpp_vsdevcmd=%ProgramFiles%\Microsoft Visual Studio\2022\Community\Common7\Tools\VsDevCmd.bat"
if exist "%_cpp_vsdevcmd%" goto :initialize
set "_cpp_vsdevcmd=%ProgramFiles%\Microsoft Visual Studio\2022\BuildTools\Common7\Tools\VsDevCmd.bat"
:initialize
if defined VSDEVCMD set "_cpp_vsdevcmd=%VSDEVCMD%"
if not exist "%_cpp_vsdevcmd%" (
  echo Set VSDEVCMD to the installed Visual Studio VsDevCmd.bat path.
  exit /b 2
)
call "%_cpp_vsdevcmd%" -no_logo -arch=x64 >nul
if errorlevel 1 exit /b %errorlevel%
node --experimental-strip-types scripts\verify-lessons.mjs
exit /b %errorlevel%
