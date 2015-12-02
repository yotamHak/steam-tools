// ==UserScript==
// @name        User Checker Helper
// @namespace   http://steamcommunity.com/user/*
// @include     http://www.steamgifts.com/user/*
// @version     1
// @grant       none
// ==/UserScript==

// Adds buttons to user profile
$(function() {
  var newURL = window.location.pathname;
  var pathArray = window.location.pathname.split( '/' );
  var userName = pathArray[2];
  
  $(".featured__table .featured__table__column:nth-child(2) ").append ( ' \
							<div class="featured__table__row"> \
               <div class="featured__table__row__left"> \
                <a target="_blank" class="" style="-webkit-border-radius: 15; -moz-border-radius: 15; border-radius: 15px; font-family: Arial; color: #ffffff; font-size: 12px; background: #4a08d6; padding: 5px 10px 5px 10px; border: solid #fafafa 1px; text-decoration: none;" href="http://www.sgtools.info/sent/' + userName + '/newestfirst">Check Real CV</a> \
                <span></span> \
							  <a target="_blank" class="" style="-webkit-border-radius: 15; -moz-border-radius: 15; border-radius: 15px; font-family: Arial; color: #ffffff; font-size: 12px; background: #4a08d6; padding: 5px 10px 5px 10px; border: solid #fafafa 1px; text-decoration: none;" href="http://www.sgtools.info/nonactivated/' + userName + '">Non Activated</a> \
                <span></span> \
							  <a target="_blank" class="" style="-webkit-border-radius: 15; -moz-border-radius: 15; border-radius: 15px; font-family: Arial; color: #ffffff; font-size: 12px; background: #4a08d6; padding: 5px 10px 5px 10px; border: solid #fafafa 1px; text-decoration: none;" href="http://www.sgtools.info/multiple/' + userName + '">Multipile Wins</a> \
               </div> \
              </div> \
\
' );
});


