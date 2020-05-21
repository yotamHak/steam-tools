@echo off

@powershell -sta "add-type -as System.Windows.Forms; [windows.forms.clipboard]::GetText()" > key.txt
set /p $Key= < key.txt

echo %$Key% | findstr /r "[a-zA-z0-9][a-zA-z0-9][a-zA-z0-9][a-zA-z0-9][a-zA-z0-9]-[a-zA-z0-9][a-zA-z0-9][a-zA-z0-9][a-zA-z0-9][a-zA-z0-9]-[a-zA-z0-9][a-zA-z0-9][a-zA-z0-9][a-zA-z0-9][a-zA-z0-9]" > nul
if %errorlevel%==1 (
	echo Clipboard doesn't contain a Steam Key.
	Pause
	exit
)

set "$ContentType=Content-Type: application/x-www-form-urlencoded; charset=UTF-8"
set "$Accept=accept: application/json"
set "$Origin=Origin: https://store.steampowered.com"
set "$DNT=DNT: 1"
set "Cache=Cache-Control: no-cache"
set "$ContentLength=Content-Length: 64"
set "$Url=https://store.steampowered.com/account/ajaxregisterkey/"
set "$sessionid=859e41f7f39da804c05088ba"
set "$DiscordWebHookUrl=" ::Fill with Discord webhook

:: Activating on Steam
curl -X POST -b cookies.txt -H "%$Cache%" -H "%$DNT%" -H "%$ContentType%" -d "sessionid=%$sessionid%" -d "product_key=%$Key%" %$Url% > res.json

:: Cleaning up the response
@powershell -sta "(Get-Content -Path 'res.json').replace('`','') | Set-Content cleanResponse.json;"
@powershell -sta "(Get-Content -Path 'cleanResponse.json').replace('""','') | Set-Content cleanResponse.json;"

:: Saving into Variables
set /p $cleanResponse= < cleanResponse.json

:: Checking activation response
type "cleanResponse.json" | find "purchase_result_details:0" > nul
if %errorlevel%==0 (
	set "color=\"color\":65280"
	set "title=\"title\":\"Activated\""
	set "description=\"description\":\"Key activated successfuly!\""
	set "result=%$Key%: Key activated successfuly!"
)
type "cleanResponse.json" | find "purchase_result_details:9" > nul
if %errorlevel%==0 (
	set "color=\"color\":12845619"
	set "title=\"title\":\"Fail - Already Owns\""
	set "description=\"description\":\"This Steam account already owns the product contained in this offer. To access them, visit your library in the Steam client.\""
	set "result=%$Key%: Already Owns"
)
type "cleanResponse.json" | find "purchase_result_details:13" > nul
if %errorlevel%==0 (
	set "color=\"color\":12845619"
	set "title=\"title\":\"Fail - Unavailable\""
	set "description=\"description\":\"Sorry, but this product is not available for purchase in this country. Your product key has not been redeemed.\""
	set "result=%$Key%: Unavailable"
)
type "cleanResponse.json" | find "purchase_result_details:14" > nul
if %errorlevel%==0 (
	set "color=\"color\":12845619"
	set "title=\"title\":\"Fail - Invalid\""
	set "description=\"description\":\"The product code you have entered is not valid. Please double check to see if you have mistyped your key. I, L, and 1 can look alike, as can V and Y, and 0 and O.\""
	set "result=%$Key%: Invalid"
)
type "cleanResponse.json" | find "purchase_result_details:15" > nul
if %errorlevel%==0 (
	set "color=\"color\":12845619"
	set "title=\"title\":\"Fail - Duplicate\""
	set "description=\"description\":\"The product code you have entered has already been activated by a different Steam account. This code cannot be used again. Please contact the retailer or online seller where the code was purchased for assistance.\""
	set "result=%$Key%: Duplicate"
)
type "cleanResponse.json" | find "purchase_result_details:24" > nul
if %errorlevel%==0 (
	set "color=\"color\":12845619"
	set "title=\"title\":\"Fail - Missing Base Game\""
	set "description=\"description\":\"The product code you have entered requires ownership of another product before activation. If you are trying to activate an expansion pack or downloadable content, please first activate the original game, then activate this additional content.\""
	set "result=%$Key%: Missing Base Game"
)
type "cleanResponse.json" | find "purchase_result_details:50" > nul
if %errorlevel%==0 (
	set "color=\"color\":12845619"
	set "title=\"title\":\"Fail - Wallet Code\""
	set "description=\"description\":\"The code you have entered is from a Steam Gift Card or Steam Wallet Code.\""
	set "result=%$Key%: Wallet Code"
)
type "cleanResponse.json" | find "purchase_result_details:53" > nul
if %errorlevel%==0 (
	set "color=\"color\":12845619"
	set "title=\"title\":\"Fail - Too Many Activations\""
	set "description=\"description\":\"There have been too many recent activation attempts from this account or Internet address. Please wait and try your product code again later.\""
	set "result=%$Key%: Too Many Activations"
)

cls

:: Sending result to Discord
curl -H "Content-Type: application/json" -X POST -d "{ \"content\": \"%$cleanResponse%\", \"embeds\":[{%title%,%description%,%color%,\"author\": {\"name\": \"%$Key%\"}}]}" %$DiscordWebHookUrl%

:: Cleaning up files
del res.json
del cleanResponse.json
del key.txt

ECHO %result%
PAUSE
EXIT
