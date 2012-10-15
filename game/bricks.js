var canvas, ctx, destinY, score, freeze, mdown;
var object = null;
var objects =  [        "048CF90", //I orange
                        "01480E0", //J green
                        "01590EE", //L cyan
                        "014500E", //O blue
                        "1245E0E", //S magenta
                        "0125EE0", //T yellow
                        "0156E00"  //Z red
                ];
var t0, t1, m0, mousex, mousey=0;
var Map = [];
var changed=true;
var moved = { x:0, side:false, down:false };
var rules = {
        columns: 10,
        rows: 20,
        pixel:20,
        gamespeed: 500,
        tele:4
};

//initialize
function init() {
        //Standardize devices
        document.addEventListener("touchstart", touchHandler, true);
        document.addEventListener("touchmove", touchHandler, true);
        document.addEventListener("touchend", touchHandler, true);
        document.addEventListener("touchcancel", touchHandler, true);

        canvas = document.getElementById('bricks');
	canvas.onselectstart = function () { return false; } //avoid selecting text when dclicking
        ctx = canvas.getContext('2d');

        setSize();

        document.addEventListener("mousedown", mouseDown, true);
        document.addEventListener("mousemove", mouseMove, true);
        document.addEventListener("mouseup", mouseUp, true);

        newGame();
        animate();
}

//Create new game
function newGame(){
        //reset map
        for(var a = 0; a < rules.columns; a++ ) {
                Map[a] = [];
                for( var b = 0; b < rules.rows; b++ )
                        Map[a][b] = 1; //empty fields
        }
        score = 0;
        freeze = false;
        changed=true;
        newobj();
        t0=t1=new Date();
}

//Build turnable objects
function hextobject(hexstring) {
        this.x=rules.tele;
        this.y=0;
        this.plot = new Array(4); //statisk 4
        this.color="#";
        for(i=0; i<hexstring.length; i++) {
                if(i<4) {
                this.plot[i] = new Array(2); //statisk 2
                bin=parseInt(hexstring.charAt(i), 16).toString(2);
                for(a=4-bin.length;a>0;a--) bin='0'+bin;
                this.plot[i][0]=parseInt(bin.slice(2), 2);
                this.plot[i][1]=parseInt(bin.slice(0,2), 2);
                } else this.color+=hexstring.charAt(i);
        }
}

//rotate brick
function rotate() {
        var array=new Array(4)
        mx=my=4;
        //rotate
        for(i=0;i<4;i++) {
                array[i]=new Array(2);
                array[i][0]=4-object.plot[i][1];
                array[i][1]=object.plot[i][0];
                if(mx>array[i][0])mx=array[i][0];
                if(my>array[i][1])my=array[i][1];
        }
        //trim
        for(i=0;i<4;i++) {
                array[i][0]-=mx;
            array[i][1]-=my;
        }
        return array;
}

//Check if rotating is possible
function tryRotate(){
        plots=rotate();
        if(onMap(getDimension(plots,false),object.x)&&availMap(plots,object.x,object.y)) {
                object.plot=plots;
                changeDestinY();
                changed=true;
        }
}

//Check if moving is possible
function tryMove(move){
        var x=parseInt(object.x+move);
        if(onMap(getDimension(object.plot,false),x)&&availMap(object.plot,x,object.y)) {
                object.x=x;
                changeDestinY();
                changed=true;
        }
}

//get dimensions of brick
function getDimension(plots,height) {
        val=0;
        dim=(height)?1:0;
        for(i=0;i<4;i++) if(val<plots[i][dim]) val=plots[i][dim];
        return val;
}

//is it available on map
function availMap(plots,ofx,ofy) {
        for(i=0;i<plots.length;i++) if(Map[(plots[i][0]+ofx)][(plots[i][1]+ofy)]!=1) return false;
        return true;
}

//check if x values are on map
function onMap(width,ofx) {

        if(ofx>=0&&ofx<(rules.columns-width)) return true;
        else return false;
}

// Scans the map for filled lines and removes them.
function removeLines(height,ofy){
        var bonus = 0;
        for(y=0;y<=height;y++){
                full=true;
                tekst="";

                for(x=0;x<rules.columns;x++) if(typeof Map[x][y+ofy]!='string') {
                        full=false;
                        break;
                }
                if(full) {
                        bonus++;
                        score += 10*bonus;
                        for(a=y+ofy;a>=0;a--) for(x=0;x<rules.columns;x++)
                                Map[x][a] = (a>1)?Map[x][a-1]:1;
                }
        }
}

//create new object
function newobj() {
        object = new hextobject(objects[Math.floor(Math.random()*objects.length)]);
        for(i=0;i<4;i++) if(typeof Map[(object.x+object.plot[i][0])][(object.plot[i][1])]==='string') newGame();
        changeDestinY();
}

//change the "guide" object
function changeDestinY(){
        for(y=object.y;y<rules.rows;y++) for( x=0; x < 4; x++ )
                if(((y+object.plot[x][1]+1)>=rules.rows)||(typeof Map[(object.x+object.plot[x][0])][(y+object.plot[x][1]+1)] === 'string' )) {
                        destinY=y;
                        return;
                }
}

//set guide object
function setDestinY(){
        object.y=destinY;
        t0=0;
}

//draw the game on the canvas element
function draw() {
        for(i=0;i<4;i++) Map[(object.x+object.plot[i][0])][(destinY+object.plot[i][1])] = 3;
        for(i=0;i<4;i++) Map[(object.x+object.plot[i][0])][(object.y+object.plot[i][1])] = 2;

        var c,x,y;
        ctx.clearRect( 0, 0, rules.pixel * rules.columns, rules.pixel * rules.rows );

        ctx.fillStyle = '#ccc';
        ctx.font = 'italic bold ' + rules.pixel + 'px sans-serif';
        ctx.textBaseline = 'top';
        ctx.textAlign = 'right';
        ctx.fillText(score+" ", rules.pixel*rules.columns, parseInt(0.2*rules.pixel));


        for(y=rules.rows-1;y>=0; y--){
                ctx.save();
                ctx.translate(0, y*rules.pixel); // vertically
                for( x = 0; x < rules.columns; x++ ){
                        c = Map[x][y];
                        ctx.save();
                        ctx.translate(x*rules.pixel, 0 ); // horizontally
                        if(c!=1) {
                                if(c==2||c==3) {
                                        Map[x][y]=1;
                                        ctx.fillStyle=(c==2?object.color:"#cfcfcf");
                                } else ctx.fillStyle=c;

                                ctx.fillRect( 0, 0, rules.pixel, rules.pixel );
                        }
                        ctx.restore();
                }

                ctx.restore();
        }
        changed=false;
}
//this is the main loop
function loop() {
        t1 = new Date();
        if( t1 - t0 > rules.gamespeed ){
                t0 = t1;

                for( i=0; i < 4; i++ )
                        if(((object.y+object.plot[i][1]+1)>=rules.rows)||(typeof Map[(object.x+object.plot[i][0])][(object.y+object.plot[i][1]+1)] === 'string' )) freeze=true

                if(freeze){
                        for(i=0;i<4;i++) Map[(object.x+object.plot[i][0])][(object.y+object.plot[i][1])]=object.color;
                        removeLines(getDimension(object.plot,true),object.y)
                        newobj();
                        mdown=false;
                } else object.y++
                freeze        = false;
                changed=true;
        }
        if(changed) draw();
}


// shim layer with setTimeout fallback
window.requestAnimFrame = (function(){
return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          window.oRequestAnimationFrame      ||
          window.msRequestAnimationFrame     ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();

//request animation function
function animate(){
        requestAnimFrame(animate);
        loop();
}

// define keys
document.onkeydown = function(e) {
        var key = e.which;

        if( key === 38 ) tryRotate();
        else if( key === 37 ) tryMove(-1);
        else if( key === 39 ) tryMove(1);
        else if( key === 40 ) setDestinY();
        else if( key === 70 ) requestFullScreen();
        else return true;

        return false;
}

//Touch converter
function touchHandler(event) {
    var touches = event.changedTouches,
        first = touches[0],
        type = "";
                switch(event.type) {
                        case "touchstart": type = "mousedown"; break;
                        case "touchmove":  type="mousemove"; break;
                        case "touchend":   type="mouseup"; break;
                        default: return;
                }
    //initMouseEvent(type, canBubble, cancelable, view, clickCount,
    //           screenX, screenY, clientX, clientY, ctrlKey,
    //           altKey, shiftKey, metaKey, button, relatedTarget);

    //ninja click(convert the event from touch)
    var simulatedEvent = document.createEvent("MouseEvent");
    simulatedEvent.initMouseEvent(type, true, true, window, 1,
                              first.screenX, first.screenY,
                              first.clientX, first.clientY, false,
                              false, false, false, 0/*left*/, null);
    first.target.dispatchEvent(simulatedEvent);
    event.preventDefault();
}
//mouse down
function mouseDown(event) {
        mousex=event.clientX;
        mousey=event.clientY;
        mdown=true;
}
//mouse moving
function mouseMove(event){
        if(mdown) {
                var mx=Math.round((event.clientX-mousex)/rules.pixel); //mouse x
                var my=Math.round((event.clientY-mousey)/rules.pixel); //mouse y

                if(moved.side||(!moved.down&&Math.abs(mx)>Math.abs(my))) {
                        while(moved.x!=mx)
                                if(moved.x<mx) {
                                        tryMove(1);
                                        moved.x++;
                                } else {
                                        tryMove(-1);
                                        moved.x--;
                                }
                        moved.side=true;
                } else if((!moved.side&&Math.abs(my)>Math.abs(mx)&&my>1)) {
                        setDestinY();
                        moved.down=true;
                }
        }
}
//Mouse up
function mouseUp(event) {

        if(!moved.side&&!moved.down) tryRotate();

        mdown=false;
        moved={x:0,side:false,down:false};

}

//go fullscreen
function requestFullScreen() {
    var elem = document.getElementById("game");
    // Supports most browsers and their versions.
    var requestMethod = elem.requestFullScreen || elem.webkitRequestFullScreen || elem.mozRequestFullScreen || elem.msRequestFullScreen;

    if (requestMethod) { // Native full screen.
        requestMethod.call(elem);
    }
}

// set game size
function setSize() {
        var width = document.getElementById('game').offsetWidth;
        var height = document.getElementById('game').offsetHeight;
        ratio_game = rules.columns/rules.rows;
        ratio_disp = width/height;

        rules.pixel = Math.floor((ratio_game>ratio_disp) ? (width/rules.columns) : (height/rules.rows));

        if(ratio_game>ratio_disp) {
                ctx.canvas.width = width;
                ctx.canvas.height = width/ratio_game;
        } else {
                ctx.canvas.height = height;
                ctx.canvas.width = height*ratio_game;
        }
}

window.onresize = function(event) { setSize(); }
window.onload = init;
