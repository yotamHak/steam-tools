// Variables

// Steam API
var STEAM_API_KEY = "";
var STEAM_ID64 = "";

// Headers
var IS_THERE_ANY_DEAL_HEADER = "isthereanydeal URL";
var TIMESTAMP_HEADER = "Added";
var ON_UPDATE_HEADER = "Name";
var OWN_STATUS_HEADER = "Own Status";
var STEAM_URL_HEADER = "Steam URL";
var CARDS_HEADER = "Cards";

// Texts
var MISSING_TEXT = "Missing";
var OWN_TEXT = "Own";

// Colors
var BUNDLED_BACKGROUND_COLOR = '#f6b26b';
var NON_BUNDLED_BACKGROUND_COLOR = '#66ccff';

var SHEET_NAME = 'Keys';

//-------------------------------------------------------------------------------------------

var ss, title, headers, changedCell;

function onEdit(event)
{
  ss = event.source.getSheetByName(SHEET_NAME);
  title = _encodeName(event.value);
  headers = ss.getRange(1, 1, 1, ss.getLastColumn()).getValues();
  changedCell= event.source.getActiveRange().getA1Notation();
  
  if(title == "" || title == undefined || changedCell.indexOf('A') === -1){
    return;
  }
  
  addDateStamp(event);
  handleBundled(event);
}

// Checks if the game got cards and adds the result---------------------------------------------
function checkIfGotCards(event, appId){
  var url = "http://api.enhancedsteam.com/market_data/card_prices/?appid=" + appId;
  
  var options = {
    "followRedirects": true,
    "muteHttpExceptions":false
  }
  
  var response = UrlFetchApp.fetch(url,options);
  var text = response.getContentText();
  
  var urlCol = headers[0].indexOf(CARDS_HEADER);
  var cell = ss.getRange(event.source.getActiveRange().getRow(), urlCol + 1);
  
  if (text.length > 0){
    var link = "http://www.steamcardexchange.net/index.php?gamepage-appid-" + appId;
    var displayName = "Have";
    cell.setFormula("=hyperlink(\""+link+"\";\"" + displayName + "\")");
  }
  else{
    cell.setValue("Missing");
  }
}

// Adds an Steam url----------------------------------------------------------------------------
function addSteamUrl(event, appId){
  var url = "http://store.steampowered.com/app/" + appId + "/";
  var urlCol = headers[0].indexOf(STEAM_URL_HEADER);
  
  var urlToUpdate = ss.getRange(event.source.getActiveRange().getRow(), urlCol + 1);
  urlToUpdate.setValue(url);
}

// Adds an isThereAnyDeal url---------------------------------------------------------------------
function addIsThereAnyDealUrl(event){
  var isthereanydealUrl = "https://isthereanydeal.com/#/page:game/info?plain=" + title;
  var urlCol = headers[0].indexOf(IS_THERE_ANY_DEAL_HEADER);
  
  var urlToUpdate = ss.getRange(event.source.getActiveRange().getRow(), urlCol + 1);
  urlToUpdate.setValue(isthereanydealUrl);
}

// Checks to see if you own the game or not, needs STEAM_API_KEY and STEAM_ID64--------------------
function getSteamOwnStatusAndSetIt(text, event){
  var myRegexp = /[steampowered.com/app/](\d+)[/]/g;
  var match = myRegexp.exec(text);
  var appID = match[1];
  
  addSteamUrl(event, appID);
  checkIfGotCards(event, appID);
  
  var data = {
    "steamid":STEAM_ID64,
    "appids_filter": [parseInt(appID)]
  };
  
  var payload = "&input_json=" + encodeURIComponent(JSON.stringify(data));
  var url = "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=" + STEAM_API_KEY + payload;
  var response = UrlFetchApp.fetch(url);
  var text = response.getContentText();
  
  var urlCol = headers[0].indexOf(OWN_STATUS_HEADER);
  var ownStatusToUpdate = ss.getRange(event.source.getActiveRange().getRow(), urlCol + 1);
  
  if (text.indexOf(appID) !== -1){
    ownStatusToUpdate.setValue(OWN_TEXT);
  }
  else{
    ownStatusToUpdate.setValue(MISSING_TEXT);
  }
}

// Checks if the game have been bundled before and sets the right color--------------------------------
function handleBundled(event){
  addIsThereAnyDealUrl(event);
  
  var url = 'https://isthereanydeal.com/ajax/game/info?plain=' + title;
  var response = UrlFetchApp.fetch(url);
  var text = response.getContentText();
  
  getSteamOwnStatusAndSetIt(text, event);
  
  if (text.indexOf("This game has been included in following Specials") !== -1){
    ss.getRange(changedCell).setBackgroundColor(BUNDLED_BACKGROUND_COLOR);
  }
  else{
    ss.getRange(changedCell).setBackgroundColor(NON_BUNDLED_BACKGROUND_COLOR);
  }
}

// Adds a timestamp when editing-----------------------------------------------------------------------
function addDateStamp(event)
{ 
  var timezone = "GMT-5";
  var timestamp_format = "MM-dd-yyyy"; // Timestamp Format. 
  var updateColName = ON_UPDATE_HEADER;
  var timeStampColName = TIMESTAMP_HEADER;
  
  var actRng = event.source.getActiveRange();
  var editColumn = actRng.getColumn();
  var index = actRng.getRowIndex();
  var headers = ss.getRange(1, 1, 1, ss.getLastColumn()).getValues();
  var dateCol = headers[0].indexOf(timeStampColName);
  var updateCol = headers[0].indexOf(updateColName); updateCol = updateCol+1;
  if (dateCol > -1 && index > 1 && editColumn == updateCol) { // only timestamp if 'Last Updated' header exists, but not in the header row itself!
    var cell = ss.getRange(index, dateCol + 1);
    var date = Utilities.formatDate(new Date(), timezone, timestamp_format);
    cell.setValue(date);
  }
}

// Misc Methods------------------------------------------------------------------------------------------
function _romanize (num) {
  var key = ["","i","ii","iii","iv","v","vi","vii","viii","ix"];
  return key[Number(num)];
}

function _encodeName(str){
  str = str.toLowerCase(); //lowercase
  str = str.replace(/[1-9]/g, _romanize);//_romanize digits
  //str = str.replace(/(^the[^a-z])|([^a-z]the[^a-z])|([^a-z]the$)/g, ""); //remove "the", but not e.g. "other" or "them"
  str = str.replace(/([^a-z]the[^a-z])|([^a-z]the$)/g, ""); //remove "the", but not e.g. "other" or "them"
  str = str.replace(/\+/g, "plus");    //spell out "plus"
  str = str.replace(/\&/g, "and");    //spell out "and"
  str = str.replace(/[^a-z0]/g, '');    //remove remaining invalid characters, like spaces, braces, hyphens etc
  return str;
}
