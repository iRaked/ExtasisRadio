/*---------------------------------------------------
    
    MUSIC PLAYER #03 by glenthemes
    
    Initial release: 2019/01/29
    Major code update: 2021/08/27
    Last updated: 2021/08/27
    
    hello gorgeous!
    it's been a tradition of mine to put hidden
    learning resources here in the comments, so
    let's continue that :)
    
    to build a music player you need javascript
    as well as html components. css is wherever you
    want the player to be and how you want it to look!
    
    > audio javascript:
      https://www.w3schools.com/jsref/dom_obj_audio.asp
    > audio html:
      https://www.w3schools.com/tags/tag_audio.asp
    > since this player supports multiple songs,
      ideally we want the last song to stop playing
      when the new one plays. I got some help from
      this answer:
      https://stackoverflow.com/a/40853473/8144506
    
---------------------------------------------------*/

// load play icon
// credit: flaticon.com/free-icon/play-button_151860
var imw = "data:image/svg+xml;charset=utf8,<svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' version='1.1' id='Capa_1' x='0px' y='0px' viewBox='0 0 47.604 47.604' style='enable-background:new 0 0 47.604 47.604;' xml:space='preserve'> <g> <path d='M43.331,21.237L7.233,0.397c-0.917-0.529-2.044-0.529-2.96,0c-0.916,0.528-1.48,1.505-1.48,2.563v41.684 c0,1.058,0.564,2.035,1.48,2.563c0.458,0.268,0.969,0.397,1.48,0.397c0.511,0,1.022-0.133,1.48-0.397l36.098-20.84 c0.918-0.529,1.479-1.506,1.479-2.564S44.247,21.767,43.331,21.237z'/> </g> </svg>";

document.documentElement.style.setProperty('--playicon','url("' + imw + '")');

// load pause icon
// credit: flaticon.com/free-icon/pause-sign_3764
var yeefn = "data:image/svg+xml;charset=utf8,<svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' version='1.1' id='Capa_1' x='0px' y='0px' viewBox='0 0 13.221 13.221' style='enable-background:new 0 0 13.221 13.221;' xml:space='preserve'> <g> <g> <path style='fill:black' d='M3.756,0H1.523C1.029,0,0.629,0.4,0.629,0.894v11.434c0,0.493,0.4,0.893,0.894,0.893h2.233 c0.494,0,0.894-0.399,0.894-0.893V0.894C4.651,0.4,4.251,0,3.756,0z'/> <path style='fill:black;' d='M11.698,0H9.464C8.971,0,8.57,0.4,8.57,0.894v11.434c0,0.493,0.4,0.893,0.894,0.893h2.234 c0.494,0,0.894-0.399,0.894-0.893V0.894C12.591,0.4,12.192,0,11.698,0z'/> </g> </g> </svg>";

document.documentElement.style.setProperty('--pasicon','url("' + yeefn + '")');

$(document).ready(function(){
    $(".tumblr_preview_marker___").remove();
    
    var gab = getComputedStyle(document.documentElement).getPropertyValue("--MusicBox-Left-Or-Right");
    
    $("[glenplayer03]").attr("position",gab);
    
    var apFirst = getComputedStyle(document.documentElement).getPropertyValue("--Autoplay-First-Song");
    
    var apNext = getComputedStyle(document.documentElement).getPropertyValue("--Autoplay-Next-Song");
    
    var apListLoop = getComputedStyle(document.documentElement).getPropertyValue("--Loop-Playlist-Infinitely");
    
    $("[glenplayer03] audio[autoplay]").each(function(){
        $(this).removeAttr("autoplay");
    })
    
    $("[song-name]").each(function(){
        if($(this).next("[artist-name]").length){
            $(this).add($(this).next()).wrapAll("<div txt>");
        } else {
            $(this).wrap("<div txt>")
        }
    })
    
    $("[artist-name]").each(function(){
        if($(this).prev("[song-name]").length){
            if(!$(this).parent().is("[txt]")){
                $(this).add($(this).prev()).wrapAll("<div txt>")
            }
        } else {
            if(!$(this).parent().is("[txt]")){
                $(this).wrap("<div txt>")
            }
        }
    })
    
    $("[album-art]").each(function(){
        if($(this).next("[txt]").length){
            $(this).add($(this).next()).wrapAll("<div gauche>")
        } else {
            $(this).wrap("<div gauche>")
        }
    })
    
    $("[txt]").each(function(){
        if(!$(this).parent().is("[gauche]")){
            if(!$(this).prev("[album-art]").length){
                $(this).wrap("<div gauche>")
            }
        }
    })
    
    $("[gauche]").each(function(){
        $(this).after("<div mcontrols><div class='jouer'></div><div class='arreter'></div></div>");
        $(this).add($(this).next()).wrapAll("<div class='trk-row'>")
    })
    
    $("[musicbox-title]").each(function(){
        $(this).wrap("<div class='wr-invis'>");
        $(this).parent(".wr-invis").nextAll().wrapAll("<div class='ouai'>");
    })
    
    $("[glenplayer03]").show();
    
    $("[glenplayer03] audio").each(function(){
        if($(this).prev(".trk-row").length){
            $(this).appendTo($(this).prev())
        }
        
        var mp3 = $.trim($(this).attr("src"));
        mp3 = mp3.replaceAll("?dl=0","").replaceAll("www.dropbox","dl.dropbox");
        $(this).attr("src",mp3);
    })
    
    $("[mcontrols]").each(function(ce){
        ce = ce + 1;
        $(this).next("audio").attr("id","track-" + ce);
        
        var aud = $(this).next("audio").attr("id");
        aud = document.getElementById(aud);
        
        var autres = $(this).parents(".trk-row").siblings(".trk-row");
        
        if(apFirst == "yes"){
            var snfi = $(this).parents(".trk-row").parent().children(".trk-row:first");
            var snfi_aud = snfi.find("audio").attr("id");
            snfi_aud = document.getElementById(snfi_aud);
        
            snfi_aud.play();
            snfi.find(".arreter").addClass("aff");
            snfi.find(".jouer").addClass("beff");
        }
        
        $(this).click(function(){
            if(aud.paused){
                aud.play();
                
                autres.find(".arreter").removeClass("aff");
                autres.find(".jouer").removeClass("beff");
                
                $(this).find(".arreter").addClass("aff");
                $(this).find(".jouer").addClass("beff");
            } else {
                aud.pause();
                
                $(this).find(".arreter").removeClass("aff");
                $(this).find(".jouer").removeClass("beff");
            }
        })
        
        var that = this;
        
        aud.onended = function(){
            $(that).find(".jouer").removeClass("beff");
        	$(that).find(".arreter").removeClass("aff");
        	
        	if(apNext == "yes"){
            	var nexto = $(this).parents(".trk-row").next(".trk-row");
            	
            	if(nexto.length){
                	var nxtaud = nexto.find("audio").attr("id");
                	nxtaud = document.getElementById(nxtaud);
                	nxtaud.play();
                	nexto.find(".arreter").addClass("aff");
                    nexto.find(".jouer").addClass("beff");
            	} else {
            	    if(apListLoop == "yes"){
                	    // last song, go back to first
                	    var fst = $(".trk-row:first");
                	    var fstaud = fst.find("audio").attr("id");
                	    fstaud = document.getElementById(fstaud);
                	    fstaud.play();
                	    fst.find(".arreter").addClass("aff");
                        fst.find(".jouer").addClass("beff");
            	    }
            	}
        	}
        };
    
    })
    
    $("[glenplayer03] audio[volume]").each(function(){
        var vol = $(this).attr("volume");
        
        if(vol.indexOf("%")){
            vol = vol.substring(0,vol.lastIndexOf("%"));
            vol = vol / 100;
        }
        
        var cette = $(this).attr("id");
        cette = document.getElementById(cette);
        cette.volume = vol;
    })
    
    var auxs = $("[glenplayer03] audio");
    
    auxs.on("play",function(){
        auxs.not(this).each(function(i, autres){
            autres.pause();
            autres.currentTime = 0;
        });
    });
    
    $(".ouai").wrap("<div class='dehors'>");
    
    $(".ouai").each(function(){
        $(this).css("visibility","visible");
        
        setTimeout(() => {
            var everest = $(this).outerHeight();
            $(this).attr("height",everest);
            $(this).css("margin-bottom",-everest);
            
            
            var haha = everest * 3.21;
            
            setTimeout(() => {
                $(this).css("position","initial");
                $(this).css("transition","margin-bottom " + haha + "ms ease-in-out");
            },haha);
        },420);
    })
})//end ready
