// Variables
var IS_THERE_ANY_DEAL_HEADER = "isthereanydeal URL";
var TIMESTAMP_HEADER = "Added";
var ON_UPDATE_HEADER = "Name";
var SHEET_NAME = 'Keys';
var BUNDLED_BACKGROUND_COLOR = '#f6b26b';
var NON_BUNDLED_BACKGROUND_COLOR = '#66ccff';
var STEAM_API_KEY = ""; // Must fill
var STEAM_ID64 = ""; // Must fill
var OWN_STATUS_HEADER = "Own Status";
var MISSING_TEXT = "Missing";
var OWN_TEXT = "Own";
//-------------------------------------------------------------------------------------------

function onEdit(event)
{
  Logger.log(SpreadsheetApp.getActive().getUrl());
  addDateStamp(event);
  handleBundled(event); 
}

function addIsThereAnyDealUrl(event){
  var ss = event.source.getSheetByName(SHEET_NAME);
  var title = _encodeName(event.value);
  
  var headers = ss.getRange(1, 1, 1, ss.getLastColumn()).getValues();
  var isthereanydealUrl = "https://isthereanydeal.com/#/page:game/info?plain=" + title;
  var urlCol = headers[0].indexOf(IS_THERE_ANY_DEAL_HEADER);
  
  var urlToUpdate = ss.getRange(event.source.getActiveRange().getRow(), urlCol + 1);
  urlToUpdate.setValue(isthereanydealUrl);
}

function getSteamOwnStatusAndSetIt(text, event){
  var myString = "something format_abc";
  var myRegexp = /([steampowered.com]*)(\d+)/g;
  var match = myRegexp.exec(text);
  var appID = match[0];
  
  var data = {
    "steamid":STEAM_ID64,
    "appids_filter": [parseInt(appID)]
  };
  
  //var url = "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=" + STEAM_API_KEY + "&input_json=" + JSON.stringify(data);
  var url = "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=" + STEAM_API_KEY + "&steamid=" + STEAM_ID64;

  var response = UrlFetchApp.fetch(url);
  //Logger.log(response);
  var text = response.getContentText();
  
      var ss = event.source.getSheetByName(SHEET_NAME);
    var headers = ss.getRange(1, 1, 1, ss.getLastColumn()).getValues();
    var urlCol = headers[0].indexOf(OWN_STATUS_HEADER);
    var ownStatusToUpdate = ss.getRange(event.source.getActiveRange().getRow(), urlCol + 1);
  
  if (text.indexOf(appID) !== -1){
    ownStatusToUpdate.setValue(OWN_TEXT);
  }
  else{
    ownStatusToUpdate.setValue(MISSING_TEXT);
  }
}

function handleBundled(event){
  addIsThereAnyDealUrl(event);
  
  var ss = event.source.getSheetByName(SHEET_NAME);   
  var changedCell= event.source.getActiveRange().getA1Notation();
  var title = _encodeName(event.value);
  
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

function addDateStamp(event)
{ 
  var timezone = "GMT-5";
  var timestamp_format = "MM-dd-yyyy"; // Timestamp Format. 
  var updateColName = ON_UPDATE_HEADER;
  var timeStampColName = TIMESTAMP_HEADER;
  var sheet = event.source.getSheetByName(SHEET_NAME); //Name of the sheet where you want to run this script.

  var actRng = event.source.getActiveRange();
  var editColumn = actRng.getColumn();
  var index = actRng.getRowIndex();
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues();
  var dateCol = headers[0].indexOf(timeStampColName);
  var updateCol = headers[0].indexOf(updateColName); updateCol = updateCol+1;
  if (dateCol > -1 && index > 1 && editColumn == updateCol) { // only timestamp if 'Last Updated' header exists, but not in the header row itself!
    var cell = sheet.getRange(index, dateCol + 1);
    var date = Utilities.formatDate(new Date(), timezone, timestamp_format);
    cell.setValue(date);
  }
}

function _romanize (num) {
  var key = ["","i","ii","iii","iv","v","vi","vii","viii","ix"];
  return key[Number(num)];
}

function _encodeName(str){
  str = str.toLowerCase(); //lowercase
  str = str.replace(/[1-9]/g, _romanize);//_romanize digits
  str = str.replace(/(^the[^a-z])|([^a-z]the[^a-z])|([^a-z]the$)/g, ""); //remove "the", but not e.g. "other" or "them"
  str = str.replace(/\+/g, "plus");    //spell out "plus"
  str = str.replace(/\&/g, "and");    //spell out "and"
  str = str.replace(/[^a-z0]/g, '');    //remove remaining invalid characters, like spaces, braces, hyphens etc
  return str;
}
