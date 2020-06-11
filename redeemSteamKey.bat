:: https://github.com/yotamHak/Steam-Related/wiki/redeemSteamKey.bat

@echo off

:: Getting key from clipboard
@powershell -sta "add-type -as System.Windows.Forms; [windows.forms.clipboard]::GetText()" > key.txt
set /p $Key= < key.txt

echo %$Key% | findstr /r "[a-zA-Z0-9][a-zA-Z0-9][a-zA-Z0-9][a-zA-Z0-9][a-zA-Z0-9]-[a-zA-Z0-9][a-zA-Z0-9][a-zA-Z0-9][a-zA-Z0-9][a-zA-Z0-9]-[a-zA-Z0-9][a-zA-Z0-9][a-zA-Z0-9][a-zA-Z0-9][a-zA-Z0-9]" > nul
if %errorlevel%==1 (
	echo Clipboard doesn't contain a Steam Key.
	pause
	exit
)

:: Set Discord hook to this variable
set "$DiscordWebHookUrl="

:: Set session id from steam to this variable
set "$sessionid="

set "$ContentType=Content-Type: application/x-www-form-urlencoded; charset=UTF-8"
set "$Accept=accept: application/json"
set "$Origin=Origin: https://store.steampowered.com"
set "Cache=Cache-Control: no-cache"
set "$ContentLength=Content-Length: 64"
set "$Url=https://store.steampowered.com/account/ajaxregisterkey/"

:: Activating on Steam
curl -X POST -b cookies.txt -H "%$Cache%" -H "%$ContentType%" -d "sessionid=%$sessionid%" -d "product_key=%$Key%" %$Url% > res.json

:: Cleaning up the response
@powershell -sta "(Get-Content -Path 'res.json').replace('`','') | Set-Content cleanResponse.json;"
@powershell -sta "(Get-Content -Path 'cleanResponse.json').replace('""','') | Set-Content cleanResponse.json;"
:: Getting app name
@powershell -sta "select-string -Path 'cleanResponse.json' -Pattern 'line_item_description:([^}]+)' -AllMatches | foreach-object { $_.Matches } | foreach-object { $_.Value }" > appname.txt
@powershell -sta "(Get-Content -Path 'appname.txt').replace('line_item_description:','') | Set-Content appname.txt;"
:: Getting app id
@powershell -sta "select-string -Path 'cleanResponse.json' -Pattern '{packageid:([^,]+)' -AllMatches | foreach-object { $_.Matches } | foreach-object { $_.Value }" > appid.txt
@powershell -sta "(Get-Content -Path 'appid.txt').replace('{packageid:','') | Set-Content appid.txt;"

:: Saving into Variables
set /p $cleanResponse= < cleanResponse.json
set /p $appName= < appname.txt
set /p $appId= < appid.txt
set "appSubUrl=\"url\":\"https://store.steampowered.com/sub/%$appId%/\""

:: Checking activation response
type "cleanResponse.json" | find "purchase_result_details:0" > nul
if %errorlevel%==0 (
	set "color=\"color\":65280"
	set "title=\"title\":\"Activated\""
	set "description=\"description\":\"Key activated successfuly!\""
	set "result=%$appName% - %$Key%: Key activated successfuly!"
)
type "cleanResponse.json" | find "purchase_result_details:9" > nul
if %errorlevel%==0 (
	set "color=\"color\":12845619"
	set "title=\"title\":\"Fail - Already Owns\""
	set "description=\"description\":\"This Steam account already owns the product contained in this offer. To access them, visit your library in the Steam client.\""
	set "result=%$appName% - %$Key%: Already Owns"
)
type "cleanResponse.json" | find "purchase_result_details:13" > nul
if %errorlevel%==0 (
	set "color=\"color\":12845619"
	set "title=\"title\":\"Fail - Unavailable\""
	set "description=\"description\":\"Sorry, but this product is not available for purchase in this country. Your product key has not been redeemed.\""
	set "result=%$appName% - %$Key%: Unavailable"
)
type "cleanResponse.json" | find "purchase_result_details:14" > nul
if %errorlevel%==0 (
	set "color=\"color\":12845619"
	set "title=\"title\":\"Fail - Invalid\""
	set "description=\"description\":\"The product code you have entered is not valid. Please double check to see if you have mistyped your key. I, L, and 1 can look alike, as can V and Y, and 0 and O.\""
	set "result=%$appName% - %$Key%: Invalid"
)
type "cleanResponse.json" | find "purchase_result_details:15" > nul
if %errorlevel%==0 (
	set "color=\"color\":12845619"
	set "title=\"title\":\"Fail - Duplicate\""
	set "description=\"description\":\"The product code you have entered has already been activated by a different Steam account. This code cannot be used again. Please contact the retailer or online seller where the code was purchased for assistance.\""
	set "result=%$appName% - %$Key%: Duplicate"
)
type "cleanResponse.json" | find "purchase_result_details:24" > nul
if %errorlevel%==0 (
	set "color=\"color\":12845619"
	set "title=\"title\":\"Fail - Missing Base Game\""
	set "description=\"description\":\"The product code you have entered requires ownership of another product before activation. If you are trying to activate an expansion pack or downloadable content, please first activate the original game, then activate this additional content.\""
	set "result=%$appName% - %$Key%: Missing Base Game"
)
type "cleanResponse.json" | find "purchase_result_details:50" > nul
if %errorlevel%==0 (
	set "color=\"color\":12845619"
	set "title=\"title\":\"Fail - Wallet Code\""
	set "description=\"description\":\"The code you have entered is from a Steam Gift Card or Steam Wallet Code.\""
	set "result=%$appName% - %$Key%: Wallet Code"
)
type "cleanResponse.json" | find "purchase_result_details:53" > nul
if %errorlevel%==0 (
	set "color=\"color\":12845619"
	set "title=\"title\":\"Fail - Too Many Activations\""
	set "description=\"description\":\"There have been too many recent activation attempts from this account or Internet address. Please wait and try your product code again later.\""
	set "result=%$appName% - %$Key%: Too Many Activations"
)

cls

:: Sending result to Discord
curl -H "Content-Type: application/json" -X POST -d "{ \"username\": \"%$appName%: %$Key%\",\"content\": \"%$cleanResponse%\", \"embeds\":[{%appSubUrl%,%title%,%description%,%color%,\"author\": {\"name\": \"%$appName%: %$Key%\"}}]}" %$DiscordWebHookUrl%

:: Cleaning up files
del res.json
del cleanResponse.json
del key.txt
del appname.txt
del appid.txt

echo %result%
pause
exit
