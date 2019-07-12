// ==UserScript==
// @name         gog.com currency converter
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.gog.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js
// ==/UserScript==

// This is the FROM currency variable
const _fromCurrency = "RUB";

// This is the TO currency variable
const _toCurrency = "ILS";

// This is the currency symbol
const _toCurrencySymbol = "₪";

let _rate = null;

(function() {
    'use strict';

    GM_addStyle(`
.convert-button {
display: flex;
justify-content: center;
align-items: center;
position: fixed;
top: 65px;
right: 10px;
min-width: 75px;
min-height: 30px;
z-index: 99999;
background: #78387b;
color: white;
box-shadow: 0 0 5px 0 rgba(0,0,0,0.73),inset 0 0 10px 2px #A268BD;
cursor: pointer;
border-radius: 5px;
}
`);

    async function init(){
        let response = await GM_xmlhttpRequestPromise({
            method: "GET",
            url: "https://rate-exchange-1.appspot.com/currency?from=" + _fromCurrency + "&to=" + _toCurrency,
            timeout: 5000,
            headers: {
                "Cache-Control": "no-cache, no-store, must-revalidate"
            }
        });
        let jsonFile = JSON.parse(response.responseText);

        initRate(jsonFile.rate);
        addConvertButton();
    }
    init();
})();

function addConvertButton (){
    $('<div class="convert-button">Convert</div>').appendTo('body');
    $('.convert-button').click(event => {setRatesToCurrentPage()});
};

function initRate(rate){ _rate = rate; };

function setPrice(element){
    if(element.text() == "0" || element.hasClass("converted")){ return; };

    const oldPrice = parseInt(element.text().replace(",",""));
    const newPrice = Math.ceil(parseInt(oldPrice * _rate));

    element.addClass("converted");
    element.text(_toCurrencySymbol + " " + newPrice.toString());
}

function setRatesToCurrentPage(){
    const pricesElements = $("._price");

    for(var index = 0; index < pricesElements.length; index++){
        setPrice($(pricesElements[index]));
    };

    GM_addStyle(`._price::before { content: none !important; }`);
};

function GM_xmlhttpRequestPromise(data) {
    // Data can have a special parameter preventredirect to throw an error if
    // final URL doesn't match initial URL (since there's no actual way to block
    // redirections with XMLHttpRequest)
    return new Promise((resolve, reject) => {
        // Match old callback functions to Promise resolve/reject
        data.onload = (response) => {
            if (data.preventredirect === true && data.url !== response.finalUrl) {
                response.url = data.url;
                response.status = 302;
                reject(new HttpError(response));
            } else if (response.status === 200) {
                resolve(response);
            } else {
                // Apparently errors >= 400 do not count to trigger onerror
                response.url = response.finalUrl;
                reject(new HttpError(response));
            }
        }
        data.ontimeout = (response) => {
            // Apparently Tampermonkey provides no response element for ontimeout
            response.url = data.url;
            reject(new TimeoutError(response));
        }
        data.onerror = (response) => {
            // Seems this is only triggered by network errors
            response.url = response.finalUrl;
            reject(new NetworkError(response));
        }

        GM_xmlhttpRequest(data);
    });
}
